import { Sequential } from "../../source/decorators.js";

@Sequential
export class SequentialTestSuite
{
    static executionOrder: number[] = [];
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        SequentialTestSuite.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        SequentialTestSuite.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        SequentialTestSuite.executionOrder.push(3);
    }
}