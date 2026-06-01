import assert from "node:assert";
import { evaluateSpecIn } from "../../tests/utils.ts";

export class SequentialDecoratorTests
{
    async testShouldExecuteInSequenceWithSequentialDecorator()
    {
        const results = await evaluateSpecIn("tests/fixtures/decorators/sequential.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [1, 2, 3]);
    }
}

export class DebugDecoratorTest
{
    async onlyDebugTestShouldExecuteOnParallelSuite()
    {
        const results = await evaluateSpecIn("tests/fixtures/decorators/parallelDebug.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [2]);
    }

    async shouldStopTestingAfterDebugTestInSequentialSuite()
    {  
        const results = await evaluateSpecIn("tests/fixtures/decorators/sequentialDebug.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [1, 2]);
    }
}
