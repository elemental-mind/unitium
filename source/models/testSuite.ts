import { ClassDeclaration, ClassMethod, Identifier } from "@swc/core";
import { TestEnvironment, TestEnvironmentConstructor } from "../environments/testEnvironment.js";
import { capitalCase, camelToNormal } from "../formatting.js";
import { TestFunction } from "./testFunction.js";
import { TestModule } from "./testModule.js";
import { getDecoratorDefinedEnvironment, getDecoratorNames } from "../decorators.js";
import { TestHook, TestHookType } from "./testHook.js";
import { NodeInProcessEnvironment } from "../environments/inProcessEnvironments/node/environment.js";
import { Observable } from "../eventPropagation.js";

export class TestSuite extends Observable
{
    static setupIdProvider = 0;
    public className: string;
    public name: string;
    public tests: TestFunction[] = [];
    public hooks: TestHook[] = [];
    public defaultTestEnvironmentType;

    constructor(
        public testModule: TestModule,
        public testClassNode: ClassDeclaration
    )
    {
        super();
        this.className = testClassNode.identifier.value;
        this.name = capitalCase(camelToNormal(this.className));

        this.defaultTestEnvironmentType = getDecoratorDefinedEnvironment(testClassNode) ?? NodeInProcessEnvironment;

        for (const member of this.classMethods)
            this.parsePublicMemberFunction(member);
    }

    get hasSequentialDecorator()
    {
        return getDecoratorNames(this.testClassNode)?.includes("Sequential");
    }

    private get classMethods()
    {
        return this.testClassNode.body
            .filter((member): member is ClassMethod => member.type === "ClassMethod" && member.accessibility === "public");
    }

    get hasTestHooks()
    {
        return this.hooks.length > 1;
    }

    get isExecutedInMultipleEnvironments()
    {
        const baseEnvironment = this.defaultTestEnvironmentType;
        for (const test of this.tests)
        {
            if (test.environment !== baseEnvironment)
                return true;
        }
        return false;
    }

    get isSequential()
    {
        return this.hasSequentialDecorator || this.hasTestHooks || this.isExecutedInMultipleEnvironments;
    }

    private parsePublicMemberFunction(memberFunction: ClassMethod)
    {
        const functionName = (memberFunction.key as Identifier).value;
        const hookMatch = functionName.match(TestHook.regex);

        if (!hookMatch)
        {
            if (functionName !== "constructor")
                this.tests.push(new TestFunction(this, memberFunction));
        }
        else
            this.hooks.push(new TestHook(this, memberFunction));
    }

    async run()
    {
        this.runStarted.resolve();

        if (this.isSequential)
        {
            const environmentInstances = await this.initializeSerialInstances();

            for (const test of this.tests)
            {
                const suiteInstance = await environmentInstances.get(test.environment)!;
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

            //We only run parallel tests in single-environment suites. Hence the default environment is our execution environment.
            const {instances, environment} = await this.initializeParallelInstances();

            for (const test of this.tests)
            {
                const instance = await instances.get(test)!;
                testRunPromises.push(instance.runTest(test));
            }

            await Promise.all(testRunPromises);

            await environment.runStatic(this.testModule.filePath, this.className, "onTeardown");
        }

        this.runCompleted.resolve();
    }

    private async initializeSerialInstances()
    {
        const setupID = TestSuite.setupIdProvider++;
        const testEnvironmentTypes = new Set(this.tests.map(test => test.environment)).values();
        const suiteInstances = new Map<TestEnvironmentConstructor, Promise<TestSuiteInstance>>();

        for (const envType of testEnvironmentTypes)
            suiteInstances.set(envType, this.loadEnvAndInstantiate(envType, setupID));

        await Promise.all(suiteInstances.values());
        return suiteInstances;
    }

    private async initializeParallelInstances()
    {
        const setupID = TestSuite.setupIdProvider++;
        const environment = await this.defaultTestEnvironmentType.acquire(setupID);
        const instances = new Map<TestFunction, Promise<TestSuiteInstance>>();

        await environment.runStatic(this.testModule.filePath, this.className, "onSetup");

        for (const test of this.tests)
        {
            instances.set(test, TestSuiteInstance.create(this, environment));
        }

        return {instances, environment};
    }

    private async loadEnvAndInstantiate(envType: TestEnvironmentConstructor, setupID: number)
    {
        const environment = await envType.acquire(setupID);
        const instance = await TestSuiteInstance.create(this, environment);
        await instance.setup();
        return instance;
    }

    private async finalizeSerialInstances(instances: Map<TestEnvironmentConstructor, Promise<TestSuiteInstance>>)
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