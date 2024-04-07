import { Page } from "playwright";
import { BrowserBroker, BrowserOptions } from "../../brokers/browserBroker.js";
import { InProcessTestEnvironment } from "../inProcessTestEnvironment.js";
import { TestSuite } from "../../../models/testSuite.js";

export class PlaywrightPageEnvironment extends InProcessTestEnvironment
{
    static async acquire(options: BrowserOptions)
    {
        const browser = await BrowserBroker.getBrowserForConfig(options);
        const context = await browser.newContext();
        const page = await context.newPage();

        return new PlaywrightPageEnvironment(page);
    }

    private constructor(
        public page: Page
    )
    {
        super();
    }

    async instantiateSuite(suite: TestSuite): Promise<any>
    {
        const filePath = await suite.testModule.createEnvironmentModuleAndReturnPath(PlaywrightPageEnvironment);
        const module = await import(filePath);

        const instance = new module[suite.className]();
        return instance;
    }

    async release()
    {}
}

