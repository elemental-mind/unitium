import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ConsoleJSONTestReport } from "../source/automation-api.ts";

const run = promisify(execFile);

const testCommands = {
    node: {
        command: "tsx",
        args: ["./distribution/node/environments/cli/node/exec-tsx.js", "--json", "./source"],
    },
    bun: {
        command: "bun",
        args: ["./distribution/node/cli.js", "--json", "./source"],
    },
    deno: {
        command: "deno",
        args: ["run", "--config", "./distribution/deno/deno.json", "--no-lock", "--allow-read", "--allow-env", "./distribution/deno/cli.ts", "--json", "./source"],
    },
};

const ReportSymbols = new Map([
    [undefined, "🟠"],
    ["Fail", "🔴"],
    ["Pass", "🟢"]
]);

export class MultiRuntimeTester
{
    async run()
    {
        const runtimeResults = {} as Record<string, ConsoleJSONTestReport>;

        await Promise.all(Object.entries(testCommands)
            .map(([environment, command]) =>
                this.executeCommand(command)
                    .then(result => runtimeResults[environment] = JSON.parse(result))));

        this.print(runtimeResults);
    }

    private async executeCommand(command: { command: string; args: string[]; })
    {
        try
        {
            return (await run(command.command, command.args, { shell: true })).stdout;
        }
        catch (error: any)
        {
            //Unitium returns 100 on failed tests, but still emits results to stdout.
            if (error.code === 100) return error.stdout as string; else throw error;
        }
    }

    private print(results: Record<string, ConsoleJSONTestReport>)
    {
        const { consolidatedResults, maxTestNameLength } = this.consolidate(results);
        const maxEnvLen = Math.max(...Object.keys(results).map(k => k.length));
        const header = Object.keys(results).map(k => k.padEnd(maxEnvLen)).join(" | ");

        for (const [modName, mod] of Object.entries(consolidatedResults))
        {
            console.group(modName);
            for (const [suiteName, suite] of Object.entries(mod))
            {
                console.group(suiteName.padEnd(maxTestNameLength + 2) + header);
                for (const [testName, envResults] of Object.entries(suite))
                {
                    const resultColumns = Object.keys(results).map(env => ReportSymbols.get(envResults[env])!.padEnd(maxEnvLen));
                    console.log(testName.padEnd(maxTestNameLength) + resultColumns.join(" | "));
                }
                console.log();
                console.groupEnd();
            }
            console.log();
            console.groupEnd();
        }
    }

    private consolidate(results: Record<string, ConsoleJSONTestReport>)
    {
        type ModulePath = string;
        type SuiteName = string;
        type TestName = string;
        type EnvName = string;

        const consolidatedResults:
            Record<ModulePath,
                Record<SuiteName,
                    Record<TestName,
                        Record<EnvName, "Fail" | "Pass">>
                >
            > = {};

        let maxTestNameLength = 0;

        for (const [environment, report] of Object.entries(results))
            for (const module of report.modules)
                for (const suite of module.suites)
                    for (const test of suite.tests)
                    {
                        maxTestNameLength = Math.max(test.method.length, maxTestNameLength);
                        this.writeInObject(consolidatedResults, [module.path, suite.class, test.method, environment], test.status);
                    }

        return {
            maxTestNameLength: maxTestNameLength + 5,
            consolidatedResults
        };
    }

    private writeInObject<O extends Record<string, unknown>, V>(object: O, path: string[], value: V)
    {
        const [segments, accessor] = [path.slice(0, -1), path.at(-1)!];
        let current = object as any;

        for (const segment of segments)
            current = current[segment] ? current[segment] as Record<string, unknown> : current[segment] = {} as Record<string, unknown>;

        current[accessor] = value;
    }
}

new MultiRuntimeTester().run();
