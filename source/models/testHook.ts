import type { TestSuite } from "./testSuite.js";
import type { EnvironmentDecorator } from "../setups/testSetup.js";

export type TestHookType = "Setup" | "Teardown" | "Before" | "After";

export class TestHook
{
    public environment: EnvironmentDecorator;
    public type: TestHookType;
    public functionName: string;

    static regex = /^on(?<type>Setup|Teardown|Before|After)(?:Each)?(?<environment>\w*)?$/;

    constructor(
        public testSuite: TestSuite,
        public testHook: Function
    )
    {
        this.functionName = testHook.name;
        const match = this.functionName.match(TestHook.regex)!;

        if(!match.groups)
            throw new Error("Could not match Hook name");
        
        const setup = this.testSuite.setupType;

        const type = match.groups.type;
        const environmentString = match.groups.environment as keyof typeof setup;
        const environmentDecorator = setup[environmentString] as EnvironmentDecorator;

        if (environmentString)
        {
            if(!environmentDecorator)
                throw new Error(`Unrecognized environment in hook ${this.functionName} in suite ${this.testSuite.className}`);
            else
                this.environment = environmentDecorator;
        }
        else
            this.environment = setup.Default;
        
        this.type = type as typeof this.type;
    }
}