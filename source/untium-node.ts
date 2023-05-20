#!/usr/bin/env node

import FastGlob from 'fast-glob';
import URL from 'url';

import { TestRunner, TestSuite } from './unitium.js';

export class NodeTestRunner extends TestRunner<TestSuite>
{
    async runTests()
    {
        super.runTests();

        console.log();

        if (this.testSuites.find((suite) => suite.failedTests.length > 0))
            process.exitCode = 1;
    }

    protected async getModuleNames()
    {
        const [executable, script, ...fileSystemReferences] = process.argv;

        var globs;

        if (fileSystemReferences.length)
        {
            globs = fileSystemReferences.map(fileSystemReference => this.transformAndAddGlobPatternIfFolder(fileSystemReference));
        }
        else
        {
            globs = ["./**/*.{test,spec}.{js,ts}"];
        }

        const modules =  await FastGlob(globs,
            {
                onlyFiles: true,
                absolute: true,
                ignore: ['**/node_modules/**']
            });

        const uniqueModules = [...new Set(modules)];
        
        return uniqueModules;
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

    protected async loadModuleAndRunTestSuites(file: string)
    {
        const module = await import(URL.pathToFileURL(file).href);

        const testSuiteRuns = [];

        for (const key in module)
        {
            const testSuite = new TestSuite(module[key]);
            this.testSuites.push(testSuite);
            const testSuiteRun = testSuite.run();
            testSuiteRuns.push(testSuiteRun);
        }

        return testSuiteRuns;
    }
}

const testRunner = new NodeTestRunner();
testRunner.runTests();