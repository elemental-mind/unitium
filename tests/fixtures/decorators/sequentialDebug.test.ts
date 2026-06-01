import { Debug, Sequential } from "../../../source/unitium.ts";

class SequentialDebugSuiteFixture
{
    static executionOrder: number[] = [];
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        SequentialDebugSuiteFixture.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        SequentialDebugSuiteFixture.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        SequentialDebugSuiteFixture.executionOrder.push(3);
    }
}

Debug(SequentialDebugSuiteFixture.prototype, "second");
export const SequentialDebugSuite = Sequential(SequentialDebugSuiteFixture);
