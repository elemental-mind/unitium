// Copyright (c) 2022 Magnus Meseck
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { AssertionError } from 'assert';
import FastGlob from 'fast-glob';
import URL from 'url';

export class TestRunner
{
    public tests:TestSuite[] = [];

    async runTests()
    {
        const testModules = await FastGlob(["./**/*.test.js", "./**/*.test.ts", "./**/*.spec.js", "./**/*.spec.ts"],
        {
            onlyFiles: true,
            absolute: true,
            ignore: ['**/node_modules/**']
        });

        //Every file/module may contain multiple Test suites. We load the module and start the tests immediately
        var moduleLoadPromises: Promise<Promise<TestSuite>[]>[] = [];
        for (const module of testModules) {
            moduleLoadPromises.push(this.loadAndRunTestSuites(module));
        }

        //We await the finished loading of all modules and the starting of all the TestSuites.
        const loadedFilesWithRunningTests = await Promise.all(moduleLoadPromises);
        const allRunningTestSuites = loadedFilesWithRunningTests.flat();

        //We await the finishing of all the running TestSuites
        const finishedTestSuites = await Promise.all(allRunningTestSuites);

        for (const testSuite of finishedTestSuites) {
            testSuite.printTestResults();
        }

        console.log();

        if(finishedTestSuites.find((suite) => suite.failedTests.length > 0)) 
            process.exitCode = 1;
        }

    async loadAndRunTestSuites(file: string)
    {
        const module = await import(URL.pathToFileURL(file).href);

        const runningTestSuites = [];

        for(const key in module)
        {
            const testSuite = new TestSuite(module[key]);
            const runningTestSuite = testSuite.run();
            runningTestSuites.push(runningTestSuite);
        }

        return runningTestSuites;
    }
}

class TestSuite
{
    public name:string;
    private suite:any;
    public tests:Test[];
    public isRunning = false;
    public isCompleted = false;

    constructor(testSuiteConstructor:{ new() : any })
    {
        this.suite = new testSuiteConstructor();
        this.name = Object.getPrototypeOf(this.suite).constructor.name;
        this.tests = this.getSuiteTests();
    };

    public get failedTests()
    {
        return this.tests.filter(t => (t.isCompleted && t.error != undefined));
    }

    public get passedTests()
    {
        return this.tests.filter(t => (t.isCompleted && t.error == undefined));
    }

    static async fromFile(filePath:string)
    {
        const module = await import(URL.pathToFileURL(filePath).href);
        
        if(!module.default)
        {
            throw ("No default export for the testing module that is recognised as a testing suite.");
        }

        return new TestSuite(module.default);
    }

    private getSuiteTests()
    {
        const testFunctions = Object.getOwnPropertyNames(Object.getPrototypeOf(this.suite));
        const tests = [];

        for (const testFunction of testFunctions) {
            if(testFunction != "constructor")
            {
                tests.push(new Test(testFunction));
            }
        }

        return tests;
    }

    async run() : Promise<TestSuite>
    {    
        this.isRunning = true;
        let testPromises = [];    
        for (const test of this.tests) {
            await test.run(this.suite);
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
        console.group(`${this.name}`);
        
        console.group(`Passed: ${passedTests.length}/${totalTestCount}`);
        passedTests.forEach(t => t.printTestResult());
        console.groupEnd();

        console.group(`Failed: ${failedTests.length}/${totalTestCount}`);
        failedTests.forEach(t => t.printTestResult());
        console.groupEnd();

        console.groupEnd();
    }
}

class Test
{
    public error?: BaseError;
    public isRunning = false;
    public isCompleted = false;

    constructor(
        public testFunctionName:string
    ){}

    async run(testSuiteObject:any)
    {
        this.isRunning = true;
        try
        {
            await testSuiteObject[this.testFunctionName]();
        }
        catch(e:BaseError | any)
        {
            this.error = e;
        }
        this.isRunning = false;
        this.isCompleted = true;
    }

    public printTestResult()
    {
        if(!this.error)
        {
            console.log("✔️    " + camelToNormal(this.testFunctionName));
        }
        else
        {
            const errorPosition = this.error.stack.split("\n")[1].trim();
            const filePosition = /\(((.*?)\:(\d+)\:(\d+))\)/.exec(errorPosition)!;
            console.group("❌   " + camelToNormal(this.testFunctionName) + " --> " + this.error.name + ": " + (this.error.message || "unkown")  + " --> \"" + filePosition[1] + "\"");
            // console.log(this.error);
            console.groupEnd();
        }
    }
}

function camelToNormal(camelCaseString: string) {
    return camelCaseString.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

interface BaseError {
    name: string,
    message: string,
    stack: string
}

const testRunner = new TestRunner();
testRunner.runTests();