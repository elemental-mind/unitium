import { Observable } from "../eventPropagation.js";
import { titleCase, camelToNormal } from "../formatting.js";
import { InternalError } from "../unitium.js";
import { TestError } from "./testError.js";
import type { EnvironmentDecorator } from "../setups/testSetup.js";
import type { TestSuite } from "./testSuite.js";

export class TestFunction extends Observable
{
    public functionName: string;
    public name: string;
    public error?: TestError;
    public description?: string;
    public executionEnvironment: EnvironmentDecorator;
    public isDebugTarget: boolean;

    constructor(
        public testSuite: TestSuite,
        public testFunction: Function
    )
    {
        super();

        this.functionName = testFunction.name;
        this.name = titleCase(camelToNormal(this.functionName));
        this.executionEnvironment = this.testSuite.testClass.__meta?.setup?.functions?.[this.functionName] ?? this.testSuite.setupType.Default;
        this.isDebugTarget = this.testSuite.testClass.__meta?.debugTestName === this.functionName;
    }

    async run(testFixture: any)
    {
        this.runStarted.resolve();
        let wasSuccessful = false;
        try
        {
            await testFixture[this.functionName]();
            wasSuccessful = true;
        }
        catch (e: Error | any)
        {
            if (e instanceof InternalError)
                throw e;
            else
                this.error = new TestError(e);
        }

        this.runCompleted.resolve();

        return wasSuccessful;
    }
}