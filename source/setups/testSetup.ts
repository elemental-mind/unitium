import { TestEnvironment } from "../environments/testEnvironment.js";
import { ArgsArray, ITestSuiteConstructor } from "../interfaces.js";
import { TestSuite } from "../models/testSuite.js";

export type EnvironmentDecorator =
    ((clss: any, methodName: string) => void)
    & {
        isEnvironmentDecorator: boolean;
        environmentID: number;
        environmentName: string;
    };
export type ConfigurationDecorator<T extends any[] = any[]> = ((...args: ArgsArray<T>) => (clss: ITestSuiteConstructor) => void) & { isConfigurationDecorator: boolean; };

export interface ITestSetupConstructor<T extends any[] = any[]>
{
    new(): TestSetup;
    Default: EnvironmentDecorator;
    Config: ConfigurationDecorator<T>;
};

export abstract class TestSetup
{
    abstract loadEnvironments(suite: TestSuite): Promise<Map<EnvironmentDecorator, TestEnvironment>>;
    abstract disposeEnvironments(): Promise<void>;
}

class TestSetupManager
{
    public environmentIDProvider = 0;
    public setups = new Map<ITestSetupConstructor<any>, { multiEnvironment: boolean; }>();
    public decoratorToSetupMap = new Map<EnvironmentDecorator | ConfigurationDecorator, ITestSetupConstructor>();

    public generateConfigDecorator<T extends any[]>(): ConfigurationDecorator<T>
    {
        const decorator = (...args: ArgsArray<T>) =>
        {
            return (clss: ITestSuiteConstructor) =>
            {
                this.ensureSetupMetadata(clss);
                clss.__meta!.setup!.configuration = {
                    decorator: decorator as ConfigurationDecorator,
                    data: args
                };
            };
        };
        decorator.isConfigurationDecorator = true;
        return decorator;
    }

    public generateEnvironmentDecorator(environmentName: string): EnvironmentDecorator
    {
        const decorator = (clss: ITestSuiteConstructor, methodName: string) =>
        {
            this.ensureSetupMetadata(clss);
            clss.__meta!.setup!.functions![methodName] = decorator;
        };
        decorator.isEnvironmentDecorator = true;
        decorator.environmentID = this.environmentIDProvider++;
        decorator.environmentName = environmentName;
        return decorator;
    }

    private ensureSetupMetadata(clss: ITestSuiteConstructor)
    {
        if (!clss.__meta)
            clss.__meta = {};
        if (!clss.__meta.setup)
            clss.__meta.setup = {
                functions: {}
            };
    }

    public registerSetup(setup: ITestSetupConstructor)
    {
        let environmentDecoratorCount = 0;
        for (const [elementName, element] of Object.entries(setup))
        {
            if (typeof element === "function" && (element.isEnvironmentDecorator || element.isConfigurationDecorator))
            {
                this.decoratorToSetupMap.set(element, setup);

                if (element.isEnvironmentDecorator)
                    environmentDecoratorCount++;
            }
        }

        this.setups.set(setup, {
            multiEnvironment: environmentDecoratorCount > 1
        });
    }

    public isMultiEnvironmentSetup(setup: ITestSetupConstructor)
    {
        return this.setups.get(setup)!.multiEnvironment;
    }
}

export const SetupManager = new TestSetupManager();