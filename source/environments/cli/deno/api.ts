// @ts-ignore TypeScript's Node resolver does not understand Deno JSR imports.
import * as path from "jsr:@std/path";
import type { CliRuntimeAdapter } from "../api.ts";
import { FileBasedAppSpecification } from "../api.ts";

type DenoRuntime = {
    args: string[];
    cwd(): string;
    stat(path: string): Promise<{
        isFile: boolean;
        isDirectory: boolean;
    }>;
    readDir(path: string): AsyncIterable<{
        name: string;
        isFile: boolean;
        isDirectory: boolean;
    }>;
    exit(code?: number): never;
};

const deno = (globalThis as typeof globalThis & { Deno: DenoRuntime; }).Deno;

const DenoEnvironment: CliRuntimeAdapter = {
    process: {
        cliArgs: deno.args,
        workingDirectory: deno.cwd(),
        terminateWithError: code => deno.exit(code)
    }
};

class DenoAppSpecification extends FileBasedAppSpecification
{
    async* streamNormalizedFileNamesRecursive(fileOrFolderPath: string): AsyncIterable<string>
    {
        const absolutePath = path.resolve(fileOrFolderPath);
        const stats = await deno.stat(absolutePath);

        if (stats.isFile)
            yield this.normalizeFileURLPath(absolutePath);
        else if (stats.isDirectory)
            for await (const entry of deno.readDir(absolutePath))
                yield* this.streamNormalizedFileNamesRecursive(path.join(absolutePath, entry.name));
    }

    private normalizeFileURLPath(filePath: string)
    {
        const normalizedPath = filePath.replaceAll("\\", "/");

        if (/^[A-Za-z]:\//.test(normalizedPath))
            return `/${normalizedPath}`;

        return normalizedPath;
    }
}

export { DenoAppSpecification as AppSpecification, DenoEnvironment as ProcessEnvironment };
