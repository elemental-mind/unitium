/**
 * Unitium command-line runner.
 *
 * This executable entry point discovers test files from the current working
 * directory or provided paths, runs exported test suites, and reports results to
 * the console or JSON output.
 * 
 *  * @example
 * ```sh
 * npx unitium
 * ```
 * 
 * @example
 * ```sh
 * deno x --allow-read jsr:@elemental/unitium/cli ./source --json
 * ```
 *  *  * @example
 * ```sh
 * npx unitium ./source --json
 * ```
 *
 * @module unitium_cli
 */

import { ConsoleReporter, JSONReporter, RuntimeEnvironment, SoftwareSpecification, TestRunner } from "./runner-api.ts";
import type { BaseReporter, CliRuntimeAdapter } from "./runner-api.ts";
import { cliHelpText, parseRuntimeArguments, type RuntimeRunnerOptions } from "./cli-api.ts";

class CLIRunner extends TestRunner
{
    private runtime: CliRuntimeAdapter;

    private constructor(loadedSpecification: SoftwareSpecification, reporters: BaseReporter[], runtime: CliRuntimeAdapter)
    {
        super(loadedSpecification, reporters);
        this.runtime = runtime;
    }

    static async initialize(): Promise<{ runner?: CLIRunner; }>
    {
        const { AppSpecification, ProcessEnvironment } = await RuntimeEnvironment.resolveRuntimeModules();
        const { options, entryPoints } = parseRuntimeArguments(
            ProcessEnvironment.process.cliArgs,
            ProcessEnvironment.process.workingDirectory
        );

        if (options.help)
        {
            console.log(cliHelpText);
            return {};
        }

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
await runner?.run();
