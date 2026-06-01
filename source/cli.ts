import { SoftwareSpecification, TestRunner } from "./core/unitium.ts";
import type { BaseReporter } from "./reporters/base.ts";
import { ConsoleReporter } from "./reporters/consoleReporter.ts";
import { JSONReporter } from "./reporters/jsonReporter.ts";
import type { CliRuntimeAdapter } from "./environments/cli/api.ts";

type RuntimeModule = {
    AppSpecification: new () => SoftwareSpecification;
    ProcessEnvironment: CliRuntimeAdapter;
};

type RuntimeRunnerOptions = {
    silent: boolean;
    outputJSON: boolean;
};

class CLIRunner
{
    private runtime!: CliRuntimeAdapter;
    private AppSpecification!: new () => SoftwareSpecification;
    private options!: RuntimeRunnerOptions;
    private entryPoints!: string[];

    async initialize()
    {
        const { AppSpecification, ProcessEnvironment } = await this.getRuntimeModule();
        const { options, entryPoints: fileSystemReferences } = this.parseRuntimeArguments(ProcessEnvironment.process.cliArgs);

        this.runtime = ProcessEnvironment;
        this.AppSpecification = AppSpecification;
        this.options = options;
        this.entryPoints = fileSystemReferences;

        return this;
    }

    async runTests()
    {
        const spec = new this.AppSpecification();
        await spec.load(this.entryPoints);
        await new TestRunner(spec, this.getReporters(spec)).run();

        if (spec.tests.some(test => test.error != undefined))
            this.runtime.process.terminateWithError(1);
    }

    async getRuntimeModule(): Promise<RuntimeModule>
    {
        if ("Deno" in globalThis)
            return await import("./environments/cli/deno/api.ts") as RuntimeModule;
        else if ("Bun" in globalThis)
            return await import("./environments/cli/bun/api.ts") as RuntimeModule;
        else
            return await import("./environments/cli/node/api.ts") as RuntimeModule;
    }

    parseRuntimeArguments(args: string[])
    {
        return {
            options: {
                silent: args.includes("--silent"),
                outputJSON: args.includes("--json"),
            },
            entryPoints: args.filter(arg => !arg.startsWith("--"))
        };
    }

    getReporters(spec: SoftwareSpecification): BaseReporter[]
    {
        if (this.options.silent)
            return [];
        else if (this.options.outputJSON)
            return [new JSONReporter(spec)];
        else
            return [new ConsoleReporter(spec)];
    }
}

const runner = await (new CLIRunner()).initialize();
await runner.runTests();
