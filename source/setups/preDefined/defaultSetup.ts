import { NodeInProcessEnvironment } from "../../environments/inProcessEnvironments/node/environment.js";
import { TestEnvironment } from "../../environments/testEnvironment.js";
import { ITestSuiteConstructor } from "../../interfaces.js";
import { TestSetup } from "../testSetup.js";

const defaultEnvironmentMap = new Map<null, TestEnvironment>();

export class DefaultSetup extends TestSetup
{
    async loadEnvironments(clss: ITestSuiteConstructor)
    {
        if(!defaultEnvironmentMap.has(null))
            defaultEnvironmentMap.set(null, await NodeInProcessEnvironment.acquire());
        return defaultEnvironmentMap;
    }

    async disposeEnvironments() {}
}