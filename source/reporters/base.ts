import { SoftwareSpecification, TestModule, TestSuite, Test, Observable } from "../unitium.js";

export abstract class BaseReporter
{
    constructor(protected specification: SoftwareSpecification) { }

    onTestRunStart() { };
    onTestRunEnd() { };
}

export abstract class EventBasedReporter extends BaseReporter
{
    onTestRunStart(): void
    {
        for (const testModule of this.specification.testModules)
        {
            this.subscribe(testModule, this.onModuleStart, this.onModuleEnd);
            for (const testSuite of testModule.testSuites)
            {
                this.subscribe(testSuite, this.onSuiteStart, this.onSuiteEnd);
                for (const test of testSuite.tests)
                {
                    this.subscribe(test, this.onTestStart, this.onTestEnd);
                }
            }
        }
    }

    private async subscribe(eventSource: Observable, onStartHandler: Function, onEndHandler: Function)
    {
        await eventSource.runStarted;
        const onStartReturn = onStartHandler(eventSource);
        await eventSource.runCompleted;
        onEndHandler(eventSource, onStartReturn);
    }

    onModuleStart(module: TestModule) { };
    onModuleEnd(module: TestModule) { };
    onSuiteStart(suite: TestSuite) { };
    onSuiteEnd<T>(suite: TestSuite) { };
    onTestStart(test: Test) { };
    onTestEnd<T>(test: Test) { };
}