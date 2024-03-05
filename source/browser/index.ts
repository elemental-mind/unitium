import { Test, TestRunner, TestSuite, SoftwareSpecification, TestModule } from "../unitium.js";

export class BrowserTestRunner extends TestRunner
{
    async runTests()
    {
        if(document.getElementById("unitium-output"))
            new BrowserTestRenderer(this.specification).processUIUpdates();
    
        await this.runAllTests();
    }
}

export class BrowserAppSpecification extends SoftwareSpecification
{
    async load()
    {
        const moduleURLs = await this.getModuleURLs();
        const moduleLoadPromises = [];

        for (const modulePath of moduleURLs) 
            moduleLoadPromises.push(this.loadModule(modulePath))

        await Promise.all(moduleLoadPromises);

        return this.testModules;
    }

    protected async getModuleURLs()
    {
        const modules = [];
        for(const tag of document.querySelectorAll("script[test]") as NodeListOf<HTMLScriptElement>)
            modules.push(tag.src);

        return modules;    
    }
}

class BrowserTestRenderer
{
    constructor(private specification: SoftwareSpecification) { }

    async processUIUpdates()
    {
        for (const module of this.specification.testModules) 
            this.processModuleUpdates(module);
    }

    async processModuleUpdates(module: TestModule)
    {
        const moduleOutput = document.createElement("article")
        moduleOutput.className = "unitium-module"
        moduleOutput.innerHTML = `<code>${module.path}</code>`;

        document.getElementById("unitium-output")?.appendChild(moduleOutput);

        for(const suite of module.testSuites)
            this.processSuiteUpdates(suite, moduleOutput)

        this.updateModuleOnCompletion(module, moduleOutput);
    }

    async updateModuleOnCompletion(module: TestModule, moduleContainer: HTMLElement) {}

    async processSuiteUpdates(suite: TestSuite, moduleContainer: HTMLElement)
    {
        const suiteOutput = document.createElement("div");
        suiteOutput.className = "unitium-test-suite";
        suiteOutput.innerHTML = `<h1>${suite.name}</h1>`;
        moduleContainer.appendChild(suiteOutput);

        const testOutput = document.createElement("table");
        suiteOutput.appendChild(testOutput);

        for(const test of suite.tests)
            this.processTestUpdates(test, testOutput);

        this.updateSuiteOnCompletion(suite, suiteOutput);
    }

    async updateSuiteOnCompletion(suite: TestSuite, suiteContainer: HTMLElement) {}

    async processTestUpdates(test: Test, outputContainer: HTMLTableElement)
    {
        const outputElement = document.createElement("tr");
        outputElement.className = "unitium-test-result";

        const functionNameElement = document.createElement("td");
        functionNameElement.innerText = test.name + ": ";
        outputElement.appendChild(functionNameElement);

        const detailsElement = document.createElement("td");
        detailsElement.innerText = "Initializing";
        outputElement.appendChild(detailsElement);
        
        const statusElement = document.createElement("td");
        statusElement.innerText = "⌛";
        outputElement.appendChild(statusElement);

        outputContainer.appendChild(outputElement);

        this.updateTestOnRunStart(test, detailsElement, statusElement);
        this.updateTestOnCompletion(test, detailsElement, statusElement);
    }

    async updateTestOnRunStart(test: Test, detailsElement: HTMLElement, statusElement: HTMLElement)
    {
        await test.runStarted;

        statusElement.innerText = "🔄";
        detailsElement.innerText = "Running";
    }

    async updateTestOnCompletion(test: Test, detailsElement: HTMLElement, statusElement: HTMLElement)
    {
        await test.runCompleted;

        statusElement.innerText = test.error?"❌":"✔️";
        detailsElement.innerHTML = test.error?
        `<details>
        <summary>Failed</summary>
        <table class="unitium-diff-table">
        <thead>
            <td>Expected</td><td>Actual</td>            
        </thead>
        <tbody>
            <tr><td>${test.error.expected}</td><td>${test.error.actual}</td>
        </tbody>
        </table>
        </details>`
        :"Passed"
    }
}

async function runTests()
{
    const spec = new BrowserAppSpecification();
    await spec.load();
    const testRunner = new BrowserTestRunner(spec);
    testRunner.runTests();
}

runTests();