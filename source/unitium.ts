import { Awaitable } from "deferium";

export abstract class TestRunner extends Awaitable
{
    testingCompleted = new Awaitable();
    constructor(
        public specification: SoftwareSpecification
    )
    {
        super();
    }

    get testResultReport()
    {
        return {};
    }

    async runAllTests()
    {
        const testModules = await this.specification.load();

        const moduleRuns = [];
        for (const module of testModules)
            moduleRuns.push(module.run());
        await Promise.all(moduleRuns);

        this.testingCompleted.resolve();
    }
}

export abstract class SoftwareSpecification
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
}

export abstract class SpecificationFragment
{
    runCompleted = new Awaitable();

    abstract printResults(): void;
    abstract serialize(): any;
}

export class TestModule extends SpecificationFragment
{
    testSuites: TestSuite[] = [];

    static async from(urlOrFileName: string)
    {
        const module = await import(urlOrFileName);
        return new TestModule(urlOrFileName, module);
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
    }

    printResults() { };
    serialize()
    {
        return {
            path: this.path,
            suites: this.testSuites.map(suite => suite.serialize())
        };
    }
}

export class TestSuite extends SpecificationFragment
{
    public name: string;
    public tests: Test[] = [];

    constructor(
        public testModule: TestModule,
        protected testClassConstructor: { new(): any; })
    {
        super();
        this.name = testClassConstructor.name;

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
        let sequentialInstance;

        if (metaData?.isSequential)
            sequentialInstance = new this.testClassConstructor();

        for (const test of this.tests)
        {
            metaData?.beforeEach?.();
            await test.run(metaData?.isSequential ? sequentialInstance : new this.testClassConstructor());
            metaData?.afterEach?.();
        }
    }
    serialize()
    {
        return {
            name: this.name,
            tests: this.tests.map(test => test.serialize())
        };
    }

    printResults()
    {
        console.group(``);
        for (const test of this.tests)
        {
            test.printResults();
        }
        console.groupEnd();
    };

}

export class Test extends SpecificationFragment
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
        try
        {
            await testFixture[this.testFunctionName]();
        }
        catch (e: Error | any)
        {
            this.error = new TestError(e);
        }
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
            console.group("❌   " + this.name + " --> " + this.error.name);
            this.error.printResults();
            console.groupEnd();
        }
    }
}

export class TestError extends SpecificationFragment
{
    public actual: any;
    public expected: any;
    public name!: string;
    public message!: string;
    public stack!: string;
    public sourceFile: string;
    public cursorPosition: string;

    constructor(private error: Error)
    {
        super();
        Object.assign(this, error);
        const errorPosition = error.stack!.split("\n    at")[1].trim();
        const filePosition = /\(((.*?)\:(\d+)\:(\d+))\)/.exec(errorPosition)!;
        console.log(filePosition);
        this.sourceFile = "";
        this.cursorPosition = "";
    }
    serialize()
    {
        return Object.assign({}, this);
    }

    printResults()
    {
        console.log(this.error.name + ": " + (this.error.message || "unkown") + " --> \"" + this.sourceFile + ":" + this.cursorPosition + "\"");
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