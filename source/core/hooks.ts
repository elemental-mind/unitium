import type { Test } from "./unitium.ts";

export interface ISequentialTestSuiteMemberHooks
{
    onSetup?(): void | Promise<void>;
    onBeforeEach?(test: Test): void | Promise<void>;
    onAfterEach?(test: Test): void | Promise<void>;
    onTeardown?(): void | Promise<void>;
}

export interface IParallelTestSuiteStaticHooks
{
    onSetup?(): void | Promise<void>;
    onTeardown?(): void | Promise<void>;
}
