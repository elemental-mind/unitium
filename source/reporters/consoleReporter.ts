import { BaseReporter } from "./base.ts";
import { Test, TestError, TestModule, TestSuite } from "../core/unitium.ts";

/**
* Reporter that prints a human-readable test run summary to the console.
*/
export class ConsoleReporter extends BaseReporter
{
    /**
    * Announces the start of a test run.
    */
    onTestRunStart(): void
    {
        console.log("Testing started...");
    }

    /**
    * Prints the final summary and per-test results.
    */
    onTestRunEnd(): void
    {
        console.log("Testing finished...");

        console.log();
        console.log("    Results    ");
        console.log("---------------");
        console.log();

        for (const module of this.specification.testModules)
            this.printModuleResults(module);

        const totalTestCount = this.specification.tests.length;
        const failedTestCount = this.specification.tests.filter((test) => test.error !== undefined).length;

        console.log();
        console.log();
        console.log("    Summary    ");
        console.log("---------------");
        console.log(`Pass:  ${totalTestCount - failedTestCount}`);
        console.log(`Fail:  ${failedTestCount}`);
        console.log("---------------");
        console.log(`Total: ${totalTestCount}`);
        console.log();

        if (failedTestCount === 0)
            console.log("🟢   All tests passed.");
        else
            console.log(`🔴   ${failedTestCount} of ${totalTestCount} tests failed.`);
    }

    protected printModuleResults(module: TestModule): void
    {
        for (const suite of module.testSuites)
            this.printSuiteResults(suite);
    }

    protected printSuiteResults(suite: TestSuite): void
    {
        console.group(suite.name);

        for (const test of suite.tests)
            this.printTestResults(test);

        console.groupEnd();
    }

    protected printTestResults(test: Test): void
    {
        if (!test.error)
            console.log("🟢    " + test.name);
        else
        {
            console.group("🔴   " + test.name);
            this.printError(test.error);
            console.groupEnd();
        }
    }

    protected printError(error: TestError): void
    {
        console.log(
            `${error.name}: ${error.message || "unkown"
            } --> "${error.sourceFile}:${error.fileLocation.line}:${error.fileLocation.column}"`,
        );
    }
}
