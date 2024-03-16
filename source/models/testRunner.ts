import { Observable } from "../eventPropagation.js";
import { BaseReporter } from "../reporters/base.js";
import { SoftwareSpecification } from "./specification.js";

export class TestRunner extends Observable
{
    public specification: SoftwareSpecification;

    constructor(
        loadedSpecification: SoftwareSpecification,
        public reporters?: BaseReporter[]
    )
    {
        super();
        this.specification = loadedSpecification;
    }

    async run()
    {
        this.runCompleted.resolve();

        const debugSuite = this.specification.testSuites.find(suite => suite.testClassConstructor.__meta?.debugTestName !== undefined);

        if (debugSuite)
        {
            //If we have a debug test, we filter the spec to only the test to debug
            const debugModule = this.specification.testModules.find(module => module.testSuites.includes(debugSuite))!;
            this.specification.testModules = this.specification.testModules.filter(module => module === debugModule);
            debugModule.testSuites = debugModule.testSuites.filter(suite => suite === debugSuite);
            const debugTest = debugSuite.tests.find(test => test.testFunctionName === debugSuite.testClassConstructor.__meta?.debugTestName)!;

            if (debugSuite.isSequential)
            {
                //If the suite is sequential, we only execute the test and all tests before it
                const testIndex = debugSuite.tests.indexOf(debugTest);
                debugSuite.tests = debugSuite.tests.slice(0, testIndex + 1);
            }
            else
                //If the suite is parallel, we only execute the test
                debugSuite.tests = debugSuite.tests.filter(test => test === debugTest);

            console.warn(`Running in test debug mode. Only executing test "${debugTest.name}" in "${debugTest.testSuite.testClassConstructor.name}" in ${debugModule.path}.\nRemove the @Debug decorator to run the full test suite.`);
        }

        if (!debugSuite && this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunStart();

        const moduleRuns = [];
        for (const module of this.specification.testModules)
            moduleRuns.push(module.run());
        await Promise.all(moduleRuns);

        if (!debugSuite && this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunEnd();

        this.runCompleted.resolve();
    }
}