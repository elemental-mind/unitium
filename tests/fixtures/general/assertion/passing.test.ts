import assert from "node:assert";

export class ShouldPassSuite
{
    thisShouldPass()
    {
        assert.equal(1,1);
    }
}
