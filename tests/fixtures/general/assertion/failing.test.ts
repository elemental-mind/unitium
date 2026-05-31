import assert from "#unitium/assert";

export class ShouldFailSuite
{
    thisShouldFail()
    {
        assert.equal(1,2);
    }
}
