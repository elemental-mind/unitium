import { Observable } from "../eventPropagation.js";
import { TestSuite } from "./testSuite.js";
import { readFile, unlink, writeFile } from "fs/promises";
import { TestHook } from "./testHook.js";
import { TestFunction } from "./testFunction.js";
import { FileSystemHost, Project, SourceFile, SyntaxKind } from "ts-morph";
import { ITestSuiteConstructor } from "../interfaces.js";
import { EnvironmentDecorator } from "../setups/testSetup.js";
import path from "path";

export class TestModule extends Observable
{
    public testSuites: TestSuite[] = [];
    public environmentModules = new Map<EnvironmentDecorator, string>();
    public temporaryFiles: string[] = [];

    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
    }

    private constructor(
        public filePath: string
    )
    {
        super();
    }

    static async fromFile(filePath: string)
    {
        const testModule = new TestModule(filePath);
        await testModule.analyzeFile();
        return testModule;
    }

    async run()
    {
        this.runStarted.resolve();

        const suiteRuns = [];
        for (const suite of this.testSuites)
            suiteRuns.push(suite.run());

        await Promise.all(suiteRuns);

        this.runCompleted.resolve();
    }

    private async analyzeFile()
    {
        const skeletizer = new Skeletizer(this.filePath, await readFile(this.filePath, { encoding: "utf8" }));

        let module;

        if (skeletizer.needsSkeletizing())
        {
            const skeletonModuleName = this.filePath.split(".").splice(-1, 0, "skeleton").join(".");
            await writeFile(skeletonModuleName, await skeletizer.getStrippedModule());
            this.temporaryFiles.push(skeletonModuleName);

            module = await import(skeletonModuleName);
        }
        else
        {
            module = await import(this.filePath);
        }

        for (const exportedClass of Object.values(module))
            this.testSuites.push(new TestSuite(this, exportedClass as ITestSuiteConstructor));
    }

    async createEnvironmentModuleAndReturnPath(environmentDecorator: EnvironmentDecorator): Promise<string>
    {
        if (this.environmentModules.has(environmentDecorator))
            return this.environmentModules.get(environmentDecorator)!;

        //We insert the environment type before the .ts extension => example.test.ts -> example.test.environment.ts
        const environmentModulePath = this.filePath.split(".").splice(-1, 0, environmentDecorator.name).join(".");

        await writeFile(environmentModulePath, await this.getEnvironmentModuleString(environmentDecorator));
        this.temporaryFiles.push(environmentModulePath);
        this.environmentModules.set(environmentDecorator, environmentModulePath);
        return environmentModulePath;
    }

    private async getEnvironmentModuleString(environmentDecorator: EnvironmentDecorator)
    {
        const testFunctionsForEnvironment = this.tests.filter(test => test.executionEnvironment === environmentDecorator);
        const testHooksForEnvironment = this.testSuites.flatMap(suite => suite.hooks).filter(hook => hook.environment === environmentDecorator);

        const source = await readFile(this.filePath, { encoding: "utf-8" });

        const compiler = new TreeShaker(this.filePath, source, [...testFunctionsForEnvironment, ...testHooksForEnvironment]);

        return await compiler.getCompiledModule();
    }

    async cleanup()
    {
        for (const file of this.temporaryFiles)
        {
            await unlink(file);
        }
    }
}

class TreeShaker
{
    project: Project;
    fileSystem: FileSystemHost;
    sourceFile: SourceFile;

    constructor(
        public fileName: string,
        public source: string,
        public targetFunctions: (TestHook | TestFunction)[]
    )
    {
        this.project = new Project({ useInMemoryFileSystem: true });
        this.fileSystem = this.project.getFileSystem();
        this.sourceFile = this.project.createSourceFile("module.ts", source);
    }

    async getCompiledModule()
    {
        const environmentView = new Map<TestSuite, (TestFunction | TestHook)[]>();

        for (const fct of this.targetFunctions)
        {
            if (environmentView.has(fct.testSuite))
                environmentView.get(fct.testSuite)!.push(fct);
            else
                environmentView.set(fct.testSuite, [fct]);
        }

        const usedClassNames = [...environmentView.keys()].map(suite => suite.className);

        this.removeIrrelevantSuites(usedClassNames);

        for (const [suite, tests] of environmentView.entries())
        {
            this.removeIrrelevantTestFunctions(suite.className, tests.map(fct => fct.functionName));
        }

        await this.sourceFile.save();

        let preTransformString = "";
        let currentString = this.sourceFile.print();
        while (preTransformString !== currentString)
        {
            preTransformString = currentString;
            this.sourceFile.fixUnusedIdentifiers();
            await this.sourceFile.save();
            currentString = this.sourceFile.print();
        }

        await this.makeImportsAbsolute();
        await this.sourceFile.emit();
        return await this.fileSystem.readFile("module.js");
    }

    removeIrrelevantSuites(relevantSuiteNames: string[])
    {
        this.sourceFile
            .getClasses()
            .filter(cls => cls.isExported() && !relevantSuiteNames.includes(cls.getName()!))
            .forEach(cls => cls.remove());
    }

    removeIrrelevantTestFunctions(className: string, relevantTestNames: string[])
    {
        this.sourceFile
            .getClass(className)!
            .getInstanceMethods()
            .filter(method => !method.hasModifier(SyntaxKind.PrivateKeyword) && !method.hasModifier(SyntaxKind.ProtectedKeyword) && !relevantTestNames.includes(method.getName()))
            .forEach(method => method.remove());
    }

    async makeImportsAbsolute()
    {
        for (const importDeclaration of this.sourceFile.getImportDeclarations())
        {
            const moduleSpecifier = importDeclaration.getModuleSpecifier();
            if (moduleSpecifier && !moduleSpecifier.getText().startsWith("."))
            {
                const absoluteImportPath = path.join(path.dirname(this.fileName), moduleSpecifier.getLiteralText());
                importDeclaration.setModuleSpecifier(`"${absoluteImportPath}"`);
            }
        }

        await this.sourceFile.save();
    }
}

class Skeletizer
{
    private project: Project;
    private sourceFile: SourceFile;

    constructor(private filePath: string, private source: string)
    {
        this.project = new Project({ useInMemoryFileSystem: true });
        this.sourceFile = this.project.createSourceFile(filePath, source);
    }

    needsSkeletizing()
    {
        return this.sourceFile
            .getImportDeclarations()
            .some(imp => imp.getModuleSpecifier().getText().endsWith('.test-setup.ts'));
    }

    async getStrippedModule(): Promise<string>
    {
        this.removeNonSetupModules();
        this.removeNonExportedClasses();
        this.removeNonPublicMethods();

        await this.sourceFile.save();
        return this.sourceFile.print();
    }

    private removeNonSetupModules()
    {
        this.sourceFile
            .getImportDeclarations()
            .filter(imp => 
            {
                const importFileName = imp.getModuleSpecifier().getText()
                const isSetupImport = importFileName.endsWith('.test-setup.ts');
                const isDecoratorFile = path.join(path.dirname(this.filePath), importFileName) === path.join(path.dirname(this.filePath), "../decorators.ts");
                return !(isSetupImport || isDecoratorFile);
            })
            .forEach(imp => imp.remove());
    }

    private removeNonExportedClasses()
    {
        this.sourceFile
            .getClasses()
            .filter(cls => !cls.isExported())
            .forEach(cls => cls.remove());
    }

    private removeNonPublicMethods()
    {
        for (const cls of this.sourceFile.getClasses())
        {
            for (const member of cls.getInstanceMethods())
            {
                if (!member.hasModifier(SyntaxKind.PublicKeyword))
                    member.remove();
            }
        }
    }
}