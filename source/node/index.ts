#!/usr/bin/env node

import FastGlob from 'fast-glob';
import { SoftwareSpecification, TestModule, TestRunner, TestSuite } from '../unitium.js';

const defaultNodeOptions = {
    silent: true,
    outputJSON: false
};

type NodeRunnerOptions = typeof defaultNodeOptions;

export class NodeTestRunner extends TestRunner
{
    constructor(
        specification: SoftwareSpecification,
        public options?: typeof defaultNodeOptions)
    {
        super(specification);
        this.options = defaultNodeOptions;
        if (options) Object.assign(this.options, options);
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
        var globs;

        if (this.fileSystemReferences.length)
        {
            globs = this.fileSystemReferences.map(fileSystemReference => this.transformAndAddGlobPatternIfFolder(fileSystemReference));
        }
        else
        {
            globs = ["./**/*.{test,spec}.{js,ts}"];
        }

        const modules = await FastGlob(globs,
            {
                onlyFiles: true,
                absolute: true,
                ignore: ['**/node_modules/**']
            });

        const uniqueModules = [...new Set(modules)];
        const moduleFileURLs = uniqueModules.map(module => `file://${module}`);

        return moduleFileURLs;
    }

    private transformAndAddGlobPatternIfFolder(reference: string)
    {
        if (reference.endsWith(".js") || reference.endsWith(".ts"))
        {
            // We are dealing with a file and leave it untouched, only replacing windows slashes with unix slashes for fast-glob
            return reference.replace("\\", "/");
        }
        else
        {
            //We assume we are dealing with a directory and need to add a glob pattern to it
            return reference.replace("\\", "/") + (reference.endsWith("/") ? "" : "/") + "**/*.{test,spec}.{js,ts}";
        }
    }
}

async function runTests()
{
    const cliOptions = {
        silent: process.argv.includes("--silent") || undefined,
        outputJSON: process.argv.includes("--json") || undefined,
    } as NodeRunnerOptions;

    const [executable, script, ...options] = process.argv;

    //We remove all the flags from the options and should be left with files/folder only.
    while (options[0] && options[0].startsWith("--"))
        options.pop();

    const fileSystemReferences = options;

    const spec = new NodeAppSpecification(fileSystemReferences);
    await spec.load();
    const runner = new NodeTestRunner(spec, cliOptions);
    await runner.runTests();

    if (spec.tests.some(test => test.error != undefined))
        process.exitCode = 1;
}

runTests();