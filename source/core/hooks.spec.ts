import assert from "#unitium/assert";
import { evaluateSpecIn } from "../../tests/utils.ts";


export class HooksExecutionModelTests
{
    async testsShouldExecuteInParallelWithStaticHooks()
    {
        const results = await evaluateSpecIn("tests/fixtures/hooks/staticHooks.test.ts");

        //@ts-ignore
        results.testSuites.forEach(suite => assert.deepEqual(suite.testClassConstructor.executionOrder, [3, 2, 1]));
    }

    async testsShouldExecuteInSequenceWithMemberHooks()
    {
        const results = await evaluateSpecIn("tests/fixtures/hooks/memberHooks.test.ts");

        //@ts-ignore
        results.testSuites.forEach(suite => assert.deepEqual(suite.testClassConstructor.executionOrder, [1, 2, 3]));
    }
}
