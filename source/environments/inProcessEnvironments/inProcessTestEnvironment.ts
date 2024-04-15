import type { TestSuite } from "../../models/testSuite.js";
import { EnvironmentType, TestEnvironment } from "../testEnvironment.js";

export abstract class InProcessTestEnvironment extends TestEnvironment
{
    environmentType = EnvironmentType.InProcess;

    async runStatic(suite: TestSuite, fct: string): Promise<void>
    {
        const module = await suite.testModule.file.import();
        await module[suite.className][fct]?.();
    }
}