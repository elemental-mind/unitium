import { BrowserPageEnvironment } from "../../environments/exProcessEnvironments/browserPage/environment.js";
import { NodeExternalProcessEnvironment } from "../../environments/exProcessEnvironments/node/environment.js";
import { PlaywrightPageEnvironment } from "../../environments/inProcessEnvironments/playwrightPage/environment.js";
import { TestEnvironment } from "../../environments/testEnvironment.js";
import { TestSuite } from "../../models/testSuite.js";
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
    static Browser = SetupManager.generateEnvironmentDecorator("browser");
    static User = SetupManager.generateEnvironmentDecorator("user");
    static Server = SetupManager.generateEnvironmentDecorator("server");
    static Default = FullStackSetup.Server;

    //Hooks
    async loadEnvironments(suite: TestSuite)
    {
        const configuration = suite.testClass.__meta?.setup?.configuration as unknown as FullStackSetupOptions;
        if(!configuration)
            throw new Error("Testsuite uses FullstackSetup but has no configuration defined!");

        const serverEnvironment = await NodeExternalProcessEnvironment.acquire(FullStackSetup.Server, {args: configuration.serverScript, frameworkServerURL: configuration.frameworkServerURL});
        const userEnvironment = await PlaywrightPageEnvironment.acquire(FullStackSetup.User, {browserType: "chromium", frameworkServerURL: configuration.frameworkServerURL});
        const pageEnvironment = await BrowserPageEnvironment.acquire(FullStackSetup.Browser, userEnvironment, configuration.pageURL, configuration.frameworkServerURL);

        const environmentMap = new Map<EnvironmentDecorator, TestEnvironment>([
            [FullStackSetup.Server, serverEnvironment],
            [FullStackSetup.User, userEnvironment],
            [FullStackSetup.Browser, pageEnvironment]
        ]);

        return environmentMap;
    }

    async disposeEnvironments(): Promise<void> {}
}

SetupManager.registerSetup(FullStackSetup);