import { Test } from "./unitium.js";

export interface ITestSuiteMemberHooks
{
    onBeforeEach?(test: Test): void | Promise<void>;
    onAfterEach?(test: Test): void | Promise<void>;
}

export interface ITestSuiteStaticHooks
{
    onSetup?(): void | Promise<void>;
    onTeardown?(): void | Promise<void>;
}
