export class TestSuiteWithStaticOnSetup
{
    static executionOrder: number[] = [];

    static onSetup() {}
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        TestSuiteWithStaticOnSetup.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        TestSuiteWithStaticOnSetup.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        TestSuiteWithStaticOnSetup.executionOrder.push(3);
    }
}

export class TestSuiteWithStaticOnTeardown
{
    static executionOrder: number[] = [];

    static onTearDown() {}
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        TestSuiteWithStaticOnTeardown.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        TestSuiteWithStaticOnTeardown.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        TestSuiteWithStaticOnTeardown.executionOrder.push(3);
    }
}