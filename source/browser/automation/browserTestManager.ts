import { chromium } from "playwright";

class BrowserManager
{
    testsToRun = new Map<string, string>();
    testsRunning = new Map<string, string>();
    testsCompleted = new Map<string, string>();

    private browser = this.createDebuggableBrowser();

    async getNewInBrowserTestingContext()
    {
        const browser = await this.browser;
        const context = await browser.newContext();

        context.addInitScript({path: "./browser/inBrowserTest.js"});
    }

    async getNewRemoteBrowserTestingContext()
    {
        const browser = await this.browser;
        const context = await browser.newContext();
        
        context.addInitScript({path: "./browser/remoteBrowserTest.js"});
    }
    
    async createDebuggableBrowser()
    {
        const browser = await chromium.launch({
            headless: false,
            devtools: true,
            args: ['--remote-debugging-port=9222']
        });

        return browser;
    }

    async shutdown()
    {
        const browser = await this.browser;
        await browser.close();
    }
}

export const browser = new BrowserManager();