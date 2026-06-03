import { ConsoleReporter, JSONReporter, RuntimeEnvironment, SoftwareSpecification, TestRunner } from "./runner-api.ts";
import type { BaseReporter, CliRuntimeAdapter } from "./runner-api.ts";

type RuntimeRunnerOptions = {
    silent: boolean;
    outputJSON: boolean;
};

type RuntimeRunnerArguments = {
    options: RuntimeRunnerOptions;
    entryPoints: string[];
};

class CLIRunner extends TestRunner
{
    private runtime: CliRuntimeAdapter;

    private constructor(
        loadedSpecification: SoftwareSpecification,
        reporters: BaseReporter[],
        runtime: CliRuntimeAdapter
    )
    {
        super(loadedSpecification, reporters);
        this.runtime = runtime;
    }

    static async initialize(): Promise<{ runner: CLIRunner; }>
    {
        const { AppSpecification, ProcessEnvironment } = await RuntimeEnvironment.resolveRuntimeModules();
        const { options, entryPoints } = this.parseRuntimeArguments(ProcessEnvironment.process.cliArgs);

        const spec = new AppSpecification();
        await spec.load(entryPoints);

        // CLIRunner is awaitable through TestRunner, so wrap it to avoid async return thenable assimilation.
        return { runner: new CLIRunner(spec, this.resolveReporters(options, spec), ProcessEnvironment) };
    }

    async run()
    {
        await super.run();

        if (this.specification.tests.some(test => test.error != undefined))
            this.runtime.process.terminateWithError(100);
    }

    private static parseRuntimeArguments(args: string[]): RuntimeRunnerArguments
    {
        return {
            options: {
                silent: args.includes("--silent"),
                outputJSON: args.includes("--json"),
            },
            entryPoints: args.filter(arg => !arg.startsWith("--"))
        };
    }

    private static resolveReporters(options: RuntimeRunnerOptions, spec: SoftwareSpecification): BaseReporter[]
    {
        if (options.silent)
            return [];
        else if (options.outputJSON)
            return [new JSONReporter(spec)];
        else
            return [new ConsoleReporter(spec)];
    }
}

const { runner } = await CLIRunner.initialize();
await runner.run();
