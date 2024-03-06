import assert from "assert";

export class ShouldFailSuite
{
    thisShouldFail()
    {
        assert.equal(1,2);
    }
}