import { TestEnvironment } from "../environments/testEnvironment.js";
import { capitalCase, camelToNormal } from "../formatting.js";
import { TestFunction } from "./testFunction.js";
import { TestModule } from "./testModule.js";
import { TestHook, TestHookType } from "./testHook.js";
import { Observable } from "../eventPropagation.js";
import { ITestSuiteConstructor } from "../interfaces.js";
import { EnvironmentDecorator, ITestSetupConstructor, SetupManager, TestSetup } from "../setups/testSetup.js";
import { DefaultSetup } from "../setups/preDefined/defaultSetup.js";

export class TestSuite extends Observable
{
    public className: string;
    public name: string;
    public tests: TestFunction[] = [];
    public hooks: TestHook[] = [];
    public setupType: ITestSetupConstructor;

    constructor(
        public testModule: TestModule,
        public testClass: ITestSuiteConstructor
    )
    {
        super();
        this.className = testClass.name;
        this.name = capitalCase(camelToNormal(this.className));

        this.setupType = this.detectTestSetup();

        for (const [memberName, member] of Object.entries(this.testClass.prototype))
            if (typeof member === "function")
                this.parsePublicMemberFunction(member);
    }

    get hasSequentialDecorator()
    {
        return this.testClass.__meta?.isSequential === true;
    }

    get hasTestHooks()
    {
        return this.hooks.length > 1;
    }

    get isExecutedInMultipleEnvironments()
    {
        return SetupManager.isMultiEnvironmentSetup(this.setupType);
    }

    get isSequential()
    {
        return this.hasSequentialDecorator || this.hasTestHooks || this.isExecutedInMultipleEnvironments;
    }

    private detectTestSetup(): ITestSetupConstructor
    {
        const setupMetadata = this.testClass.__meta?.setup;
        if (!setupMetadata)
            return DefaultSetup;
        else
        {
            if (setupMetadata.configuration)
                return SetupManager.decoratorToSetupMap.get(setupMetadata.configuration?.decorator)!;
            else
            {
                const functionDecorators = Object.values(setupMetadata.functions!);
                const referencedSetups = functionDecorators.map(decorator => SetupManager.decoratorToSetupMap.get(decorator));
                const uniqueSetups = new Set(referencedSetups);
                if (uniqueSetups.size > 1)
                    throw new Error("Environment references of two or more setups used on one test suite.");
                else
                    return [...uniqueSetups][0]!;
            }
        }
    }

    private parsePublicMemberFunction(memberFunction: Function)
    {
        const hookMatch = memberFunction.name.match(TestHook.regex);

        if (!hookMatch && !(memberFunction.name === "constructor"))
            this.tests.push(new TestFunction(this, memberFunction));
        else if (hookMatch)
            this.hooks.push(new TestHook(this, memberFunction));
    }

    async run()
    {
        this.runStarted.resolve();

        const setup = new this.setupType();

        if (this.isSequential)
        {
            const environmentInstances = await this.initializeSerialInstances(setup);

            for (const test of this.tests)
            {
                const suiteInstance = await environmentInstances.get(test.executionEnvironment)!;
                await suiteInstance.onBeforeEach();
                if (!await suiteInstance.runTest(test))
                    break;
                await suiteInstance.onAfterEach();
            }

            await this.finalizeSerialInstances(environmentInstances);
        }
        else
        {
            const testRunPromises = [];

            const {instances, environment} = await this.initializeParallelInstances(setup);

            for (const test of this.tests)
            {
                const instance = await instances.get(test)!;
                testRunPromises.push(instance.runTest(test));
            }

            await Promise.all(testRunPromises);

            await environment.runStatic(this, "onTeardown");
        }

        this.runCompleted.resolve();
    }

    private async initializeSerialInstances(setup: TestSetup)
    {
        const loadedEnvironments = await setup.loadEnvironments(this);
        const suiteInstances = new Map<EnvironmentDecorator, Promise<TestSuiteInstance>>();

        for (const [environmentType, environment] of loadedEnvironments)
            suiteInstances.set(environmentType, environment.instantiateSuite(this));

        return suiteInstances;
    }

    private async initializeParallelInstances(setup: TestSetup)
    {
        const loadedEnvironments = await setup.loadEnvironments(this);

        //We only run parallel tests in single-environment suites. Hence the default environment is our execution environment.
        const environment = loadedEnvironments.get(this.setupType.Default)!;

        const instances = new Map<TestFunction, Promise<TestSuiteInstance>>();

        await environment.runStatic(this, "onSetup");

        for (const test of this.tests)
            instances.set(test, environment.instantiateSuite(this));

        return { instances, environment };
    }

    private async finalizeSerialInstances(instances: Map<EnvironmentDecorator, Promise<TestSuiteInstance>>)
    {
        const tearDownPromises = [];
        for (const [envType, suiteInstancePromise] of instances)
        {
            const suiteInstance = await suiteInstancePromise;
            tearDownPromises.push(this.freeEnvironment(suiteInstance));
        }

        await Promise.all(tearDownPromises);
    }

    private async freeEnvironment(suiteInstance: TestSuiteInstance)
    {
        await suiteInstance.teardown();
        suiteInstance.testEnvironment.release();
    }

    async runParallelTest(environment: TestEnvironment, test: TestFunction)
    {
        const testInstance = await TestSuiteInstance.create(this, environment);
        await testInstance.onBeforeEach();
        await test.run(testInstance);
        await testInstance.onAfterEach();
    }
}

class TestSuiteInstance
{
    static async create(testSuite: TestSuite, testEnvironment: TestEnvironment)
    {
        const suiteInstance = await testEnvironment.instantiateSuite(testSuite);
        return new TestSuiteInstance(testSuite, testEnvironment, suiteInstance);
    }

    private constructor(
        public testSuite: TestSuite,
        public testEnvironment: TestEnvironment,
        public instance: any
    )
    { }

    public async setup()
    {
        this.runHook("Setup");
    }

    public async onBeforeEach()
    {
        this.runHook("Before");
    }

    public async runTest(testFunction: TestFunction)
    {
        return await testFunction.run(this.instance);
    }

    public async onAfterEach()
    {
        this.runHook("After");
    }

    public async teardown()
    {
        await this.runHook("Teardown");
    }

    private async runHook(hookType: TestHookType)
    {
        const hook = this.testSuite.hooks.find(hook => hook.type === hookType && hook.environment === this.testEnvironment.constructor);
        if (hook)
            await this.instance[hook.functionName]();
    }
}