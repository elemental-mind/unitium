import { Test, TestRunner, TestSuite, camelToNormal, titleCase, capitalCase } from "../unitium.js";

export class BrowserTestRunner extends TestRunner<BrowserTestSuite>
{
    protected async getModuleNames()
    {
        const modules = [];
        for(const tag of document.querySelectorAll("script[test]") as NodeListOf<HTMLScriptElement>)
            modules.push(tag.src);

        return modules;    
    }

    protected async loadModuleAndRunTestSuites(url: string)
    {
        const module = await import(/*@vite-ignore*/url);

        const moduleOutput = document.createElement("article")
        moduleOutput.className = "unitium-module"
        moduleOutput.innerHTML = `<code>${url}</code>`;

        document.getElementById("unitium-output")?.appendChild(moduleOutput);

        const testSuiteRuns = [];

        for (const key in module)
        {
            const testSuite = new BrowserTestSuite(module[key], moduleOutput);
            this.testSuites.push(testSuite);
            const testSuiteRun = testSuite.run();
            testSuiteRuns.push(testSuiteRun);
        }

        return testSuiteRuns;
    }
}

class BrowserTestSuite extends TestSuite
{
    private frameElement: HTMLDivElement;
    private outputElement: HTMLTableElement;

    constructor(testClassConstructor: { new(): any }, private parentOutputElement: HTMLElement)
    {
        super(testClassConstructor);

        this.frameElement = document.createElement("div");
        this.frameElement.className = "unitium-test-suite";
        this.frameElement.innerHTML = `<h1>${capitalCase(camelToNormal(this.name))}</h1>`;
        this.outputElement = document.createElement("table");
        this.frameElement.appendChild(this.outputElement);
        this.parentOutputElement.appendChild(this.frameElement);
    }

    protected convertFunctionToTest(functionName: string): Test {
        return new BrowserTest(functionName, this.outputElement);
    }
}

class BrowserTest extends Test
{
    private outputElement: HTMLTableRowElement;
    private functionNameElement: HTMLTableCellElement;
    private detailsElement: HTMLTableCellElement;
    private statusElement: HTMLTableCellElement;
    constructor(testFunctionName: string, private parentOutputElement: HTMLElement)
    {
        super(testFunctionName);
        this.outputElement = document.createElement("tr");
        this.outputElement.className = "unitium-test-result";
        this.functionNameElement = document.createElement("td");
        this.functionNameElement.innerText = titleCase(camelToNormal(testFunctionName)) + ": ";
        this.detailsElement = document.createElement("td");
        this.detailsElement.innerText = "Initializing";
        this.statusElement = document.createElement("td");
        this.statusElement.innerText = "⌛";
        this.outputElement.appendChild(this.functionNameElement);
        this.outputElement.appendChild(this.detailsElement)
        this.outputElement.appendChild(this.statusElement);
        parentOutputElement.appendChild(this.outputElement);
    }

    async run(testSuiteObject: any): Promise<void> {
        this.detailsElement.innerText = "Running";
        this.statusElement.innerText = "🔄";
        await super.run(testSuiteObject);
        
        this.detailsElement.innerHTML = this.error?
        `<details>
        <summary>Failed</summary>
        <table class="unitium-diff-table">
        <thead>
            <td>Expected</td><td>Actual</td>            
        </thead>
        <tbody>
            <tr><td>${this.error.expects}</td><td>${this.error.actual}</td>
        </tbody>
        </table>
    </details>`:"Passed"
        this.statusElement.innerText = this.error?"❌":"✔️";
    }
}

const testRunner = new BrowserTestRunner();
testRunner.runTests();