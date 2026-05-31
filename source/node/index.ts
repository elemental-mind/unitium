#!/usr/bin/env node

import { SoftwareSpecification, TestRunner } from '../unitium.ts';
import type { Dirent } from "fs";
import * as fs from "fs/promises";
import path from "path";
import type { BaseReporter } from '../reporters/base.ts';
import { JSONReporter } from '../reporters/jsonReporter.ts';
import { ConsoleReporter } from '../reporters/consoleReporter.ts';

type NodeRunnerOptions = typeof defaultNodeOptions;
const defaultNodeOptions = {
    silent: true,
    outputJSON: false
};

export class NodeAppSpecification extends SoftwareSpecification
{
    static async load(fileSystemReferences: string[] = []): Promise<NodeAppSpecification>
    {
        const spec = new NodeAppSpecification();

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
        const moduleFileURLs = uniqueModules.map(module => `file://${module}`);

        return moduleFileURLs;
    }

    private static normalizeFilePath(reference: string)
    {
        return path.resolve(reference).replaceAll("\\", "/");
    }

    // Native equivalent of globbing ./**/*.{test,spec}.{js,ts}.
    private static async findTestModulesInFolder(reference: string): Promise<string[]>
    {
        const folderPath = path.resolve(reference);

        const entries = await fs.readdir(folderPath, { withFileTypes: true, recursive: true });

        return entries
            .filter(entry => entry.isFile() && !this.isInNodeModules(entry) && this.hasTestModuleEnding(entry.name))
            .map(entry => this.normalizeFilePath(path.join(entry.parentPath, entry.name)));
    }

    private static hasTestModuleEnding(fileName: string)
    {
        return /\.(test|spec)\.(js|ts)$/.test(fileName);
    }

    private static isInNodeModules(entry: Dirent)
    {
        return entry.parentPath.split(path.sep).includes("node_modules");
    }
}

async function runTests()
{
    const outputOptions = {
        silent: process.argv.includes("--silent") || false,
        outputJSON: process.argv.includes("--json") || false,
    } as NodeRunnerOptions;

    const [executable, script, ...cliArgs] = process.argv;

    //We remove all the flags from the options and should be left with files/folder only.
    while (cliArgs[0] && cliArgs[0].startsWith("--"))
        cliArgs.pop();

    const fileSystemReferences = cliArgs;

    const spec = await NodeAppSpecification.load(fileSystemReferences);
    await new TestRunner(spec, getReporters(outputOptions, spec)).run();

    if (spec.tests.some(test => test.error != undefined))
        process.exitCode = 1;
}

function getReporters(outputOptions: NodeRunnerOptions, spec: SoftwareSpecification): BaseReporter[]
{
    if (outputOptions.silent)
        return [];
    else if (outputOptions.outputJSON)
        return [new JSONReporter(spec)];
    else
        return [new ConsoleReporter(spec)];
}

runTests();
