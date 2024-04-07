import { TestEnvironment } from "../environments/testEnvironment.js";
import { ITestSuiteConstructor } from "../interfaces.js";

type SuiteSetupConfiguration = any;
export type EnvironmentDecoratorFunction = ((clss: any, methodName: string) => void) & { isEnvironmentDecorator: boolean; };

export type ITestSetupConstructor =
    any & { new(): TestSetup; };

export abstract class TestSetup
{
    abstract loadEnvironments(clss: any): Promise<Map<EnvironmentDecoratorFunction | null, TestEnvironment>>;
    abstract disposeEnvironments(): Promise<void>;
}

class TestSetupManager
{
    public setups = new Set<typeof TestSetup>();
    public decoratorToSetupMap = new Map<EnvironmentDecoratorFunction, ITestSetupConstructor>();
    public suiteSetupConfigurations = new Map<ITestSuiteConstructor, SuiteSetupConfiguration>();
    public suiteSetupMetadata = new Map<ITestSuiteConstructor, Record<string, EnvironmentDecoratorFunction>>();

    public generateMethodDecorator(): EnvironmentDecoratorFunction
    {
        const suiteSetupMetadata = this.suiteSetupMetadata;
        const fct = function (clss: any, methodName: string)
        {
            if (suiteSetupMetadata.has(clss))
                suiteSetupMetadata.get(clss)![methodName] = fct;
            else
                suiteSetupMetadata.set(clss, { [methodName]: fct });
        };
        fct.isEnvironmentDecorator = true;
        return fct;
    }

    public generateConfigDecorator<T>(): (args: T) => (clss: ITestSuiteConstructor) => void
    {
        const suiteSetupConfigurations = this.suiteSetupConfigurations;
        return function (args: T)
        {
            return function (clss: ITestSuiteConstructor)
            {
                suiteSetupConfigurations.set(clss, args);
            };
        };
    }

    public getConfigurationFor<T>(testSuite: ITestSuiteConstructor): T
    {
        return this.suiteSetupConfigurations.get(testSuite);
    }

    public registerSetup(setup: ITestSetupConstructor)
    {
        this.setups.add(setup);
        for (const key in setup)
        {
            if (Object.prototype.hasOwnProperty.call(setup, key))
            {
                const element = setup[key];
                if (typeof element === "function" && element.isEnvironmentDecorator)
                    this.decoratorToSetupMap.set(element, setup);
            }
        }
    }
}

export const SetupManager = new TestSetupManager();