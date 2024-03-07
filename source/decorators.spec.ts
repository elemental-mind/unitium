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

export class DebugDecoratorTest
{
    async onlyDebugTestShouldExecuteOnParallelSuite()
    {
        const results = await evaluateNodeSpecIn("./test-scenarios/decorators/parallelDebug.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [2]);
    }

    async shouldStopTestingAfterDebugTestInSequentialSuite()
    {  
        const results = await evaluateNodeSpecIn("./test-scenarios/decorators/sequentialDebug.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [1, 2]);
    }
}