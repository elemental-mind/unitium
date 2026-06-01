import { Sequential } from "../../../source/unitium.ts";

class SequentialTestSuiteFixture
{
    static executionOrder: number[] = [];
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        SequentialTestSuiteFixture.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        SequentialTestSuiteFixture.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        SequentialTestSuiteFixture.executionOrder.push(3);
    }
}

export const SequentialTestSuite = Sequential(SequentialTestSuiteFixture);
