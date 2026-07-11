import { Sequential } from "../../../source/test-suite-api.ts";

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

@Sequential
export class SequentialOutputTests
{
    async runsFor1Second()
    {
        await wait(1_000);
    }

    async runsFor3Seconds()
    {
        await wait(3_000);
        throw new Error("This is a failing test");
    }

    async runsFor2Seconds()
    {
        await wait(2_000);
    }
}

export class ParallelOutputTests
{
    async runsFor10Milliseconds()
    {
        await wait(10);
    }

    async runsFor100Milliseconds()
    {
        await wait(100);
    }

    async runsFor1Second()
    {
        await wait(1_000);
    }

    async runsFor3Seconds()
    {
        await wait(3_000);
    }

    async runsFor6Seconds()
    {
        await wait(6_000);
    }
}
