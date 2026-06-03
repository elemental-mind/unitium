// @ts-ignore TypeScript's Node resolver does not understand Deno JSR imports.
import * as path from "jsr:@std/path";
// @ts-ignore TypeScript's Node resolver does not understand Deno npm imports.
import ignore from "npm:ignore";
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
    readTextFile(path: string): Promise<string>;
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
    private gitIgnore = ignore();
    private workingDirectory: string;

    constructor(workingDirectory = DenoEnvironment.process.workingDirectory)
    {
        super();
        this.workingDirectory = workingDirectory;
    }

    async load(entryPointsOrModuleURLs: string[] = ["."])
    {
        await this.loadGitIgnore();
        await super.load(entryPointsOrModuleURLs);
    }

    async* streamNormalizedFileNamesRecursive(fileOrFolderPath: string): AsyncIterable<string>
    {
        const absolutePath = path.resolve(this.workingDirectory, fileOrFolderPath);
        const stats = await deno.stat(absolutePath);

        if (stats.isFile)
        {
            if (!this.isIgnored(absolutePath))
                yield this.normalizeFileURLPath(absolutePath);
        }
        else if (stats.isDirectory)
        {
            if (this.isIgnored(absolutePath, true))
                return;

            for await (const entry of deno.readDir(absolutePath))
                yield* this.streamNormalizedFileNamesRecursive(path.join(absolutePath, entry.name));
        }
    }

    private isIgnored(filePath: string, directory = false)
    {
        const relativePath = path.relative(this.workingDirectory, filePath).replaceAll("\\", "/");

        if (relativePath === "" || relativePath.startsWith("../") || path.isAbsolute(relativePath))
            return false;

        return this.gitIgnore.ignores(directory ? `${relativePath}/` : relativePath);
    }

    private normalizeFileURLPath(filePath: string)
    {
        const normalizedPath = filePath.replaceAll("\\", "/");

        if (/^[A-Za-z]:\//.test(normalizedPath))
            return `/${normalizedPath}`;

        return normalizedPath;
    }

    private async loadGitIgnore()
    {
        try
        {
            this.gitIgnore.add(await deno.readTextFile(path.join(this.workingDirectory, ".gitignore")));
        }
        catch (error: any)
        {
            if (error.name !== "NotFound")
                throw error;
        }
    }
}

export { DenoAppSpecification as AppSpecification, DenoEnvironment as ProcessEnvironment };
