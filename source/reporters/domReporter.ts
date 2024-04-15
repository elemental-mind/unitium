import type { TestFunction } from "../models/testFunction.js";
import type { TestModule } from "../models/testModule.js";
import type { TestSuite } from "../models/testSuite.js";
import { EventBasedReporter } from "./base.js";


export class DOMReporter extends EventBasedReporter
{
    private moduleContainers: Map<TestModule, HTMLElement> = new Map();
    private suiteContainers: Map<TestSuite, HTMLElement> = new Map();
    private testContainers: Map<TestFunction, HTMLTableRowElement> = new Map();
    private testDetailsElements: Map<TestFunction, HTMLElement> = new Map();
    private testStatusElements: Map<TestFunction, HTMLElement> = new Map();

    onTestRunStart(): void
    {
        super.onTestRunStart();

        if (document.getElementById("unitium-output"))
            for (const testModule of this.specification.testModules)
                this.renderModule(testModule);
    }

    private renderModule(testModule: TestModule): void
    {
        const moduleOutput = document.createElement("article");
        moduleOutput.className = "unitium-module";
        moduleOutput.innerHTML = `<code>${testModule.file}</code>`;
        document.getElementById("unitium-output")?.appendChild(moduleOutput);
        this.moduleContainers.set(testModule, moduleOutput);

        for (const suite of testModule.testSuites)
            this.renderSuite(suite, moduleOutput);

    }

    private renderSuite(suite: TestSuite, moduleOutput: HTMLElement): void
    {
        const suiteOutput = document.createElement("div");
        suiteOutput.className = "unitium-test-suite";
        suiteOutput.innerHTML = `<h1>${suite.name}</h1>`;
        moduleOutput.appendChild(suiteOutput);
        this.suiteContainers.set(suite, suiteOutput);

        const testOutput = document.createElement("table");
        suiteOutput.appendChild(testOutput);

        for (const test of suite.tests)
            this.renderTest(test, testOutput);
    }

    private renderTest(test: TestFunction, testOutput: HTMLElement): void
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

        testOutput.appendChild(outputElement);

        this.testContainers.set(test, outputElement);
        this.testDetailsElements.set(test, detailsElement);
        this.testStatusElements.set(test, statusElement);
    }

    onTestStart(test: TestFunction)
    {
        const detailsElement = this.testDetailsElements.get(test);
        const statusElement = this.testStatusElements.get(test);

        if (detailsElement && statusElement)
        {
            statusElement.innerText = "🔄";
            detailsElement.innerText = "Running";
        }
    }

    onTestEnd(test: TestFunction)
    {
        const detailsElement = this.testDetailsElements.get(test);
        const statusElement = this.testStatusElements.get(test);

        if (detailsElement && statusElement)
        {
            statusElement.innerText = test.error ? "❌" : "✔️";
            detailsElement.innerHTML = test.error ?
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
                : "Passed";
        }
    }
}
