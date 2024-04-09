import { TestEnvironment } from "../../environments/testEnvironment.js";
import { TestSetup, SetupManager, EnvironmentDecorator } from "../testSetup.js";
import { FullStackSetupOptions } from "./fullStackSetup.js";

export class ServerSetup extends TestSetup
{
    //Class-Decorators
    static Config = SetupManager.generateConfigDecorator();

    //Method-Decorators
    static Browser = SetupManager.generateMethodDecorator();
    static User = SetupManager.generateMethodDecorator();
    static Server = SetupManager.generateMethodDecorator();

    public environmentMap?: Map<EnvironmentDecorator | null, TestEnvironment>;

    //Hooks
    async loadEnvironments(clss: any)
    {
        const configuration = SetupManager.getConfigurationFor<FullStackSetupOptions>(clss);

        return this.environmentMap!;
    }

    async disposeEnvironments() {}
}

SetupManager.registerSetup(ServerSetup);