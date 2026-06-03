import assert from "node:assert";

export class ShouldFailSuite
{
    thisShouldFail()
    {
        assert.equal(1,2);
    }
}
