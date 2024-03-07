import { evaluateNodeSpecIn } from "./tests/utils.js";
import assert from "assert";

export class SequentialDecoratorTests
{
    async testShouldExecuteInSequenceWithSequentialDecorator()
    {
        const results = await evaluateNodeSpecIn("./test-scenarios/decorators/sequential.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [1, 2, 3]);
    }
}