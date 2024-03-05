import { Test } from "./unitium.js";

export interface ITestSuiteMemberHooks
{
    onBeforeEach?(test: Test): void;
    onAfterEach?(test: Test): void;
}

export interface ITestSuiteStaticHooks
{
    onSetup?(): void;
    onTeardown?(): void;
}
