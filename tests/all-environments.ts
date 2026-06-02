import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ConsoleJSONTestReport } from "../source/automation-api.ts";

const run = promisify(execFile);

type Command = { command: string, args: string[]; };

const ReportSymbols = new Map([
    [undefined, "🟠"],
    ["Fail", "🔴"],
    ["Pass", "🟢"]
]);

export class MultiRuntimeTester
{
    private testCommands: Record<string, Command> = {
        node: {
            command: "tsx",
            args: ["./source/cli.ts", "./source", "--json"],
        },
        bun: {
            command: "bun",
            args: ["./source/cli.ts", "./source", "--json"],
        },
        deno: {
            command: "deno",
            args: ["run", "--allow-read", "--allow-env", "./source/cli.ts", "./source", "--json"],
        },
    };

    async run()
    {
        const runtimeResults = {} as Record<string, ConsoleJSONTestReport>;

        await Promise.all(Object.entries(this.testCommands)
            .map(([environment, command]) =>
                this.executeCommand(command)
                    .then(result => runtimeResults[environment] = JSON.parse(result))));

        this.printResults(runtimeResults);
    }

    private async executeCommand(command: Command)
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

    private printResults(results: Record<string, ConsoleJSONTestReport>)
    {
        const { consolidatedResults, maxTestNameLength } = this.consolidateResults(results);

        const maxRuntimeNameLength = Object.keys(results).reduce((maxLength, current) => Math.max(maxLength, current.length), 0);

        const suiteEnvHeader = Object.keys(results).map(runtimeName => runtimeName.padEnd(maxRuntimeNameLength)).join(" | ");

        for (const moduleName in consolidatedResults)
        {
            const module = consolidatedResults[moduleName];

            console.group(moduleName);
            for (const suiteName in module)
            {
                const suite = module[suiteName];

                console.group(suiteName.padEnd(maxTestNameLength + 2) + suiteEnvHeader);
                for (const testName in suite)
                {
                    const envResults = suite[testName];
                    this.printTestResult(testName, envResults, maxTestNameLength, results, maxRuntimeNameLength);
                }
                console.log();
                console.groupEnd();
            }
            console.log();
            console.groupEnd();
        }
    }

    private printTestResult(testName: string, envResults: Record<keyof typeof envReports, "Fail" | "Pass">, maxTestNameLength: number, envReports: Record<string, ConsoleJSONTestReport>, maxEnvNameLength: number)
    {
        const results = [];

        for (const envName in envReports)
            results.push(ReportSymbols.get(envResults[envName])!.padEnd(maxEnvNameLength));

        console.log(testName.padEnd(maxTestNameLength) + results.join(" | "));
    }

    private consolidateResults(results: Record<string, ConsoleJSONTestReport>)
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

        for (const environment in results)
            for (const module of results[environment].modules)
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
