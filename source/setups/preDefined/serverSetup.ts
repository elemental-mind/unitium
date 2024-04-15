import { TestEnvironment } from "../../environments/testEnvironment.js";
import type { TestSuite } from "../../models/testSuite.js";
import { TestSetup, SetupManager, EnvironmentDecorator } from "../testSetup.js";

export class ServerSetup extends TestSetup
{
    //Class-Decorators
    static Config = SetupManager.generateConfigDecorator();
    
    //Method-Decorators
    static Server = SetupManager.generateEnvironmentDecorator("server");
    static Default = this.Server;
    
    //Hooks
    loadEnvironments(suite: TestSuite): Promise<Map<EnvironmentDecorator, TestEnvironment>>
    {
        throw new Error("Method not implemented.");
    }

    async disposeEnvironments() {}
}

SetupManager.registerSetup(ServerSetup);