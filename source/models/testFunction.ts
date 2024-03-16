import { Observable } from "../eventPropagation.js";
import { titleCase, camelToNormal } from "../formatting.js";
import { TestError } from "./testError.js";

import { TestSuite } from "./testSuite.js";

export class TestFunction extends Observable
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
}