import assert from "#unitium/assert";

export class ShouldPassSuite
{
    thisShouldPass()
    {
        assert.equal(1,1);
    }
}
