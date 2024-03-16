import { Observable } from "../eventPropagation.js";
import { capitalCase, camelToNormal } from "../formatting.js";
import { ITestSuiteConstructor } from "../interfaces.js";
import { TestFunction } from "./testFunction.js";
import { TestModule } from "./testModule.js";

export class TestSuite extends Observable
{
    public className: string;
    public name: string;
    public tests: TestFunction[] = [];

    public isSequential = false;
    public containsTestHooks = false;

    constructor(
        public testModule: TestModule,
        public testClassConstructor: ITestSuiteConstructor
    )
    {
        super();
        this.className = testClassConstructor.name;
        this.name = capitalCase(camelToNormal(this.className));

        const testFunctionNames = Object.getOwnPropertyNames(this.testClassConstructor.prototype);

        const noTestNames = ["constructor", "onSetup", "onBeforeEach", "onAfterEach", "onTeardown"];

        if (this.testClassConstructor.prototype.onBeforeEach || this.testClassConstructor.prototype.onAfterEach || this.testClassConstructor.prototype.onSetup || this.testClassConstructor.prototype.onTeardown)
            this.containsTestHooks = true;

        if (this.testClassConstructor.__meta?.isSequential || this.containsTestHooks)
            this.isSequential = true;

        for (const testFunctionName of testFunctionNames)
            if (!noTestNames.includes(testFunctionName) && typeof this.testClassConstructor.prototype[testFunctionName] === "function")
                this.tests.push(new TestFunction(this, testFunctionName));
    }

    static isValid(constructorFct: any)
    {
        return typeof constructorFct === "function" && constructorFct.prototype;
    }

    async run()
    {
        this.runStarted.resolve();

        if (this.isSequential)
        {
            const testInstance = new this.testClassConstructor();

            testInstance.onSetup?.();
            for (const test of this.tests)
            {
                await testInstance.onBeforeEach?.(test);
                await test.run(testInstance);
                await testInstance.onAfterEach?.(test);
            }
            testInstance.onTeardown?.();
        }
        else
        {
            const testRunPromises = [];
            await this.testClassConstructor.onSetup?.();

            for (const test of this.tests)
                testRunPromises.push(this.runTestParallel(test));

            await Promise.all(testRunPromises);

            await this.testClassConstructor.onTeardown?.();
        }

        this.runCompleted.resolve();
    }

    async runTestParallel(test: TestFunction)
    {
        const testInstance = new this.testClassConstructor();
        await testInstance.onBeforeEach?.(test);
        await test.run(testInstance);
        await testInstance.onAfterEach?.(test);
    }
}