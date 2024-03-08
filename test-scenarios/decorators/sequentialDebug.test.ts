import { Debug, Sequential } from "../../source/decorators.js";

@Sequential
export class SequentialDebugSuite
{
    static executionOrder: number[] = [];
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        SequentialDebugSuite.executionOrder.push(1);
    }

    @Debug
    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        SequentialDebugSuite.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        SequentialDebugSuite.executionOrder.push(3);
    }
}