import { Awaitable } from "deferium";
import type { IParallelTestSuiteStaticHooks, ISequentialTestSuiteMemberHooks } from "./hooks.ts";
import type { BaseReporter } from "../reporters/base.ts";

export type TestRunStatus = "None" | "Fail" | "Pass";
export type TestStatus = "pending" | "running" | "passed" | "failed";

export type SerializedSoftwareSpecification = {
    modules: SerializedTestModule[];
};

export type SerializedTestModule = {
    path: string;
    suites: SerializedTestSuite[];
};

export type SerializedTestSuite = {
    class: string;
    name: string;
    tests: SerializedTest[];
};

export type SerializedTest = {
    method: string;
    name: string;
    description?: string;
    status: TestRunStatus;
    error?: TestError;
};

export type SerializedTestError = {
    error: Error;
    actual: any;
    expected: any;
    name: string;
    message: string;
    stack: string;
    sourceFile: string;
    fileLocation: SourceFileLocation;
};

export type TestSuiteConstructor = IParallelTestSuiteStaticHooks & {
    new(): ISequentialTestSuiteMemberHooks;
    isSequential?: boolean;
    prototype: ISequentialTestSuiteMemberHooks & Record<string, Function>;
};

export type TestMethod = Function & { isDebugTest: boolean; };

export type SourceFileLocation = {
    line: number;
    column: number;
};

type ParsedStackLocation = {
    sourceFile: string;
    fileLocation: SourceFileLocation;
};

/**
* Executes a loaded software specification and notifies configured reporters.
*/
export class TestRunner extends Awaitable
{
    public specification: SoftwareSpecification;
    public reporters?: BaseReporter[];
    public options: TestRunnerOptions;

    public debugTarget?: TestModule;

    testingCompleted: Awaitable<void> = new Awaitable();

    constructor(loadedSpecification: SoftwareSpecification, reporters?: BaseReporter[], options: TestRunnerOptions = {})
    {
        super();

        if (!loadedSpecification.isLoaded)
            throw new Error("Cannot run an unloaded software specification. Call load() before passing it to TestRunner.");

        this.specification = loadedSpecification;
        this.reporters = reporters;
        this.options = options;

        const debugModule = this.specification.testModules.find(module => module.debugTarget !== undefined);
        if (debugModule !== undefined)
            this.debugTarget = debugModule;
    }

    /**
    * Runs all discovered test modules, suites, and tests.
    */
    async run(): Promise<void>
    {
        if (this.debugTarget === undefined)
            await this.runAllTests();
        else
            await this.runDebugTest();

        this.testingCompleted.resolve();
    }

    private async runAllTests()
    {
        if (this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunnerStart();

        const moduleRuns = [];
        for (const module of this.specification.testModules)
            moduleRuns.push(module.run());

        await Promise.all(moduleRuns);

        if (this.reporters)
            for (const reporter of this.reporters)
                reporter.onTestRunnerEnd();
    }

    private async runDebugTest()
    {
        if (!this.options.suppressDebugWarning)
            console.warn(`Running in test debug mode. Only executing test "${this.debugTarget!.debugTarget!.debugTarget!.name}" in "${this.debugTarget?.debugTarget?.className}" in ${this.debugTarget?.path}.\nRemove the @Debug decorator to run the full test suite.`);

        await this.debugTarget!.run();
    }
}

type TestRunnerOptions = {
    suppressDebugWarning?: boolean;
};

abstract class Serializable
{
    abstract serialize(): any;
}

export abstract class Observable extends Serializable
{
    runStarted: Awaitable<void> = new Awaitable();
    runCompleted: Awaitable<void> = new Awaitable();
}

/**
* Represents a collection of test modules loaded from runtime-specific entry points.
*
* A module is one imported test file. Each exported test class in that module becomes
* a suite, and each test method on that class becomes an individual test.
*/
export abstract class SoftwareSpecification extends Serializable
{
    public testModules: TestModule[] = [];
    public isLoaded = false;

    /**
    * All test suites discovered across loaded modules.
    */
    get testSuites(): TestSuite[]
    {
        return this.testModules.flatMap((module) => module.testSuites);
    }

    /**
    * All tests discovered across loaded suites.
    */
    get tests(): Test[]
    {
        return this.testSuites.flatMap((suite) => suite.tests);
    }

    /**
    * Resolves and imports test modules from entry points.
    *
    * @example
    * ```ts
    * const spec = new AppSpecification();
    * await spec.load(["./source", "./tests/example.test.ts"]);
    * ```
    */
    public async load(entryPointsOrModuleURLs: string[] = ["."]): Promise<void>
    {
        for (const moduleURL of await this.resolveTestModuleURLs(entryPointsOrModuleURLs))
            this.testModules.push(new TestModule(moduleURL, await import(/*@vite-ignore*/ moduleURL)));

        this.isLoaded = true;
    }

    abstract resolveTestModuleURLs(entryPoints: string[]): Promise<string[]>;

    /**
    * Converts the loaded specification into a JSON-serializable result tree.
    */
    serialize(): SerializedSoftwareSpecification
    {
        return {
            modules: this.testModules.map((module) => module.serialize()),
        };
    }
}

/**
* Software specification that treats provided entry points as importable module URLs.
* It does not perform resolution logic and returns the provided URLs unchanged, so it is the responsibility of the caller to provide valid module URLs.
*/
export class URLSetSpecification extends SoftwareSpecification
{
    /**
    * Returns the provided module URLs unchanged.
    */
    async resolveTestModuleURLs(moduleURLs: string[]): Promise<string[]>
    {
        return moduleURLs;
    }
}

export class TestModule extends Observable
{
    public path: string;
    public testSuites: TestSuite[] = [];

    public debugTarget?: TestSuite;

    get tests(): Test[]
    {
        return this.testSuites.flatMap((suite) => suite.tests);
    }

    constructor(path: string, module: any)
    {
        super();
        this.path = path;
        for (const key in module)
        {
            if (!TestSuite.isValid(module[key]))
                continue;

            const suite = new TestSuite(this, module[key]);
            if (suite.debugTarget !== undefined)
                this.debugTarget = suite;

            this.testSuites.push(suite);
        }
    }

    async run(): Promise<void>
    {
        this.runStarted.resolve();

        if (this.debugTarget)
            await this.debugTarget.run();
        else
        {
            const suiteRuns = [];
            for (const suite of this.testSuites)
                suiteRuns.push(suite.run());

            await Promise.all(suiteRuns);
        }

        this.runCompleted.resolve();
    }

    serialize(): SerializedTestModule
    {
        return {
            path: this.path,
            suites: this.testSuites.map((suite) => suite.serialize()),
        };
    }
}

export class TestSuite extends Observable
{
    public testModule: TestModule;
    public testClassConstructor: TestSuiteConstructor;
    public className: string;
    public name: string;
    public tests: Test[] = [];

    public debugTarget?: Test;

    public isSequential = false;
    public containsTestHooks = false;

    constructor(testModule: TestModule, testClassConstructor: TestSuiteConstructor)
    {
        super();
        this.testModule = testModule;
        this.testClassConstructor = testClassConstructor;
        this.className = testClassConstructor.name;
        this.name = capitalizeText(camelToNormal(this.className));

        const testFunctionNames = Object.getOwnPropertyNames(this.testClassConstructor.prototype);

        const hookNames = [
            "constructor",
            "onSetup",
            "onBeforeEach",
            "onAfterEach",
            "onTeardown",
        ];

        const testClassProto = this.testClassConstructor.prototype;
        if (testClassProto.onBeforeEach || testClassProto.onAfterEach || testClassProto.onSetup || testClassProto.onTeardown)
            this.containsTestHooks = true;

        if (this.testClassConstructor.isSequential || this.containsTestHooks)
            this.isSequential = true;

        for (const testFunctionName of testFunctionNames)
        {
            if (hookNames.includes(testFunctionName) || typeof testClassProto[testFunctionName] !== "function")
                continue;

            const test = new Test(this, testFunctionName);
            if (test.isDebugTarget)
                this.debugTarget = test;

            this.tests.push(test);
        }
    }

    static isValid(constructorFct: any): constructorFct is TestSuiteConstructor
    {
        return typeof constructorFct === "function" && constructorFct.prototype;
    }

    async run(): Promise<void>
    {
        this.runStarted.resolve();

        if (this.isSequential)
        {
            const stopAtDebugTest = this.debugTarget !== undefined;
            const testInstance = new this.testClassConstructor();

            testInstance.onSetup?.();
            for (const test of this.tests)
            {
                await testInstance.onBeforeEach?.(test);
                await test.run(testInstance);

                if (stopAtDebugTest && this.debugTarget === test) break;

                await testInstance.onAfterEach?.(test);
            }
            testInstance.onTeardown?.();
        }
        else
        {
            const testRunPromises = [];
            await this.testClassConstructor.onSetup?.();

            if (this.debugTarget)
                testRunPromises.push(this.runTestParallel(this.debugTarget));
            else
                for (const test of this.tests)
                    testRunPromises.push(this.runTestParallel(test));

            await Promise.all(testRunPromises);

            await this.testClassConstructor.onTeardown?.();
        }

        this.runCompleted.resolve();
    }

    async runTestParallel(test: Test): Promise<void>
    {
        const testInstance = new this.testClassConstructor();
        await testInstance.onBeforeEach?.(test);
        await test.run(testInstance);
        await testInstance.onAfterEach?.(test);
    }

    serialize(): SerializedTestSuite
    {
        return {
            class: this.className,
            name: this.name,
            tests: this.tests.map((test) => test.serialize()),
        };
    }
}

export class Test extends Observable
{
    public testSuite: TestSuite;
    public testFunctionName: string;
    public error?: TestError;
    public description?: string;
    public startTime?: number;
    public endTime?: number;

    public isDebugTarget: boolean;

    constructor(testSuite: TestSuite, testFunctionName: string)
    {
        super();
        this.testSuite = testSuite;
        this.testFunctionName = testFunctionName;
        this.isDebugTarget = (testSuite.testClassConstructor.prototype[testFunctionName] as TestMethod).isDebugTest;
    }

    get name(): string
    {
        return ensureCapitalizedFirstLetter(camelToNormal(this.testFunctionName));
    }

    get status(): TestStatus
    {
        if (!this.runStarted.isResolved)
            return "pending";
        if (!this.runCompleted.isResolved)
            return "running";

        return this.error ? "failed" : "passed";
    }

    async run(testFixture: any): Promise<void>
    {
        this.startTime = Date.now();
        this.runStarted.resolve();

        try
        {
            await testFixture[this.testFunctionName]();
        } catch (e: Error | any)
        {
            this.error = new TestError(e);
        }

        this.endTime = Date.now();
        this.runCompleted.resolve();
    }

    serialize(): SerializedTest
    {
        let status;
        if (!this.runCompleted.isResolved)
            status = "None";
        else
            status = this.error ? "Fail" : "Pass";

        return {
            method: this.testFunctionName,
            name: this.name,
            description: this.description,
            status: status as "None" | "Fail" | "Pass",
            error: this.error,
        };
    }
}

export class TestError extends Serializable
{
    private error: Error;
    public actual: any;
    public expected: any;
    public name!: string;
    public message!: string;
    public stack!: string;
    public sourceFile: string;
    public fileLocation: SourceFileLocation;

    constructor(error: Error)
    {
        super();
        this.error = error;
        Object.assign(this, error);
        this.name = error.name;
        this.message = error.message;
        this.stack = error.stack ?? "";

        const stackLocation = parseStackLocation(error.stack);
        this.sourceFile = stackLocation?.sourceFile ?? "";
        this.fileLocation = stackLocation?.fileLocation ?? { line: 0, column: 0 };
    }

    serialize(): SerializedTestError
    {
        return {
            error: this.error,
            actual: this.actual,
            expected: this.expected,
            name: this.name,
            message: this.message,
            stack: this.stack,
            sourceFile: this.sourceFile,
            fileLocation: this.fileLocation,
        };
    }
}

function parseStackLocation(stack?: string): ParsedStackLocation | undefined
{
    if (!stack)
        return undefined;

    for (const line of stack.split("\n"))
    {
        const frame = line.trim();

        if (!frame.startsWith("at "))
            continue;

        const frameBody = frame.slice(3);
        const location = frameBody.endsWith(")") && frameBody.includes("(")
            ? frameBody.slice(frameBody.lastIndexOf("(") + 1, -1)
            : frameBody;

        const locationParts = /^(.*):(\d+):(\d+)$/.exec(location);

        if (!locationParts || locationParts[1] === "native" || locationParts[1] === "unknown location")
            continue;

        return {
            sourceFile: locationParts[1],
            fileLocation: {
                line: Number(locationParts[2]),
                column: Number(locationParts[3]),
            },
        };
    }

    return undefined;
}

function camelToNormal(camelCaseString: string): string
{
    const spaceSeparatedString = camelCaseString
        // Allow explicit word boundaries in test names: "usesCLI_withSpaces" becomes "usesCLI withSpaces".
        .replace(/_+/g, " ")
        // Split an acronym from the conventional word following it: "CLIRunner" becomes "CLI Runner".
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        // Split regular camelCase boundaries. When lowercase letters or numbers are followed by an uppercase letter, introduce a space.
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        // Insert spaces after letters and before numbers: "for10" becomes "for 10".
        .replace(/([A-Za-z])(\d)/g, "$1 $2");

    const caseNormalizedString = spaceSeparatedString
        .split(" ")
        .map(word => isUpperCaseAcronym(word) ? word : word.toLowerCase())
        .join(" ");

    return caseNormalizedString;
}

function ensureCapitalizedFirstLetter(word: string): string
{
    return word[0].toUpperCase() + word.slice(1);
}

function capitalizeText(text: string): string
{
    return text.split(" ").map(word => ensureCapitalizedFirstLetter(word)).join(" ");
}

function isUpperCaseAcronym(word: string): boolean
{
    return /^[A-Z]{2,}$/.test(word);
}
