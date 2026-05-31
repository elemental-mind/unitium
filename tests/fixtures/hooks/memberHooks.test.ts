export class TestSuiteWithOnSetup
{
    static executionOrder: number[] = [];

    onSetup() {}
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        TestSuiteWithOnSetup.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        TestSuiteWithOnSetup.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        TestSuiteWithOnSetup.executionOrder.push(3);
    }
}

export class TestSuiteWithOnBeforeEach
{
    static executionOrder: number[] = [];

    onBeforeEach() {}
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        TestSuiteWithOnBeforeEach.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        TestSuiteWithOnBeforeEach.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        TestSuiteWithOnBeforeEach.executionOrder.push(3);
    }
}

export class TestSuiteWithOnAfterEach
{
    static executionOrder: number[] = [];

    onAfterEach() {}
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        TestSuiteWithOnAfterEach.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        TestSuiteWithOnAfterEach.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        TestSuiteWithOnAfterEach.executionOrder.push(3);
    }
}

export class TestSuiteWithOnTeardown
{
    static executionOrder: number[] = [];

    onTeardown() {}
    
    async first()
    {
        await new Promise(resolve => setTimeout(resolve, 300));
        TestSuiteWithOnTeardown.executionOrder.push(1);
    }

    async second()
    {
        await new Promise(resolve => setTimeout(resolve, 200));
        TestSuiteWithOnTeardown.executionOrder.push(2);
    }

    async third()
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        TestSuiteWithOnTeardown.executionOrder.push(3);
    }
}