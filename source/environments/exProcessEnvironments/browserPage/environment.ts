import { ExProcessTestEnvironment } from "../exProcessTestEnvironment.js";
import type { TestSuite } from "../../../models/testSuite.js";
import type { PlaywrightPageEnvironment } from "../../inProcessEnvironments/playwrightPage/environment.js";

export class BrowserPageEnvironment extends ExProcessTestEnvironment
{
    static async acquire(playwrightEnvironment: PlaywrightPageEnvironment, url: string, frameworkServerURL: string)
    {
        const environment = new BrowserPageEnvironment(playwrightEnvironment, frameworkServerURL);
        await environment.playwrightEnvironment.page.goto(url);
        return environment;
    }

    constructor(
        public playwrightEnvironment: PlaywrightPageEnvironment,
        public frameworkServerURL: string
    ){
        super();
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