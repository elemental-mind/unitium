import { SoftwareSpecification } from "../../core/unitium.ts";

export type CliRuntimeAdapter = {
    process: {
        cliArgs: string[];
        workingDirectory: string;
        terminateWithError(code: number): void;
    };
};

export abstract class FileBasedAppSpecification extends SoftwareSpecification
{
    /**
     * Streams normalized file names, meaning absolute file paths using Unix separators.
     */
    abstract streamNormalizedFileNamesRecursive(fileOrFolderPath: string): AsyncIterable<string>;

    async resolveTestModuleURLs(fileSystemReferences: string[])
    {
        let fileReferences: Set<string> = new Set();

        for (const reference of fileSystemReferences)
            for await (const absoluteFileName of this.streamNormalizedFileNamesRecursive(reference))
                if (this.isTestModule(absoluteFileName))
                    fileReferences.add(`file://${encodeURI(absoluteFileName)}`);

        return [...fileReferences];
    }

    protected isTestModule(fileName: string)
    {
        return /\.(test|spec)\.(js|ts)$/.test(fileName);
    }
}
