import { ClassMethod, Identifier } from "@swc/core";
import { TestEnvironmentConstructor } from "../environments/testEnvironment.js";
import { Observable } from "../eventPropagation.js";
import { titleCase, camelToNormal } from "../formatting.js";
import { InternalError } from "../unitium.js";
import { TestError } from "./testError.js";

import { TestSuite } from "./testSuite.js";
import { getDecoratorDefinedEnvironment } from "../decorators.js";

export class TestFunction extends Observable
{
    public functionName: string;
    public name: string;
    public error?: TestError;
    public description?: string;
    public environment: TestEnvironmentConstructor;
    public isDebugTarget: boolean;

    constructor(
        public testSuite: TestSuite,
        public testFunctionNode: ClassMethod
    )
    {
        super();

        this.functionName = (testFunctionNode.key as Identifier).value;
        this.name = titleCase(camelToNormal(this.functionName))

        this.environment = getDecoratorDefinedEnvironment(testFunctionNode.function) ?? this.testSuite.defaultTestEnvironmentType;

        const debugDecorator = testFunctionNode.function.decorators?.find(decorator => decorator.expression.type === "Identifier" && decorator.expression.value === "Debug");
        this.isDebugTarget = debugDecorator !== undefined;
    }

    async run(testFixture: any)
    {
        this.runStarted.resolve();
        let wasSuccessful = false;
        try
        {
            await testFixture[this.functionName]();
            wasSuccessful = true;
        }
        catch (e: Error | any)
        {
            if(e instanceof InternalError)
                throw e;
            else
                this.error = new TestError(e);
        }

        this.runCompleted.resolve();
        
        return wasSuccessful;
    }
}