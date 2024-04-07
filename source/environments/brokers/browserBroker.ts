import { Browser, BrowserType, chromium } from "playwright";
import { ExternalEnvironmentOptions } from "../coordination/coordinationServer.js";


export type BrowserOptions =
    ExternalEnvironmentOptions &     
    {
        browserType: "chromium";
        debugPort?: number;
        headless?: boolean;
    };

export class BrowserBroker
{
    static browsers = new Map<string, Browser>();

    private static async getBrowserInstance(options: BrowserOptions)
    {
        const optionString = JSON.stringify(options);

        if (this.browsers.has(optionString))
            return this.browsers.get(optionString)!;

        let browserType: BrowserType<{}>;
        switch (options.browserType)
        {
            case "chromium":
                browserType = chromium;
                break;
            // case "firefox":
            //     browserType = firefox;
            //     break;
            // case "webkit":
            //     browserType = webkit;
            //     break;
            default:
                browserType = chromium;
        };

        const browser = await browserType.launch({
            headless: options.headless ?? true,
            devtools: true,
            args: options.debugPort ? [`--remote-debugging-port=${options.debugPort}`] : []
        });

        this.browsers.set(optionString, browser);

        return browser;
    }

    static async getBrowserForConfig(options: BrowserOptions)
    {
        const browserKey = JSON.stringify(options);
        if (!this.browsers.has(browserKey))
            await this.getBrowserInstance(options);
        return this.browsers.get(browserKey)!;
    }
}