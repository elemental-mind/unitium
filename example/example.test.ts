// Copyright (c) 2022 Magnus Meseck
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import assert from "assert";

export class BasicExampleTestSuite
{
    testThatWillPass()
    {
        assert.equal(1,1);
    }

    testThatWillFail()
    {
        assert.equal(1,2);
    }

    #thisIsNotATest()
    {
        return 1;
    }
}

export class FurtherExampleTestSuite
{
    preSchoolMathTest()
    {
        assert.equal( 1+1 , 2);
    }

    exceptionThrowingTest()
    {
        throw new Error("Exception was thrown");
    }
}