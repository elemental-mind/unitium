#!/usr/bin/env -S deno run --allow-read

import { SoftwareSpecification, TestRunner } from '../../core/unitium.ts';
import type { BaseReporter } from '../../reporters/base.ts';
import { JSONReporter } from '../../reporters/jsonReporter.ts';
import { ConsoleReporter } from '../../reporters/consoleReporter.ts';

type DenoRuntime = {
    args: string[];
    cwd(): string;
    readDir(path: string): AsyncIterable<{
        name: string;
        isFile: boolean;
        isDirectory: boolean;
    }>;
    exit(code?: number): never;
};

const deno = (globalThis as typeof globalThis & { Deno: DenoRuntime }).Deno;

type DenoRunnerOptions = typeof defaultDenoOptions;
const defaultDenoOptions = {
    silent: true,
    outputJSON: false
};

export class DenoAppSpecification extends SoftwareSpecification
{
    static async load(fileSystemReferences: string[] = []): Promise<DenoAppSpecification>
    {
        const spec = new DenoAppSpecification();

        const moduleURLs = await this.getModuleURLs(fileSystemReferences);
        await Promise.all(moduleURLs.map(url => spec.loadModule(url)));

        return spec;
    }

    private static async getModuleURLs(fileSystemReferences: string[])
    {
        let folderReferences: string[] = ["."];
        let fileReferences: string[] = [];

        if (fileSystemReferences.length)
        {
            fileReferences = fileSystemReferences.filter(ref => ref.endsWith(".js") || ref.endsWith(".ts")).map(file => this.normalizeFilePath(file));
            folderReferences = fileSystemReferences.filter(ref => !(ref.endsWith(".js") || ref.endsWith(".ts")));
        }

        const modulesInSubfolders = (await Promise.all(folderReferences.map(folder => this.findTestModulesInFolder(folder)))).flat();

        const uniqueModules = [...new Set([...modulesInSubfolders, ...fileReferences])];
        const moduleFileURLs = uniqueModules.map(module => this.pathToFileURL(module));

        return moduleFileURLs;
    }

    private static normalizeFilePath(reference: string)
    {
        if (this.isAbsolutePath(reference))
            return this.normalizePath(reference);

        return this.normalizePath(this.joinPath(deno.cwd(), reference));
    }

    // Native equivalent of globbing ./**/*.{test,spec}.{js,ts}.
    private static async findTestModulesInFolder(reference: string): Promise<string[]>
    {
        const folderPath = this.normalizeFilePath(reference);

        return await this.findTestModulesInFolderPath(folderPath);
    }

    private static async findTestModulesInFolderPath(folderPath: string): Promise<string[]>
    {
        const modules: string[] = [];

        for await (const entry of deno.readDir(folderPath))
        {
            const entryPath = this.joinPath(folderPath, entry.name);

            if (entry.isDirectory && !this.isDependencyFolder(entry.name))
                modules.push(...await this.findTestModulesInFolderPath(entryPath));
            else if (entry.isFile && this.hasTestModuleEnding(entry.name))
                modules.push(entryPath);
        }

        return modules;
    }

    private static hasTestModuleEnding(fileName: string)
    {
        return /\.(test|spec)\.(js|ts)$/.test(fileName);
    }

    private static isDependencyFolder(folderName: string)
    {
        return folderName === "node_modules";
    }

    private static isAbsolutePath(reference: string)
    {
        return reference.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(reference);
    }

    private static joinPath(...segments: string[])
    {
        return this.normalizePath(segments.join("/").replace(/\/+/g, "/"));
    }

    private static normalizePath(reference: string)
    {
        return reference.replaceAll("\\", "/");
    }

    private static pathToFileURL(path: string)
    {
        const normalizedPath = this.normalizePath(path);
        const prefixedPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;

        return `file://${encodeURI(prefixedPath)}`;
    }
}

async function runTests()
{
    const outputOptions = {
        silent: deno.args.includes("--silent") || false,
        outputJSON: deno.args.includes("--json") || false,
    } as DenoRunnerOptions;

    const cliArgs = deno.args.filter(arg => !arg.startsWith("--"));
    const fileSystemReferences = cliArgs;

    const spec = await DenoAppSpecification.load(fileSystemReferences);
    await new TestRunner(spec, getReporters(outputOptions, spec)).run();

    if (spec.tests.some(test => test.error != undefined))
        deno.exit(1);
}

function getReporters(outputOptions: DenoRunnerOptions, spec: SoftwareSpecification): BaseReporter[]
{
    if (outputOptions.silent)
        return [];
    else if (outputOptions.outputJSON)
        return [new JSONReporter(spec)];
    else
        return [new ConsoleReporter(spec)];
}

runTests();
