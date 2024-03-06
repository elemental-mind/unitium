import assert from "assert";
import { arraysContainSameElements, evaluateNodeSpecIn } from "./tests/utils.js";

export class ModuleParsingTests
{
    async shouldHandleEmptyTestModulesGracefully()
    {
        const results = await evaluateNodeSpecIn("./test-scenarios/general/parsing/emptyModule.test.ts");
        
        assert(results.testModules.length === 1);
        assert.deepStrictEqual(results.testSuites, []);
    }

    async onlyExportedMembersShouldBeTests()
    {
        const resultsNoExport = await evaluateNodeSpecIn("test-scenarios/general/parsing/noExports.test.ts");
        const resultsSingleExport = await evaluateNodeSpecIn("test-scenarios/general/parsing/singleExport.test.ts");
        const resultsMultipleExports = await evaluateNodeSpecIn("test-scenarios/general/parsing/multiExport.test.ts");

        assert(arraysContainSameElements(resultsNoExport.testSuites.map(suite => suite.className), []));
        assert(arraysContainSameElements(resultsSingleExport.testSuites.map(suite => suite.className), ["FirstTest"]));
        assert(arraysContainSameElements(resultsMultipleExports.testSuites.map(suite => suite.className), ["FirstTest", "SecondTest"]));
    }
}

export class ExecutionModelTests
{
    async testsShouldExecuteInParallel()
    {
        const results = await evaluateNodeSpecIn("test-scenarios/general/execution/asyncParallel.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [3,2,1]);
    }
}

export class AssertionDetectionTests
{
    async shouldRegisterErrorOnFailingTest()
    {
        const results = await evaluateNodeSpecIn("test-scenarios/general/assertion/failing.test.ts");

        assert(results.tests[0].error !== undefined);        
    }
    
    async shouldNotRegisterErrorOnPassingTest()
    {
        const results = await evaluateNodeSpecIn("test-scenarios/general/assertion/passing.test.js");

        assert(results.tests[0].error === undefined);
    }
}