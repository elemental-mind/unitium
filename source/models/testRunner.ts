import type { BaseReporter } from "../reporters/base.js";
import type { SoftwareSpecification } from "./specification.js";
import type { WebSocketServer } from 'ws';
import type { TestFunction } from "./testFunction.js";

export class TestRunner
{
    wsServer?: WebSocketServer;
    private environmentCount = 0;
    public specification: SoftwareSpecification;

    constructor(
        loadedSpecification: SoftwareSpecification,
        public reporters: BaseReporter[] = [],
        public portRange = [8000, 8100]
    )
    {
        this.specification = loadedSpecification;
    }

    getEnvironmentID()
    {
        this.environmentCount++;
        return this.environmentCount.toString();
    }

    async run()
    {
        const debugTests = this.specification.tests.filter(test => test.isDebugTarget);

        if (debugTests.length)
            await this.runDebugTest(debugTests);
        else
            await this.runAllTests();
    }

    async runDebugTest(debugTests: TestFunction[])
    {
        const debugTest = debugTests[0];
        const debugSuite = debugTest?.testSuite;

        if (debugTests.length > 1)
        {
            const debugTargetString = debugTests.map(test => `${test.name} in ${test.testSuite.className} in ${test.testSuite.testModule.file}`).join("\n");
            throw new Error("Can only debug one test function at a time. You have multiple debug targets at the moment: \n" + debugTargetString);
        }

        if (debugTest.testSuite.isSequential)
        {
            //If the suite is sequential, we only execute the test and all tests before it
            const testIndex = debugSuite.tests.indexOf(debugTest);
            debugSuite.tests = debugSuite.tests.slice(0, testIndex + 1);
        }
        else
            //If the suite is parallel, we only execute the test
            debugSuite.tests = debugSuite.tests.filter(test => test === debugTest);

        console.warn(`Running in test debug mode. Only executing test "${debugTest.name}" in "${debugTest.testSuite.className}" in ${debugTest.testSuite.testModule.file}.\nRemove the @Debug decorator to run all tests.`);

        debugSuite.testModule.run();
    }

    async runAllTests()
    {
        for (const reporter of this.reporters)
            reporter.onTestRunStart();

        const moduleRuns = [];
        for (const module of this.specification.testModules)
            moduleRuns.push(module.run());
        await Promise.all(moduleRuns);

        for (const module of this.specification.testModules)
            module.cleanup();

        for (const reporter of this.reporters)
            reporter.onTestRunEnd();
    }
}