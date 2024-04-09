import { NodeInProcessEnvironment } from "../../environments/inProcessEnvironments/node/environment.js";
import { TestEnvironment } from "../../environments/testEnvironment.js";
import { ITestSuiteConstructor } from "../../interfaces.js";
import { EnvironmentDecorator, SetupManager, TestSetup } from "../testSetup.js";

const defaultEnvironmentMap = new Map<EnvironmentDecorator, TestEnvironment>();

export class DefaultSetup extends TestSetup
{
    //Class Decorators
    static Config = SetupManager.generateConfigDecorator<[]>();

    //Method Decorators
    static Default = SetupManager.generateMethodDecorator();

    async loadEnvironments(clss: ITestSuiteConstructor)
    {
        if(!defaultEnvironmentMap.has(DefaultSetup.Default))
            defaultEnvironmentMap.set(DefaultSetup.Default, await NodeInProcessEnvironment.acquire());
        return defaultEnvironmentMap;
    }

    async disposeEnvironments() {}
}