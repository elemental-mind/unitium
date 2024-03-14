import { FusionOf } from "fusium-js";
import { RPCSender } from "./exProcess/rpc.js";
import { TestEventProvider } from "../reporters/events.js";

export abstract class TestEnvironment
{
    constructor(public testModules: string[]) {};

    abstract setup() : Promise<TestEventProvider>;
    abstract runAllModules(): Promise<void>;
    abstract runModule(moduleName: string): Promise<void>;
    abstract runSuite(moduleName: string, suiteName: string): Promise<void>;
    abstract runTest(moduleName: string, suiteName: string, testName: string): Promise<void>;
}

export class InProcessTestEnvironment extends TestEnvironment
{
    
}

export class ExProcessTestEnvironment extends FusionOf(TestEnvironment, RPCSender)
{

}