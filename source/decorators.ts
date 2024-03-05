import { debugTests } from "./unitium.js"

export function Sequential<T extends { new(...args: any[]): {} }>(cls: T, _context: any)
{
    cls.prototype.__meta = cls.prototype.__meta ?? {};
    cls.prototype.__meta.isSequential = true;
    return cls;
}

export function Debug(containingClass: any, propertyKey: string, descriptor: PropertyDescriptor)
{
    debugTests.set(containingClass, descriptor); 
}