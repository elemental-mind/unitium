import type { TestSuite } from "../../../models/testSuite.js";
import { environment } from "../../../unitium.js";
import { TestEnvironment } from "../../testEnvironment.js";
import { InProcessTestEnvironment } from "../inProcessTestEnvironment.js";

export class NodeInProcessEnvironment extends InProcessTestEnvironment
{
    static async acquire() : Promise<TestEnvironment>
    {
        return environment;
    }

    async instantiateSuite(suite: TestSuite): Promise<any>
    {
        const modulePath = await await suite.testModule.createEnvironmentModuleAndReturnPath(NodeInProcessEnvironment);
        const module = await import(modulePath);
        return new module[suite.className]();
    }

    async release() {};
}