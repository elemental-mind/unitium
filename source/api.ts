import { SoftwareSpecification, TestModule } from "./unitium.js";

export { BrowserAppSpecification, BrowserTestRunner } from "./browser/index.js"
export { NodeAppSpecification, NodeTestRunner } from "./node/index.js"

export class URLSetSpecification extends SoftwareSpecification
{
    constructor(public URLs: string[]){ super(); }
    async load(): Promise<TestModule[]>
    {
        for (const testResource of this.URLs) 
            this.testModules.push(new TestModule(testResource, await import(testResource)))

        return this.testModules;
    }
}