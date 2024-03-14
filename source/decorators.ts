import { IDecoratorAnnotation, ITestSuiteConstructor, ITestSuiteMetadata } from "./interfaces.js";

export function Sequential<T extends { new(...args: any[]): {} } & IDecoratorAnnotation<ITestSuiteMetadata>>(classConstructor: T)
{
    classConstructor.__meta = classConstructor.__meta ?? {};
    classConstructor.__meta.isSequential = true;
    return classConstructor;
}

export function Debug(classConstructor: { new(...args: any[]): {} } & IDecoratorAnnotation<ITestSuiteMetadata>, memberFunctionName: string)
{
    classConstructor.__meta = classConstructor.__meta ?? {};
    classConstructor.__meta.debugTestName = memberFunctionName;
}