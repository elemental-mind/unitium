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
        const files = await FastGlob("./**/*.test.js",
        {
            onlyFiles: true,
            absolute: true,
            ignore: ['**/node_modules/**']
        });

        for (const file of files) {
            this.tests.push(await TestSuite.fromFile(file));
        }

        const suitePromises = [];

        for(const testSuite of this.tests)
        {
            suitePromises.push(testSuite.run());
        }

        await Promise.all(suitePromises);

        for (const testSuite of this.tests) {
            testSuite.printTestResults();
        }
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

    async run()
    {    
        this.isRunning = true;
        let testPromises = [];    
        for (const test of this.tests) {
            testPromises.push(test.run(this.suite));
        }

        await Promise.all(testPromises);
        this.isRunning = false;
        this.isCompleted = true;
    }

    public printTestResults()
    {
        const passedTests = this.passedTests;
        const failedTests = this.failedTests;
        const totalTestCount = passedTests.length + failedTests.length;

        console.group(`${this.name}: Ran ${totalTestCount} tests of which ${failedTests.length} failed.`);
        
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
    public error?:AssertionError | unknown;
    public stackTrace?:string;
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
        catch(e:AssertionError | unknown)
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
            console.log("✔️ " + this.testFunctionName);
        }
        else
        {
            console.group("❌ " + this.testFunctionName);
            console.log(this.error);
            console.groupEnd();
        }
    }
}

const testRunner = new TestRunner();
testRunner.runTests();