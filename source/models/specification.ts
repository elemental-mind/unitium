import { Transportable } from "../distributedTesting.js";
import { TestModule } from "./testModule.js";

export abstract class SpecificationAnalyzer
{
    analyze(fileSystemReferences: string[])
    {

    }
}

export abstract class SoftwareSpecification extends Transportable
{
    public testModules: TestModule[] = [];

    get testSuites()
    {
        return this.testModules.flatMap(module => module.testSuites);
    }

    get tests()
    {
        return this.testSuites.flatMap(suite => suite.tests);
    }

    protected async loadModule(path: string)
    {
        this.testModules.push(new TestModule(path, await import(/*@vite-ignore*/path)));
    }
}

export class SpecificationFragment extends SoftwareSpecification
{
    
}

export class URLSetSpecification extends SoftwareSpecification
{
    static async load(URLs: string[]): Promise<URLSetSpecification>
    {
        const spec = new URLSetSpecification();

        await Promise.all(URLs.map(url => spec.loadModule(url)));

        return spec;
    }
}
