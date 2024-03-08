import { BaseReporter } from "./base.js";
import { TestModule, TestSuite, Test, TestError } from "../unitium.js";

export class ConsoleReporter extends BaseReporter
{
    onTestRunStart()
    {
        console.log("Testing started.");
    }

    onTestRunEnd()
    {
        console.log("Testing finished.");

        const totalTestCount = this.specification.tests.length;
        const failedTestCount = this.specification.tests.filter(test => test.error !== undefined).length;

        if (failedTestCount === 0)
            console.log("All tests passed.");
        else
            console.log(`${failedTestCount} of ${totalTestCount} tests failed.`);

        for (const module of this.specification.testModules)
            this.printModuleResults(module);
    }

    printModuleResults(module: TestModule)
    {
        for (const suite of module.testSuites)
            this.printSuiteResults(suite);
    }

    printSuiteResults(suite: TestSuite)
    {
        console.group(suite.name);

        for (const test of suite.tests)
            this.printTestResults(test);

        console.groupEnd();
    }

    printTestResults(test: Test)
    {
        if (!test.error)
            console.log("✔️    " + test.name);
        else
        {
            console.group("❌   " + test.name);
            this.printError(test.error);
            console.groupEnd();
        }
    }

    printError(error: TestError)
    {
        console.log(`${error.name}: ${error.message || "unkown"} --> "${error.sourceFile}:${error.fileLocation.line}:${error.fileLocation.column}"`);
    }

}