import { Observable } from "../eventPropagation.js";
import { TestSuite } from "./testSuite.js";

export class TestModule extends Observable
{
    testSuites: TestSuite[] = [];

    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
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
        this.runStarted.resolve();

        const suiteRuns = [];
        for (const suite of this.testSuites)
            suiteRuns.push(suite.run());

        await Promise.all(suiteRuns);

        this.runCompleted.resolve();
    }
}