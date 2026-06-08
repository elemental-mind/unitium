export type RuntimeRunnerOptions = {
    silent: boolean;
    outputJSON: boolean;
    help: boolean;
};

export type RuntimeRunnerArguments = {
    options: RuntimeRunnerOptions;
    entryPoints: string[];
};

export const cliHelpText = `Usage: unitium [options] [path ...]

Runs Unitium tests discovered from files or folders.
When no paths are provided, Unitium scans the current working directory.
Multiple files and folders can be provided; only those entries are scanned.
Files and folders ignored by the working directory's .gitignore are skipped.

Options:
  --json      Print the test report as JSON.
  --silent    Suppress test report output.
  --help, -h  Show this help message.

Exit codes:
  0    All discovered tests passed, or help was shown.
  1    The runtime failed before Unitium could complete the test run.
  100  Unitium completed the run and at least one test failed.`;

export function parseRuntimeArguments(args: string[], workingDirectory: string): RuntimeRunnerArguments
{
    const entryPoints = args.filter(arg => !arg.startsWith("-"));

    return {
        options: {
            silent: args.includes("--silent"),
            outputJSON: args.includes("--json"),
            help: args.includes("--help") || args.includes("-h"),
        },
        entryPoints: entryPoints.length > 0 ? entryPoints : [workingDirectory]
    };
}
