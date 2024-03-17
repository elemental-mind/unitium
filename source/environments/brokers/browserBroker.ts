import { Browser, BrowserContext, BrowserType, chromium} from "playwright";

type BrowserOptions =
    {
        browserType: "chromium";
        debugPort?: number;
        headless?: boolean;
    };

export class BrowserBroker
{
    static browsers = new Map<string, BrowserInstance>();

    private static async getBrowserInstance(options: BrowserOptions)
    {
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

        this.browsers.set(JSON.stringify(options), new BrowserInstance(browser));

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

export class BrowserInstance
{
    contexts = new Map<string, BrowserContext>();
    constructor(
        public browser: Browser
    ) { }

    async getTestEnvironment()
    {
        const context = await this.browser.newContext();
        context.addInitScript({
            content: `
                console.log("I am an init script");
            `
        })
        return context;
    }
}