import { Awaitable } from "deferium";
import { ISequentialTestSuiteMemberHooks, IParallelTestSuiteStaticHooks } from "./hooks.js";
import { BaseReporter } from "./reporters/base.js";

export class TestRunner extends Awaitable
{
    public specification: SoftwareSpecification;

    testingCompleted = new Awaitable();
    constructor(
        loadedSpecification: SoftwareSpecification,
        public reporters?: BaseReporter[]
    )
    {
        super();
        this.specification = loadedSpecification;
    }

    async run()
    {
        const debugSuite = this.specification.testSuites.find(suite => suite.testClassConstructor.prototype.__meta?.debugTestName !== undefined);

        if (debugSuite)
        {
            //If we have a debug test, we filter the spec to only the test to debug
            const debugModule = this.specification.testModules.find(module => module.testSuites.includes(debugSuite))!;
            this.specification.testModules = this.specification.testModules.filter(module => module === debugModule);
            debugModule.testSuites = debugModule.testSuites.filter(suite => suite === debugSuite);
            const debugTest = debugSuite.tests.find(test => test.testFunctionName === debugSuite.testClassConstructor.prototype.__meta?.debugTestName)!;

            if (debugSuite.isSequential)
            {
                //If the suite is sequential, we only execute the test and all tests before it
                const testIndex = debugSuite.tests.indexOf(debugTest);
                debugSuite.tests = debugSuite.tests.slice(0, testIndex + 1);
            }
            else
                //If the suite is parallel, we only execute the test
                debugSuite.tests = debugSuite.tests.filter(test => test === debugTest);

            console.warn(`Running in test debug mode. Only executing test "${debugTest.name}" in "${debugTest.testSuite.testClassConstructor.name}" in ${debugModule.path}.\nRemove the @Debug decorator to run the full test suite.`);
        }

        if (!debugSuite && this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunStart();

        const moduleRuns = [];
        for (const module of this.specification.testModules)
            moduleRuns.push(module.run());
        await Promise.all(moduleRuns);

        if (!debugSuite && this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunEnd();

        this.testingCompleted.resolve();
    }
}

abstract class Serializable
{
    abstract serialize(): any;
}

export abstract class Observable extends Serializable
{
    runStarted = new Awaitable();
    runCompleted = new Awaitable();
}

export abstract class SoftwareSpecification extends Serializable
{
    public testModules: TestModule[] = [];

    get testSuites()
    {
        return this.testModules.flatMap(module => module.testSuites);
    }

    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
    }

    protected async loadModule(path: string)
    {
        this.testModules.push(new TestModule(path, await import(/*@vite-ignore*/path)));
    }

    serialize()
    {
        return {
            modules: this.testModules.map(module => module.serialize())
        };
    }
}

export class URLSetSpecification extends SoftwareSpecification
{
    static async load(URLs: string[]): Promise<URLSetSpecification>
    {
        const spec = new URLSetSpecification();

        await Promise.all(URLs.map(url => spec.loadModule(url)));

        return spec;
    }
}

export class TestModule extends Observable
{
    testSuites: TestSuite[] = [];

    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
    }

    constructor(
        public path: string,
        module: any
    )
    {
        super();
        for (const key in module)
            if (TestSuite.isValid(module[key]))
                this.testSuites.push(new TestSuite(this, module[key]));
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

    serialize()
    {
        return {
            path: this.path,
            suites: this.testSuites.map(suite => suite.serialize())
        };
    }
}

export type TestSuiteConstructor =
    IParallelTestSuiteStaticHooks &
    {
        new(): ISequentialTestSuiteMemberHooks;
        prototype: ISequentialTestSuiteMemberHooks & ITestSuiteMetadata & Record<string, Function>;
    };

type ITestSuiteMetadata = {
    __meta?: {
        isSequential?: boolean;
        debugTestName?: string;
    };
};

export class TestSuite extends Observable
{
    public className: string;
    public name: string;
    public tests: Test[] = [];

    public isSequential = false;
    public containsTestHooks = false;

    constructor(
        public testModule: TestModule,
        public testClassConstructor: TestSuiteConstructor
    )
    {
        super();
        this.className = testClassConstructor.name;
        this.name = capitalCase(camelToNormal(this.className));

        const testFunctionNames = Object.getOwnPropertyNames(this.testClassConstructor.prototype);

        const noTestNames = ["constructor", "onSetup", "onBeforeEach", "onAfterEach", "onTeardown"];

        if (this.testClassConstructor.prototype.onBeforeEach || this.testClassConstructor.prototype.onAfterEach || this.testClassConstructor.prototype.onSetup || this.testClassConstructor.prototype.onTeardown)
            this.containsTestHooks = true;

        if (this.testClassConstructor.prototype.__meta?.isSequential || this.containsTestHooks)
            this.isSequential = true;

        for (const testFunctionName of testFunctionNames)
            if (!noTestNames.includes(testFunctionName) && typeof this.testClassConstructor.prototype[testFunctionName] === "function")
                this.tests.push(new Test(this, testFunctionName));
    }

    static isValid(constructorFct: any)
    {
        return typeof constructorFct === "function" && constructorFct.prototype;
    }

    async run(debugTest?: Test)
    {
        this.runStarted.resolve();

        if (this.isSequential)
        {
            const testInstance = new this.testClassConstructor();

            testInstance.onSetup?.();
            for (const test of this.tests)
            {
                await testInstance.onBeforeEach?.(test);
                await test.run(testInstance);
                await testInstance.onAfterEach?.(test);
            }
            testInstance.onTeardown?.();
        }
        else
        {
            const testRunPromises = [];
            await this.testClassConstructor.onSetup?.();

            for (const test of this.tests)
                testRunPromises.push(this.runTestParallel(test));

            await Promise.all(testRunPromises);

            await this.testClassConstructor.onTeardown?.();
        }

        this.runCompleted.resolve();
    }

    async runTestParallel(test: Test)
    {
        const testInstance = new this.testClassConstructor();
        await testInstance.onBeforeEach?.(test);
        await test.run(testInstance);
        await testInstance.onAfterEach?.(test);
    }

    serialize()
    {
        return {
            name: this.className,
            tests: this.tests.map(test => test.serialize())
        };
    }
}

export class Test extends Observable
{
    public error?: TestError;
    public description?: string;

    constructor(
        public testSuite: TestSuite,
        public testFunctionName: string
    )
    {
        super();
    }

    get name()
    {
        return titleCase(camelToNormal(this.testFunctionName));
    }

    async run(testFixture: any)
    {
        this.runStarted.resolve();

        try
        {
            await testFixture[this.testFunctionName]();
        }
        catch (e: Error | any)
        {
            this.error = new TestError(e);
        }

        this.runCompleted.resolve();
    }

    serialize()
    {
        return {
            name: this.name,
            description: this.description,
            error: this.error
        };
    }
}

export class TestError extends Serializable
{
    public actual: any;
    public expected: any;
    public name!: string;
    public message!: string;
    public stack!: string;
    public sourceFile: string;
    public fileLocation: {
        line: number,
        column: number;
    };

    constructor(private error: Error)
    {
        super();
        Object.assign(this, error);
        this.name = error.name;
        const errorPosition = error.stack!.split("\n    at")[1].trim();
        const fileParseResults = /\((.*?)\:(\d+)\:(\d+)\)/.exec(errorPosition)!;
        this.sourceFile = fileParseResults[1];
        this.fileLocation = { line: Number(fileParseResults[2]), column: Number(fileParseResults[3]) };
    }

    serialize()
    {
        return Object.assign({}, this);
    }
}

function camelToNormal(camelCaseString: string)
{
    return camelCaseString.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function titleCase(text: string)
{
    return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

function capitalCase(text: string)
{
    return text.split(" ").map(s => titleCase(s)).join(" ");
}