import { Debug } from "../../../source/suite-api.ts";

export class ParallelDebugSuite
{
    static executionOrder: number[] = [];
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        ParallelDebugSuite.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        ParallelDebugSuite.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        ParallelDebugSuite.executionOrder.push(3);
    }
}

Debug(ParallelDebugSuite.prototype, "second");
