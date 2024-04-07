import { BaseReporter } from "../reporters/base.js";
import { SoftwareSpecification } from "./specification.js";
import { WebSocketServer } from 'ws';

export class TestRunner
{
    wsServer?: WebSocketServer;
    private environmentCount = 0;
    public specification: SoftwareSpecification;

    constructor(
        loadedSpecification: SoftwareSpecification,
        public reporters?: BaseReporter[],
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
        const debugTests = this.specification.tests.filter(test => test.isDebugTarget)
        const debugTest = debugTests[0];
        const debugSuite = debugTest.testSuite;

        if (debugTests.length)
        {
            if(debugTests.length > 1)
            {
                const debugTargetString = debugTests.map(test => `${test.name} in ${test.testSuite.className} in ${test.testSuite.testModule.filePath}`).join("\n");
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

            console.warn(`Running in test debug mode. Only executing test "${debugTest.name}" in "${debugTest.testSuite.className}" in ${debugTest.testSuite.testModule.filePath}.\nRemove the @Debug decorator to run all tests.`);
        }

        if (!debugTest && this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunStart();

        const moduleRuns = [];
        for (const module of this.specification.testModules)
            moduleRuns.push(module.run());
        await Promise.all(moduleRuns);

        for (const module of this.specification.testModules)
            module.cleanup();

        if (!debugSuite && this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunEnd();
    }
}