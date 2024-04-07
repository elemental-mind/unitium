import type { TestFunction } from "./models/testFunction.js"

export interface ISequentialTestSuiteMemberHooks
{
    onSetup?(): void | Promise<void>;
    onBeforeEach?(test: TestFunction): void | Promise<void>;
    onAfterEach?(test: TestFunction): void | Promise<void>;
    onTeardown?(): void | Promise<void>;
}

export interface IParallelTestSuiteStaticHooks
{
    onSetup?(): void | Promise<void>;
    onTeardown?(): void | Promise<void>;
}
