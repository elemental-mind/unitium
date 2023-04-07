// Copyright (c) 2022 Magnus Meseck
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import assert from "assert";


export default class ExampleTestSuite
{
    exampleTest()
    {
        assert.equal(1,1);
    }

    aFailingTest()
    {
        assert.equal(1,2);
    }
}