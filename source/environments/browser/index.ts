import { ConsoleReporter } from "../../reporters/consoleReporter.ts";
import { DOMReporter } from "../../reporters/domReporter.ts";
import { TestRunner, SoftwareSpecification } from "../../core/unitium.ts";

export class BrowserAppSpecification extends SoftwareSpecification
{
    async resolveTestModuleURLs()
    {
        const modules = [];

        for (const tag of document.querySelectorAll("script[test]") as NodeListOf<HTMLScriptElement>)
            modules.push(tag.src);

        return modules;
    }
}

async function runTests()
{
    const spec = new BrowserAppSpecification();
    await spec.load();
    const testRunner = new TestRunner(spec, [new ConsoleReporter(spec), new DOMReporter(spec)]);
    testRunner.run();
}

runTests();
