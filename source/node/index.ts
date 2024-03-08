#!/usr/bin/env node

import FastGlob from 'fast-glob';
import { SoftwareSpecification, TestRunner } from '../unitium.js';
import path from "path";
import { BaseReporter } from '../reporters/base.js';
import { JSONReporter } from '../reporters/jsonReporter.js';
import { ConsoleReporter } from '../reporters/consoleReporter.js';

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
        let folderGlobs: string[] = ["./**/*.{test,spec}.{js,ts}"];
        let fileReferences: string[] = [];

        if (fileSystemReferences.length)
        {
            fileReferences = fileSystemReferences.filter(ref => ref.endsWith(".js") || ref.endsWith(".ts")).map(file => this.normalizeFilePath(file));
            folderGlobs = fileSystemReferences.filter(ref => !(ref.endsWith(".js") || ref.endsWith(".ts"))).map(folder => this.globifyFilePath(folder));
        }

        const modulesInSubfolders = await FastGlob(folderGlobs,
            {
                onlyFiles: true,
                absolute: true,
                ignore: ['**/node_modules/**']
            });

        const uniqueModules = [...new Set([...modulesInSubfolders, ...fileReferences])];
        const moduleFileURLs = uniqueModules.map(module => `file://${module}`);

        return moduleFileURLs;
    }

    private static normalizeFilePath(reference: string)
    {
        return path.resolve(reference).replaceAll("\\", "/");
    }

    private static globifyFilePath(reference: string)
    {
        return reference.replaceAll("\\", "/") + (reference.endsWith("/") ? "" : "/") + "**/*.{test,spec}.{js,ts}";
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