import { TestEnvironment } from "../../environments/testEnvironment.js";
import type { TestSuite } from "../../models/testSuite.js";
import { EnvironmentDecorator, SetupManager, TestSetup } from "../testSetup.js";

const defaultEnvironmentMap = new Map<EnvironmentDecorator, TestEnvironment>();

export class DefaultSetup extends TestSetup
{
    //Class Decorators
    static Config = SetupManager.generateConfigDecorator<[]>();

    //Method Decorators
    static Default = SetupManager.generateEnvironmentDecorator("default");

    async loadEnvironments(suite: TestSuite)
    {
        if (!defaultEnvironmentMap.has(DefaultSetup.Default))
        {
            const { NodeInProcessEnvironment } = await import("../../environments/inProcessEnvironments/node/environment.js");
            defaultEnvironmentMap.set(DefaultSetup.Default, await NodeInProcessEnvironment.acquire());
        }
        return defaultEnvironmentMap;
    }

    async disposeEnvironments() { }
}

SetupManager.registerSetup(DefaultSetup);