import type { Page } from "playwright";
import { BrowserBroker, BrowserOptions } from "../../brokers/browserBroker.js";
import { InProcessTestEnvironment } from "../inProcessTestEnvironment.js";
import type { TestSuite } from "../../../models/testSuite.js";
import type { EnvironmentDecorator } from "../../../setups/testSetup.js";

export class PlaywrightPageEnvironment extends InProcessTestEnvironment
{
    static async acquire(domain: EnvironmentDecorator, options: BrowserOptions)
    {
        const browser = await BrowserBroker.getBrowserForConfig(options);
        const context = await browser.newContext();
        const page = await context.newPage();

        return new PlaywrightPageEnvironment(domain, page);
    }

    private constructor(
        domain: EnvironmentDecorator,
        public page: Page
    )
    {
        super(domain);
    }

    async instantiateSuite(suite: TestSuite): Promise<any>
    {
        const moduleFile = await suite.testModule.createEnvironmentModuleFile(this.domain);
        const module = await moduleFile.import();

        const instance = new module[suite.className]();
        return instance;
    }

    async release()
    {}
}
