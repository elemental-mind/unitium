export function Sequential<T extends { new(...args: any[]): {} }>(cls: T): T
{
    cls.prototype.__meta = cls.prototype.__meta ?? {};
    cls.prototype.__meta.isSequential = true;
    return cls;
}

export function Debug(containingClass: any, propertyKey: string): void
{
    containingClass.constructor.prototype.__meta = containingClass.constructor.prototype.__meta ?? {};
    containingClass.constructor.prototype.__meta.debugTestName = propertyKey;
}
