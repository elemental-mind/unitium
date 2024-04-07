import { TestSuite } from "../../models/testSuite.js";
import { EnvironmentType, TestEnvironment } from "../testEnvironment.js";

export abstract class InProcessTestEnvironment extends TestEnvironment
{
    environmentType = EnvironmentType.InProcess;

    async runStatic(suite: TestSuite, fct: string): Promise<void>
    {
        const module = await import(suite.testModule.filePath);
        await module[suite.className][fct]();
    }
}