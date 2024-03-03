import { Awaitable } from "deferium";

export abstract class TestRunner extends Awaitable
{
    public specification: SoftwareSpecification;

    testingCompleted = new Awaitable();
    constructor(
        loadedSpecification: SoftwareSpecification
    )
    {
        super();
        this.specification = loadedSpecification;
    }

    abstract runTests(): void;

    protected async runAllTests()
    {
        const moduleRuns = [];
        for (const module of this.specification.testModules)
            moduleRuns.push(module.run());
        await Promise.all(moduleRuns);

        this.specification.runCompleted.resolve();
        this.testingCompleted.resolve();
    }
}

export abstract class TestCommons
{
    runCompleted = new Awaitable();

    abstract printResults(): void;
    abstract serialize(): any;
}

export abstract class SoftwareSpecification extends TestCommons
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

    abstract load(): Promise<TestModule[]>;

    protected async loadModule(path: string)
    {
        this.testModules.push(new TestModule(path, await import(/*@vite-ignore*/path)));
    }

    printResults()
    {
        console.log("Testing finished.");

        const totalTestCount = this.tests.length;
        const failedTestCount = this.tests.filter(test => test.error !== undefined).length;

        if(failedTestCount === 0)
            console.log("All tests passed.");
        else
            console.log(`${failedTestCount} of ${totalTestCount} tests failed.`)

        for (const module of this.testModules) {
            module.printResults();
        }
    }

    serialize()
    {
        return {
            modules: this.testModules.map(module => module.serialize())
        };
    }
}

export class TestModule extends TestCommons
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
        const suiteRuns = [];
        for (const suite of this.testSuites)
            suiteRuns.push(suite.run());

        await Promise.all(suiteRuns);

        this.runCompleted.resolve();
    }

    printResults() { 
        for (const suite of this.testSuites)
            suite.printResults();
    };
    serialize()
    {
        return {
            path: this.path,
            suites: this.testSuites.map(suite => suite.serialize())
        };
    }
}

export class TestSuite extends TestCommons
{
    public className: string;
    public name: string;
    public tests: Test[] = [];

    constructor(
        public testModule: TestModule,
        protected testClassConstructor: { new(): any; })
    {
        super();
        this.className = testClassConstructor.name;
        this.name = capitalCase(camelToNormal(this.className));

        const testFunctionNames = Object.getOwnPropertyNames(this.testClassConstructor.prototype);

        for (const testFunctionName of testFunctionNames)
            if (testFunctionName != "constructor" && typeof this.testClassConstructor.prototype[testFunctionName] === "function")
                this.tests.push(new Test(this, testFunctionName));
    }

    static isValid(constructorFct: any)
    {
        return typeof constructorFct === "function" && constructorFct.prototype;
    }

    async run()
    {
        const metaData = this.testClassConstructor.prototype.__meta;

        if (metaData?.isSequential)
        {
            const testInstance = new this.testClassConstructor();
            for (const test of this.tests)
            {
                metaData?.beforeEach?.();
                await test.run(testInstance);
                metaData?.afterEach?.();
            }
        }
        else
        {
            for (const test of this.tests)
            {
                metaData?.beforeEach?.();
                test.run(new this.testClassConstructor());
                metaData?.afterEach?.();
            }
        }

        this.runCompleted.resolve();
    }
    serialize()
    {
        return {
            name: this.className,
            tests: this.tests.map(test => test.serialize())
        };
    }

    printResults()
    {
        console.group(this.name);
        for (const test of this.tests)
        {
            test.printResults();
        }
        console.groupEnd();
    };

}

export class Test extends TestCommons
{
    public error?: TestError;
    public description?: string;
    public runStarted = new Awaitable();

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

    public printResults()
    {
        if (!this.error)
            console.log("✔️    " + this.name);
        else
        {
            console.group("❌   " + this.name);
            this.error.printResults();
            console.groupEnd();
        }
    }
}

export class TestError extends TestCommons
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

    printResults()
    {
        console.log(`${this.error.name}: ${this.error.message || "unkown"} --> "${this.sourceFile}:${this.fileLocation.line}:${this.fileLocation.column}"`);
    }
}

export function camelToNormal(camelCaseString: string)
{
    return camelCaseString.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

export function titleCase(text: string)
{
    return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalCase(text: string)
{
    return text.split(" ").map(s => titleCase(s)).join(" ");
}