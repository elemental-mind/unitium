import { TestSuite, TestSuiteInstance } from "../../../models/testSuite.js";
import { DefaultSetup } from "../../../setups/preDefined/defaultSetup.js";
import type { TestEnvironment } from "../../testEnvironment.js";
import { InProcessTestEnvironment } from "../inProcessTestEnvironment.js";

export class NodeInProcessEnvironment extends InProcessTestEnvironment
{
    static async acquire() : Promise<TestEnvironment>
    {
        return environment;
    }

    async instantiateSuite(suite: TestSuite): Promise<TestSuiteInstance>
    {
        const moduleFile = await suite.testModule.createEnvironmentModuleFile(DefaultSetup.Default);
        const module = await moduleFile.import();
        return new module[suite.className]();
    }

    async release() {};
}

const environment = new NodeInProcessEnvironment(DefaultSetup.Default);