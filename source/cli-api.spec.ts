import assert from "node:assert";
import { cliHelpText, parseRuntimeArguments } from "./cli-api.ts";

export class CLIArgumentParsingTests
{
    shouldUseWorkingDirectoryWhenNoEntryPointsArePassed()
    {
        const args = parseRuntimeArguments(["--json"], "/project");

        assert.deepStrictEqual(args.entryPoints, ["/project"]);
    }

    shouldUseProvidedEntryPoints()
    {
        const args = parseRuntimeArguments(["--silent", "./source", "./tests/example.test.ts"], "/project");

        assert.deepStrictEqual(args.entryPoints, ["./source", "./tests/example.test.ts"]);
    }

    shouldDetectHelpFlag()
    {
        const args = parseRuntimeArguments(["--help"], "/project");

        assert.strictEqual(args.options.help, true);
        assert.match(cliHelpText, /Usage: unitium/);
        assert.match(cliHelpText, /--help/);
        assert.match(cliHelpText, /Multiple files and folders/);
        assert.match(cliHelpText, /\.gitignore/);
        assert.match(cliHelpText, /100\s+Unitium completed the run/);
    }
}
