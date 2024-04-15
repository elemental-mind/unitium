import path from "path";
import { Observable } from "../eventPropagation.js";
import { TestSuite } from "./testSuite.js";
import { FileSystemHost, ModuleKind, Project, ScriptTarget, SourceFile, SyntaxKind } from "ts-morph";
import type { TestHook } from "./testHook.js";
import type { TestFunction } from "./testFunction.js";
import type { ITestSuiteConstructor } from "../interfaces.js";
import type { EnvironmentDecorator } from "../setups/testSetup.js";
import { File } from "./file.js";

export class TestModule extends Observable
{
    public testSuites: TestSuite[] = [];
    public environmentModules = new Map<EnvironmentDecorator, File>();
    public temporaryFiles: File[] = [];

    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
    }

    private constructor(
        public file: File
    )
    {
        super();
    }

    static async fromFile(file: File)
    {
        const testModule = new TestModule(file);
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
        const skeletizer = new Skeletizer(this.file, await this.file.getContents());

        let module;

        if (skeletizer.needsSkeletizing())
        {
            const skeletizedFile = new File(this.file.filePath.split(".").toSpliced(-1, 0, "skeleton").join("."));
            await skeletizedFile.setContents(await skeletizer.getStrippedModule());
            this.temporaryFiles.push(skeletizedFile);

            module = await skeletizedFile.import();
        }
        else
        {
            module = await this.file.import();
        }

        for (const exportedClass of Object.values(module))
            this.testSuites.push(new TestSuite(this, exportedClass as ITestSuiteConstructor));
    }

    async createEnvironmentModuleFile(environmentDecorator: EnvironmentDecorator): Promise<File>
    {
        if (this.environmentModules.has(environmentDecorator))
            return this.environmentModules.get(environmentDecorator)!;

        //We insert the environment type before the .ts extension => example.test.ts -> example.test.environment.ts
        const environmentModule = new File(this.file.filePath.split(".").toSpliced(-1, 0, `${environmentDecorator.environmentName}-${environmentDecorator.environmentID}`).join("."));

        await environmentModule.setContents( await this.getEnvironmentModuleString(environmentDecorator));
        this.temporaryFiles.push(environmentModule);
        this.environmentModules.set(environmentDecorator, environmentModule);
        return environmentModule;
    }

    private async getEnvironmentModuleString(environmentDecorator: EnvironmentDecorator)
    {
        const testFunctionsForEnvironment = this.tests.filter(test => test.executionEnvironment === environmentDecorator);
        const testHooksForEnvironment = this.testSuites.flatMap(suite => suite.hooks).filter(hook => hook.environment === environmentDecorator);

        const source = await this.file.getContents();

        const compiler = new TreeShaker(this.file, source, [...testFunctionsForEnvironment, ...testHooksForEnvironment]);

        return await compiler.getCompiledModule();
    }

    async cleanup()
    {
        const fileDeletionPromises = this.temporaryFiles.map(file => file.delete());
        await Promise.all(fileDeletionPromises);
    }
}

class TreeShaker
{
    project: Project;
    fileSystem: FileSystemHost;
    sourceFile: SourceFile;

    constructor(
        public file: File,
        public source: string,
        public targetFunctions: (TestHook | TestFunction)[]
    )
    {
        this.project = new Project({ useInMemoryFileSystem: true, compilerOptions: {
            target: ScriptTarget.ES2020,
            module: ModuleKind.ES2020
        }});
        this.fileSystem = this.project.getFileSystem();
        this.sourceFile = this.project.createSourceFile("module.ts", source);
        this.sourceFile.saveSync();
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

        return await this.fileSystem.readFile("module.ts");
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
            if (moduleSpecifier && (moduleSpecifier.getLiteralText().endsWith(".ts") || moduleSpecifier.getLiteralText().endsWith(".js")))
            {
                const absoluteImportPath = path.join(path.dirname(this.file.filePath), moduleSpecifier.getLiteralText()).replaceAll("\\", "/");
                importDeclaration.setModuleSpecifier(`${absoluteImportPath}`);
            }
        }

        await this.sourceFile.save();
    }
}

class Skeletizer
{
    private project: Project;
    private sourceFile: SourceFile;

    constructor(private file: File, private source: string)
    {
        this.project = new Project({ useInMemoryFileSystem: true });
        this.sourceFile = this.project.createSourceFile(file.filePath, source);
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
                //We see whether the absolute import path references the frameworks decorators.ts file
                const isDecoratorFile = path.join(path.dirname(this.file.filePath), importFileName) === path.join(path.dirname(this.file.filePath), "../decorators.ts");
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