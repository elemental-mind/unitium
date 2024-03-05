export class ParallelTestSuite
{
    async first()
    {
        console.log("Started first")
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log("Finished last");
    }

    async second()
    {
        console.log("Started second");
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log("Finished second");
    }

    async third()
    {
        console.log("Started last")
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log("Finished first");
    }
}