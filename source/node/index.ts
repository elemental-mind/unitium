#!/usr/bin/env node

import FastGlob from 'fast-glob';
import { SoftwareSpecification, TestModule, TestRunner, TestSuite } from '../unitium.js';
import path from "path";

const defaultNodeOptions = {
    silent: true,
    outputJSON: false
};

type NodeRunnerOptions = typeof defaultNodeOptions;

export class NodeTestRunner extends TestRunner
{
    public options = Object.assign({}, defaultNodeOptions);
    constructor(
        specification: SoftwareSpecification,
        options?: typeof defaultNodeOptions)
    {
        super(specification);

        if (options?.silent !== undefined)
            this.options.silent = options.silent;
        if (options?.outputJSON !== undefined)
            this.options.outputJSON = options.outputJSON;
    }

    async runTests()
    {
        await super.runAllTests();

        if (!this.options?.silent)
        {
            if (this.options?.outputJSON)
                console.log(this.specification.serialize);
            else
                this.specification.printResults();
        }
    }
}

export class NodeAppSpecification extends SoftwareSpecification
{
    constructor(
        public fileSystemReferences: string[] = []
    )
    {
        super();
    }

    async load(): Promise<TestModule[]>
    {
        const moduleURLs = await this.getModuleURLs();
        const moduleLoadPromises = [];

        for (const modulePath of moduleURLs)
            moduleLoadPromises.push(this.loadModule(modulePath));

        await Promise.all(moduleLoadPromises);

        return this.testModules;
    }

    protected async getModuleURLs()
    {
        let folderGlobs: string[] = ["./**/*.{test,spec}.{js,ts}"];
        let fileReferences: string[] = [];

        if (this.fileSystemReferences.length)
        {
            fileReferences = this.fileSystemReferences.filter(ref => ref.endsWith(".js") || ref.endsWith(".ts")).map(file => this.normalizeFilePath(file));
            folderGlobs = this.fileSystemReferences.filter(ref => !(ref.endsWith(".js") || ref.endsWith(".ts"))).map(folder => this.globifyFilePath(folder));
        }

        const folderModules = await FastGlob(folderGlobs,
            {
                onlyFiles: true,
                absolute: true,
                ignore: ['**/node_modules/**']
            });

        const uniqueModules = [...new Set([...folderModules, ...fileReferences])];
        const moduleFileURLs = uniqueModules.map(module => `file://${module}`);

        return moduleFileURLs;
    }

    private normalizeFilePath(reference: string)
    {
        return path.resolve(reference).replaceAll("\\", "/");
    }

    private globifyFilePath(reference: string)
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

    const [executable, script, ...options] = process.argv;

    //We remove all the flags from the options and should be left with files/folder only.
    while (options[0] && options[0].startsWith("--"))
        options.pop();

    const fileSystemReferences = options;

    const spec = new NodeAppSpecification(fileSystemReferences);
    await spec.load();
    const runner = new NodeTestRunner(spec, outputOptions);
    await runner.runTests();

    if (spec.tests.some(test => test.error != undefined))
        process.exitCode = 1;
}

runTests();