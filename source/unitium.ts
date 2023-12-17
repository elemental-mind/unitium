// Copyright (c) 2022 Magnus Meseck
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export abstract class TestRunner<T extends TestSuite>
{
    testModuleNames : string[] = [];
    testSuites : T[] = [];

    async runTests()
    {
        console.log("Running Tests...");

        //We first gather all the filenames/urls of modules that contain tests.
        this.testModuleNames = await this.getModuleNames();
        //Every file/module may contain multiple Test suites. We load the module and start the tests immediately
        const moduleLoadPromises = this.testModuleNames.map(
            (moduleName) => 
                this.loadModuleAndRunTestSuites(moduleName));
        //We await the finished loading of all modules and the starting of all the TestSuites. 
        const testSuitesGroupedByModule = await Promise.all(moduleLoadPromises);
        //As loaded modules can contain multiple test suites we need to unwrap these and wait for them. We want to await finishing of all tests.
        await Promise.all(testSuitesGroupedByModule.flat());

        //All tests are finished and we can write the results to the console.
        for (const testSuite of this.testSuites)
            testSuite.printTestResults();
    }

    protected abstract getModuleNames() : Promise<string[]>;

    protected abstract loadModuleAndRunTestSuites(moduleName: string): Promise<Promise<T>[]>;
}

export class TestSuite
{
    public name: string;
    public testFunctions: string[];
    public tests: Test[] = [];
    public isRunning = false;
    public isCompleted = false;

    constructor(protected testClassConstructor: { new(): any })
    {
        this.name = testClassConstructor.name;
        this.testFunctions = this.getTestFunctionNames();
    };

    public get failedTests()
    {
        return this.tests.filter(t => (t.isCompleted && t.error != undefined));
    }

    public get passedTests()
    {
        return this.tests.filter(t => (t.isCompleted && t.error == undefined));
    }

    private getTestFunctionNames()
    {
        const testFunctions = Object.getOwnPropertyNames(this.testClassConstructor.prototype);
        const tests = [];

        for (const testFunction of testFunctions)
        {
            if (testFunction != "constructor" && typeof this.testClassConstructor.prototype[testFunction] === "function")
            {
                tests.push(testFunction);
            }
        }

        return tests;
    }

    protected convertFunctionToTest(functionName: string)
    {
        return new Test(functionName);
    }

    async run()
    {
        const metaData = this.testClassConstructor.prototype.__meta;
        let sequentialInstance;

        this.tests = this.testFunctions.map(functionName => this.convertFunctionToTest(functionName));
        this.isRunning = true;

        if(metaData?.isSequential)
            sequentialInstance = new this.testClassConstructor();
        
        for (const test of this.tests)
        {
            metaData?.beforeEach?.();
            await test.run(metaData?.isSequential?sequentialInstance:new this.testClassConstructor());
            metaData?.afterEach?.();
        }

        this.isRunning = false;
        this.isCompleted = true;

        return this;
    }

    public printTestResults()
    {
        const passedTests = this.passedTests;
        const failedTests = this.failedTests;
        const totalTestCount = passedTests.length + failedTests.length;

        console.log();
        console.group(`${capitalCase(camelToNormal(this.name))}`);

        console.group(`Passed: ${passedTests.length}/${totalTestCount}`);
        passedTests.forEach(t => t.printTestResult());
        console.groupEnd();

        console.group(`Failed: ${failedTests.length}/${totalTestCount}`);
        failedTests.forEach(t => t.printTestResult());
        console.groupEnd();

        console.groupEnd();
    }
}

export class Test
{
    public error?: BaseError;
    public isRunning = false;
    public isCompleted = false;

    constructor(
        public testFunctionName: string
    ) { }

    async run(testSuiteObject: any)
    {
        this.isRunning = true;
        try
        {
            await testSuiteObject[this.testFunctionName]();
        }
        catch (e: BaseError | any)
        {
            this.error = e;
        }
        this.isRunning = false;
        this.isCompleted = true;
    }

    public printTestResult()
    {
        if (!this.error)
        {
            console.log("✔️    " + titleCase(camelToNormal(this.testFunctionName)));
        }
        else
        {
            const errorPosition = this.error.stack.split("\n    at")[1].trim();
            const filePosition = /\(((.*?)\:(\d+)\:(\d+))\)/.exec(errorPosition)!;
            console.group("❌   " + titleCase(camelToNormal(this.testFunctionName)) + " --> " + this.error.name + ": " + (this.error.message || "unkown") + " --> \"" + filePosition[1] + "\"");
            // console.log(this.error);
            console.groupEnd();
        }
    }
}

export function camelToNormal(camelCaseString: string)
{
    return camelCaseString.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

export function titleCase(text: string){
    return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalCase(text: string){
    return text.split(" ").map(s => titleCase(s)).join(" ");
}

interface BaseError
{
    name: string,
    message: string,
    stack: string,
    actual?: any,
    expects?: any
}