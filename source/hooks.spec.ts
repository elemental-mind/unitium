import assert from "assert";
import { evaluateNodeSpecIn } from "./tests/utils.js";


export class HooksExecutionModelTests
{
    async testsShouldExecuteInParallelWithStaticHooks()
    {
        const results = await evaluateNodeSpecIn("test-scenarios/hooks/staticHooks.test.ts");

        //@ts-ignore
        results.testSuites.forEach(suite => assert.deepEqual(suite.testClassConstructor.executionOrder, [3, 2, 1]));
    }

    async testsShouldExecuteInSequenceWithMemberHooks()
    {
        const results = await evaluateNodeSpecIn("test-scenarios/hooks/memberHooks.test.ts");

        //@ts-ignore
        results.testSuites.forEach(suite => assert.deepEqual(suite.testClassConstructor.executionOrder, [1, 2, 3]));
    }
}