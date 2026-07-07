import { Observable } from "../core/unitium.ts";
import type {
    SoftwareSpecification,
    Test,
    TestModule,
    TestSuite,
} from "../core/unitium.ts";

/**
 * Base class for reporters that turn test runner state into output.
 *
 * Reporters receive a loaded specification and may override lifecycle hooks to
 * write summaries, files, logs, or other reporting output during a run.
 */
export abstract class BaseReporter
{
    protected specification: SoftwareSpecification;

    constructor(specification: SoftwareSpecification)
    {
        this.specification = specification;
    }

    /**
     * Hook that can be overridden to react before test modules start.
     */
    onTestRunStart(): void { }
    /**
     * Hook that can be overridden to react after test modules finish.
     */
    onTestRunEnd(): void { }
}

/**
 * Reporter base class that subscribes to module, suite, and test lifecycle events.
 */
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

    private async subscribe(
        eventSource: Observable,
        onStartHandler: Function,
        onEndHandler: Function,
    ): Promise<void>
    {
        await eventSource.runStarted;
        const onStartReturn = onStartHandler(eventSource);
        await eventSource.runCompleted;
        onEndHandler(eventSource, onStartReturn);
    }

    /**
     * Hook that can be overridden to react when a test module starts.
     */
    onModuleStart(module: TestModule): void { }
    /**
     * Hook that can be overridden to react when a test module completes.
     */
    onModuleEnd(module: TestModule): void { }
    /**
     * Hook that can be overridden to react when a test suite starts.
     */
    onSuiteStart(suite: TestSuite): void { }
    /**
     * Hook that can be overridden to react when a test suite completes.
     */
    onSuiteEnd(suite: TestSuite): void { }
    /**
     * Hook that can be overridden to react when an individual test starts.
     */
    onTestStart(test: Test): void { }
    /**
     * Hook that can be overridden to react when an individual test completes.
     */
    onTestEnd(test: Test): void { }
}
