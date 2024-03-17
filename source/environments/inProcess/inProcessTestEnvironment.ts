import { TestSuite } from "../../models/testSuite.js";
import { EnvironmentType, TestEnvironment } from "../testEnvironment.js";

export class InProcessTestEnvironment extends TestEnvironment
{
    environmentType = EnvironmentType.InProcess;
    
    constructor(public id: number) {
        super();
    }
    
    loadSuite(moduleURL: string, suite: TestSuite): Promise<any>
    {
        throw new Error("Method not implemented.");
    }
}