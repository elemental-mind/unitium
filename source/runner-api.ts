/**
 * Programmatic runner API for loading and executing Unitium tests.
 *
 * Use this module when embedding Unitium in another tool, building a custom
 * command, or wiring custom reporters around the same test model used by the
 * CLI.
 *
 * @example
 * ```ts
 * import {
 *   ConsoleReporter,
 *   RuntimeEnvironment,
 *   TestRunner,
 * } from "@elemental/unitium/runner-api";
 *
 * const { AppSpecification } = await RuntimeEnvironment.resolveRuntimeModules();
 * const spec = new AppSpecification();
 * await spec.load(["./source"]);
 *
 * await new TestRunner(spec, [new ConsoleReporter(spec)]).run();
 * ```
 *
 * @module runner_api
 */

import type { CliRuntimeAdapter } from "./environments/cli/api.ts";
import type { SoftwareSpecification } from "./core/unitium.ts";

export { SoftwareSpecification, TestRunner, URLSetSpecification } from "./core/unitium.ts";
export { ConsoleReporter } from "./reporters/consoleReporter.ts";
export { JSONReporter } from "./reporters/jsonReporter.ts";
export type { BaseReporter } from "./reporters/base.ts";
export type { CliRuntimeAdapter };

/**
 * Resolves the runtime-specific pieces that let the runner work across Node, Bun, and Deno.
 *
 * The test runner works with a common specification and process adapter, while
 * this helper selects the implementation for the JavaScript runtime currently
 * executing the process.
 */
export class RuntimeEnvironment
{
    /**
     * Loads the file discovery and process adapter implementation for the current runtime.
     */
    static async resolveRuntimeModules(): Promise<{
        AppSpecification: new (workingDirectory?: string) => SoftwareSpecification;
        ProcessEnvironment: CliRuntimeAdapter;
    }>
    {
        if ("Deno" in globalThis)
            return await import("./environments/cli/deno/api.ts");
        else if ("Bun" in globalThis)
            return await import("./environments/cli/bun/api.ts");
        else
            return await import("./environments/cli/node/api.ts");
    }
}
