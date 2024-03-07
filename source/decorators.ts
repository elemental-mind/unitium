import { TestSuiteConstructor } from "./unitium.js";

export function Sequential<T extends { new(...args: any[]): {} }>(cls: T, _context: any)
{
    cls.prototype.__meta = cls.prototype.__meta ?? {};
    cls.prototype.__meta.isSequential = true;
    return cls;
}

export function Debug(containingClass: TestSuiteConstructor, propertyKey: string)
{
    containingClass.constructor.prototype.__meta = containingClass.constructor.prototype.__meta ?? {};
    containingClass.constructor.prototype.__meta.debugTestName = propertyKey;
}