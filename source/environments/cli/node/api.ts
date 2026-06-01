import * as fs from "fs/promises";
import path from "path";
import type { CliRuntimeAdapter } from "../api.ts";
import { FileBasedAppSpecification } from "../api.ts";

const NodeEnvironment: CliRuntimeAdapter = {
    process: {
        cliArgs: process.argv.slice(2),
        workingDirectory: process.cwd(),
        terminateWithError: code => process.exit(code)
    }
};

class NodeAppSpecification extends FileBasedAppSpecification
{
    async* streamNormalizedFileNamesRecursive(fileOrFolderPath: string): AsyncIterable<string>
    {
        const absolutePath = path.resolve(fileOrFolderPath);
        const stats = await fs.stat(absolutePath);

        if (stats.isFile())
            yield this.normalizeFileURLPath(absolutePath);
        else if (stats.isDirectory())
            for (const entry of await fs.readdir(absolutePath, { withFileTypes: true }))
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

export { NodeAppSpecification as AppSpecification, NodeEnvironment as ProcessEnvironment };
