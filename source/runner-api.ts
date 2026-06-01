// Public API for controlling test running.
import type { CliRuntimeAdapter } from "./environments/cli/api.ts";
import type { SoftwareSpecification } from "./core/unitium.ts";

export { SoftwareSpecification, TestRunner, URLSetSpecification } from "./core/unitium.ts";
export { ConsoleReporter } from "./reporters/consoleReporter.ts";
export { JSONReporter } from "./reporters/jsonReporter.ts";
export type { BaseReporter } from "./reporters/base.ts";
export type { CliRuntimeAdapter };

export class RuntimeEnvironment
{
    static async resolveRuntimeModules(): Promise<{
        AppSpecification: new () => SoftwareSpecification;
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
