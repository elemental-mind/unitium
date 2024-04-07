import { ClassDeclaration, Module, parseFile } from "@swc/core";
import { Observable } from "../eventPropagation.js";
import { TestSuite } from "./testSuite.js";
import { TestEnvironmentConstructor } from "../environments/testEnvironment.js";
import { readFile, unlink, writeFile } from "fs/promises";
import { TestHook } from "./testHook.js";
import { TestFunction } from "./testFunction.js";
import { FileSystemHost, Project, SourceFile, SyntaxKind } from "ts-morph";
import path from "path";

export class TestModule extends Observable
{
    public testSuites: TestSuite[] = [];
    public environmentModules = new Map<TestEnvironmentConstructor, string>();
    
    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
    }

    private constructor(
        public filePath: string,
        public ast: Module
    )
    {
        super();
    }

    static async fromFile(filePath: string)
    {
        let parsed = await parseFile(filePath, {
            syntax: "typescript",
            target: "es2020",
            decorators: true
        });
        const testSuite = new TestModule(filePath, parsed);
        await testSuite.analyzeFile();
        return testSuite;
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
        const exportedClasses = this.ast.body.filter(item => item.type === 'ExportDeclaration' && item.declaration.type === 'ClassDeclaration');

        for (const exportedClass of exportedClasses)
            this.testSuites.push(new TestSuite(this, exportedClass as ClassDeclaration));
    }

    async createEnvironmentModuleAndReturnPath(environmentType: TestEnvironmentConstructor): Promise<string>
    {
        if(this.environmentModules.has(environmentType))
            return this.environmentModules.get(environmentType)!;

        //We insert the environment type before the .ts extension => example.test.ts -> example.test.environment.ts
        const environmentModulePath = this.filePath.split(".").splice(-1, 0, environmentType.name).join(".");

        await writeFile(environmentModulePath, await this.getEnvironmentModuleString(environmentType));
        this.environmentModules.set(environmentType, environmentModulePath);
        return environmentModulePath;
    }

    async getEnvironmentModuleString(environmentType: TestEnvironmentConstructor)
    {
        const testFunctionsForEnvironment = this.tests.filter(test => test.environment === environmentType);
        const testHooksForEnvironment = this.testSuites.flatMap(suite => suite.hooks).filter(hook => hook.environment === environmentType);

        const source = await readFile(this.filePath, { encoding: "utf-8" });

        const compiler = new TreeShaker(this.filePath, source, [...testFunctionsForEnvironment, ...testHooksForEnvironment]);

        return await compiler.getCompiledModule();
    }

    async cleanup()
    {
        for (const [environmentType, environmentModulePath] of this.environmentModules)
        {
            await unlink(environmentModulePath);
        }
        this.environmentModules.clear();
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