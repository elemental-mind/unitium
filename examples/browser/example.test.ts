import * as assert from "uvu/assert";

export class ExampleTests
{
    testThatWillPass()
    {
        assert.equal(1, 1);
    }

    testThatWillFail()
    {
        assert.equal(1, 2);
    }

    async longRunningTest()
    {
        await new Promise(resolve => setTimeout(() => resolve(null), 5000))
        assert.equal(true, true);
    }

    #thisIsNotATest()
    {
        return 1;
    }
}

export class FurtherExampleTests
{
    preSchoolMathTest()
    {
        assert.equal(1 + 1, 2);
    }

    exceptionThrowingTest()
    {
        assert.throws(() =>
        {
            throw new Error('Exception was thrown');
        });
    }
}