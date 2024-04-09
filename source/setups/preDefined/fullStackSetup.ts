
import { BrowserPageEnvironment } from "../../environments/exProcessEnvironments/browserPage/environment.js";
import { NodeExternalProcessEnvironment } from "../../environments/exProcessEnvironments/node/environment.js";
import { PlaywrightPageEnvironment } from "../../environments/inProcessEnvironments/playwrightPage/environment.js";
import { TestEnvironment } from "../../environments/testEnvironment.js";
import { EnvironmentDecorator, SetupManager, TestSetup } from "../testSetup.js";

export interface FullStackSetupOptions
{
    serverScript: string;
    serverOptions: {};
    frameworkServerURL: string;
    pageURL: string;
    browserOptions: {};
}

export class FullStackSetup extends TestSetup
{
    //Class-Decorators
    static Config = SetupManager.generateConfigDecorator();

    //Method-Decorators
    static Browser = SetupManager.generateMethodDecorator();
    static User = SetupManager.generateMethodDecorator();
    static Server = SetupManager.generateMethodDecorator();
    static Default = FullStackSetup.Server;

    public environmentMap?: Map<EnvironmentDecorator | null, TestEnvironment>;

    //Hooks
    async loadEnvironments(clss: any)
    {
        const configuration = SetupManager.getConfigurationFor<FullStackSetupOptions>(clss);

        const serverEnvironment = await NodeExternalProcessEnvironment.acquire({args: configuration.serverScript, frameworkServerURL: configuration.frameworkServerURL});
        const userEnvironment = await PlaywrightPageEnvironment.acquire({browserType: "chromium", frameworkServerURL: configuration.frameworkServerURL});
        const pageEnvironment = await BrowserPageEnvironment.acquire(userEnvironment, configuration.pageURL, configuration.frameworkServerURL);

        this.environmentMap = new Map<EnvironmentDecorator|null, TestEnvironment>([
            [FullStackSetup.Server, serverEnvironment],
            [FullStackSetup.User, userEnvironment],
            [FullStackSetup.Browser, pageEnvironment]
        ]);

        return this.environmentMap!;
    }

    async disposeEnvironments(): Promise<void> {}
}

SetupManager.registerSetup(FullStackSetup);