import assert from "assert";

export class ShouldPassSuite
{
    thisShouldPass()
    {
        assert.equal(1,1);
    }
}