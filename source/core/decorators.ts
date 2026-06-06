import { unitiumDebugTestMetadataKey, type UnitiumDebuggableMethod } from "./decorator-metadata.ts";

export function Sequential<T extends { new(...args: any[]): object }>(cls: T, _context: ClassDecoratorContext<T>): T
{
    cls.prototype.__meta = cls.prototype.__meta ?? {};
    cls.prototype.__meta.isSequential = true;
    return cls;
}

export function Debug<This, Args extends any[], Return>(
    method: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): void
{
    if (typeof context.name === "string")
        (method as UnitiumDebuggableMethod)[unitiumDebugTestMetadataKey] = context.name;
}
