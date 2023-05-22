import * as assert from "uvu/assert";
import { Sequential, BeforeEach, AfterEach } from "unitium"

export class BasicExampleTests
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
        await new Promise(resolve => setTimeout(() => resolve(null), 1000))
        assert.equal(true, true);
    }

    exceptionThrowingTest()
    {
        throw new Error("Exception was thrown. I am a test that fails");
    }

    #thisIsNotATest()
    {
        return 1;
    }
}

//For each test run you will receive a new "fresh" instance of the Test Suite class by default.
//This means class members will be reinitilized before each test run.
export class NonSequentialTest
{
    number = 0;

    incrementNumber()
    {
        this.number++;
        assert.equal(this.number, 1);
    }

    checkNumber()
    {
        assert.equal(this.number, 0);
    }
}

//For each test run you will receive a new "fresh" instance of the Test Suite class by default.
//If you do not desire this behaviour, decorate the class with the @Sequential decorator 
//and the same class instance will be passed on from test to test.
@Sequential
export class SequentialTest
{
    number = 0;

    incrementNumber()
    {
        this.number++;

        assert.equal(this.number, 1);
    }

    checkNumber()
    {
        assert.equal(this.number, 1);
    }
}

//If you have global state and need to reset it before running each test, use the @BeforeEach and @AfterEach decorators.
let moduleVariable = 0;

@BeforeEach(() => moduleVariable = 0)
@AfterEach(() => console.log("tested"))
export class BeforeEachTest
{
    setModuleVariable()
    {
        moduleVariable = 100;
    }

    checkModuleVariable()
    {
        assert.equal(moduleVariable, 0);
    }
}