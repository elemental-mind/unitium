import { ClassMethod, Identifier } from "@swc/core";
import { TestSuite } from "./testSuite.js";
import { TestEnvironmentConstructor } from "../environments/testEnvironment.js";

export type TestHookType = "Setup" | "Teardown" | "Before" | "After";

export class TestHook
{
    public environment: TestEnvironmentConstructor;
    public type: TestHookType;
    public functionName: string;

    static regex = /^on(?<type>Setup|Teardown|Before|After)(?:Each)?(?<environment>\w*)?$/;

    constructor(
        public testSuite: TestSuite,
        public testHookNode: ClassMethod
    )
    {
        this.functionName = (testHookNode.key as Identifier).value;
        const match = this.functionName.match(TestHook.regex)!;
        const { type , environment: environmentString } = match.groups!;

        if (environmentString && !registeredEnvironments.has(environmentString))
            throw new Error(`Unrecognized environment in hook ${this.functionName} in suite ${this.testSuite.className}`);
        
        this.type = type as typeof this.type;
        this.environment = environmentString ? registeredEnvironments.get(environmentString)! : this.testSuite.defaultTestEnvironmentType;
    }
}