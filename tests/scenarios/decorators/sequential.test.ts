import { Sequential } from "../../../source/decorators.ts";

@Sequential
export class SequentialTestSuite
{
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log("First");
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log("Second");
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log("Third");
    }
}