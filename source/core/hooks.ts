import type { Test } from "./unitium.ts";

/**
 * Member lifecycle hooks available to sequential test suites.
 *
 * Implement these methods on a suite class when tests need shared instance state
 * or per-test setup and teardown.
 */
export interface ISequentialTestSuiteMemberHooks
{
    /**
     * Runs once before the first test in the suite.
     */
    onSetup?(): void | Promise<void>;
    /**
     * Runs before each test with the test that is about to execute.
     */
    onBeforeEach?(test: Test): void | Promise<void>;
    /**
     * Runs after each test with the test that just executed.
     */
    onAfterEach?(test: Test): void | Promise<void>;
    /**
     * Runs once after the final test in the suite.
     */
    onTeardown?(): void | Promise<void>;
}

/**
 * Static lifecycle hooks available to parallel test suites.
 *
 * Implement these methods on the suite constructor when setup or teardown should
 * wrap all parallel test instances.
 */
export interface IParallelTestSuiteStaticHooks
{
    /**
     * Runs once before any tests in the suite start.
     */
    onSetup?(): void | Promise<void>;
    /**
     * Runs once after all tests in the suite finish.
     */
    onTeardown?(): void | Promise<void>;
}
