import FastGlob from "fast-glob";
import path from "path";
import { TestModule } from "./testModule.js";
import { File } from "./file.js";

export class SoftwareSpecification
{
    public testModules: TestModule[] = [];

    protected constructor(public fileSystemReferences: string[] = []) {}

    get testSuites()
    {
        return this.testModules.flatMap(module => module.testSuites);
    }

    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
    }

    get testEnvironments()
    {
        return new Set(this.tests.map(test => test.executionEnvironment));
    }

    static async fromFileReferences(fileSystemReferences: string[] = [])
    {
        const spec = new SoftwareSpecification(fileSystemReferences);
        await spec.loadAndAnalyze();
        return spec;
    }

    private async loadAndAnalyze()
    {
        const loading = [];
        for (const path of await this.getModuleFiles()) 
            loading.push(this.loadModuleAndAddToModules(path));
        await Promise.all(loading);
    }

    private async loadModuleAndAddToModules(file: File)
    {
        const testModule = await TestModule.fromFile(file);
        this.testModules.push(testModule);
    }

    private async getModuleFiles()
    {
        let folderGlobs: string[] = ["./**/*.{test,spec}.{js,ts}"];
        let fileReferences: string[] = [];

        if (this.fileSystemReferences.length)
        {
            fileReferences = this.fileSystemReferences.filter(ref => ref.endsWith(".js") || ref.endsWith(".ts")).map(file => this.normalizeFilePath(file));
            folderGlobs = this.fileSystemReferences.filter(ref => !(ref.endsWith(".js") || ref.endsWith(".ts"))).map(folder => this.globifyFilePath(folder));
        }

        const modulesInSubfolders = await FastGlob(folderGlobs,
            {
                onlyFiles: true,
                absolute: true,
                ignore: ['**/node_modules/**']
            });

        const uniqueModules = [...new Set([...modulesInSubfolders, ...fileReferences])];
        const moduleFiles = uniqueModules.map(filePath => new File(filePath));

        return moduleFiles;
    }

    protected normalizeFilePath(reference: string)
    {
        return path.resolve(reference).replaceAll("\\", "/");
    }

    protected globifyFilePath(reference: string)
    {
        return reference.replaceAll("\\", "/") + (reference.endsWith("/") ? "" : "/") + "**/*.{test,spec}.{js,ts}";
    } 
}
