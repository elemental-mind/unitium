import { ExProcessTestEnvironment } from "../exProcessTestEnvironment.js";
import type { TestSuite } from "../../../models/testSuite.js";
import type { PlaywrightPageEnvironment } from "../../inProcessEnvironments/playwrightPage/environment.js";
import type { EnvironmentDecorator } from "../../../setups/testSetup.js";

export class BrowserPageEnvironment extends ExProcessTestEnvironment
{
    static async acquire(domain: EnvironmentDecorator, playwrightEnvironment: PlaywrightPageEnvironment, url: string, frameworkServerURL: string)
    {
        const environment = new BrowserPageEnvironment(domain, playwrightEnvironment, frameworkServerURL);
        await environment.playwrightEnvironment.page.goto(url);
        return environment;
    }

    constructor(
        domain: EnvironmentDecorator,
        public playwrightEnvironment: PlaywrightPageEnvironment,
        public frameworkServerURL: string
    ){
        super(domain);
        this.initializeEnvironment();
    }

    async initializeEnvironment()
    {
        await this.playwrightEnvironment.page.addInitScript({content: `
            globalThis.environmentId = ${this.id};

            import("${this.frameworkServerURL + "/distributedTesting.js"}");
        `});

        super.initializeEnvironment();
    }

    async instantiateSuite(suite: TestSuite): Promise<any>
    {
        throw new Error("Method not implemented.");
    }
    
    release(): void
    {
        throw new Error("Method not implemented.");
    }
}