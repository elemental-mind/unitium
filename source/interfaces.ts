import { ISequentialTestSuiteMemberHooks, IParallelTestSuiteStaticHooks } from "./hooks.js";

export interface TestModuleData
{
    moduleURL: string;
    testSuites: TestSuiteData[];
}

export interface TestSuiteData
{
    className: string;
    name: string;
    tests: TestData[];
    isSequential: boolean;
    containsTestHooks: boolean;
}

export interface TestData
{
    name: string;
    description?: string;
    error?: TestErrorData;
}

export interface TestErrorData
{
    actual: any;
    expected: any;
    name: string;
    message: string;
    stack: string;
    sourceFile: string;
    fileLocation: {
        line: number;
        column: number;
    };
}

export type ITestSuiteConstructor =
    {
        new(): ISequentialTestSuiteMemberHooks;
        prototype: ISequentialTestSuiteMemberHooks & Record<string, Function>;
    }
    & IParallelTestSuiteStaticHooks
    & IDecoratorAnnotation<ITestSuiteMetadata>;

export interface IDecoratorAnnotation<T>
{
    __meta?: T;
};

export interface ITestSuiteMetadata
{
    isSequential?: boolean;
    debugTestName?: string;
    browserTest?:
    {
        strategy: "inBrowser" | "remoteBrowser";
        url?: string;
    };
};