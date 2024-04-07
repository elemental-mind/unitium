import { ClassDeclaration, Decorator, Fn} from "@swc/core";
import { IDecoratorAnnotation, ITestSuiteMetadata } from "./interfaces.js";

export function Sequential<T extends { new(...args: any[]): {}; } & IDecoratorAnnotation<ITestSuiteMetadata>>(classConstructor: T)
{
    classConstructor.__meta = classConstructor.__meta ?? {};
    classConstructor.__meta.isSequential = true;
    return classConstructor;
}

export function Debug(classConstructor: { new(...args: any[]): {}; } & IDecoratorAnnotation<ITestSuiteMetadata>, memberFunctionName: string)
{
    classConstructor.__meta = classConstructor.__meta ?? {};
    classConstructor.__meta.debugTestName = memberFunctionName;
}

export function getDecoratorNames(node: {decorators?: Decorator[]})
{
    return node.decorators?.map(decorator => 
        {
            switch (decorator.expression.type)
            {
                case "Identifier":
                    return decorator.expression.value;
                case "CallExpression":
                    switch (decorator.expression.callee.type)
                    {
                        case "Identifier":
                            return decorator.expression.callee.value;
                        default:
                            throw new Error("Unsupported decorator format");
                    }
                default:
                    throw new Error("Unsupported decorator format");
            }
        });
}

export function getDecoratorDefinedEnvironment(node: ClassDeclaration | Fn)
{
    const environmentDecoratorName = getDecoratorNames(node)?.find(name => registeredEnvironments.has(name));
    
    if(environmentDecoratorName)
        return registeredEnvironments.get(environmentDecoratorName)!;
    else 
        return undefined;
}