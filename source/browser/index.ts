import { ConsoleReporter } from "../reporters/consoleReporter.js";
import { DOMReporter } from "../reporters/domReporter.js";
import { TestRunner, SoftwareSpecification, Test } from "../unitium.js";

export class BrowserAppSpecification extends SoftwareSpecification
{
    static async load(fileSystemReferences: string[] = []): Promise<BrowserAppSpecification>
    {
        const spec = new BrowserAppSpecification();

        const moduleURLs = await this.getModuleURLs();
        await Promise.all(moduleURLs.map(url => spec.loadModule(url)));

        return spec;
    }

    private static async getModuleURLs()
    {
        const modules = [];
        for(const tag of document.querySelectorAll("script[test]") as NodeListOf<HTMLScriptElement>)
            modules.push(tag.src);

        return modules;    
    }
}

async function runTests()
{
    const spec = await BrowserAppSpecification.load();
    const testRunner = new TestRunner(spec, [new ConsoleReporter(spec), new DOMReporter(spec)]);
    testRunner.run();
}

runTests();