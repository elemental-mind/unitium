#!/usr/bin/env node

import type { BaseReporter } from '../../reporters/base.js';
import { JSONReporter } from '../../reporters/jsonReporter.js';
import { ConsoleReporter } from '../../reporters/consoleReporter.js';
import { SoftwareSpecification } from '../../models/specification.js';
import { TestRunner } from '../../models/testRunner.js';
import { frameworkServer } from '../../orchestration/frameworkServer.js';

type NodeRunnerOptions = typeof defaultNodeOptions;

const defaultNodeOptions = {
    silent: true,
    outputJSON: false
};

async function runTests()
{
    frameworkServer.start();

    const outputOptions = {
        silent: process.argv.includes("--silent") || false,
        outputJSON: process.argv.includes("--json") || false,
    } as NodeRunnerOptions;

    const [executable, script, ...cliArgs] = process.argv;

    //We remove all the flags from the options and should be left with files/folder only.
    while (cliArgs[0] && cliArgs[0].startsWith("--"))
        cliArgs.pop();

    const fileSystemReferences = cliArgs;

    const spec = await SoftwareSpecification.fromFileReferences(fileSystemReferences);
    await new TestRunner(spec, getReporters(outputOptions, spec)).run();

    frameworkServer.stop();

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