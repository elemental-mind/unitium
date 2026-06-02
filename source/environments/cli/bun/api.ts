import * as fs from "fs/promises";
import ignore from "ignore";
import path from "path";
import type { CliRuntimeAdapter } from "../api.ts";
import { FileBasedAppSpecification } from "../api.ts";

const BunEnvironment: CliRuntimeAdapter = {
    process: {
        cliArgs: process.argv.slice(2),
        workingDirectory: process.cwd(),
        terminateWithError: code => process.exit(code)
    }
};

class BunAppSpecification extends FileBasedAppSpecification
{
    private gitIgnore = ignore();
    private workingDirectory: string;

    constructor(workingDirectory = BunEnvironment.process.workingDirectory)
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
        const stats = await fs.stat(absolutePath);

        if (stats.isFile())
        {
            if (!this.isIgnored(absolutePath))
                yield this.normalizeFileURLPath(absolutePath);
        }
        else if (stats.isDirectory())
        {
            if (this.isIgnored(absolutePath, true))
                return;

            for (const entry of await fs.readdir(absolutePath, { withFileTypes: true }))
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
            this.gitIgnore.add(await fs.readFile(path.join(this.workingDirectory, ".gitignore"), "utf8"));
        }
        catch (error: any)
        {
            if (error.code !== "ENOENT")
                throw error;
        }
    }
}

export { BunAppSpecification as AppSpecification, BunEnvironment as ProcessEnvironment };
