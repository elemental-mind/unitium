export function Sequential<T extends { new(...args: any[]): {} }>(cls: T, _context: any)
{
    cls.prototype.__meta = cls.prototype.__meta ?? {};
    cls.prototype.__meta.isSequential = true;
    return cls;
}

export function BeforeEach(beforeFunction: () => void)
{
    return function (cls: any, _context: any)
    {
        cls.prototype.__meta = cls.prototype.__meta ?? {};
        cls.prototype.__meta.beforeEach = beforeFunction;
        return cls;
    }
}

export function AfterEach(afterFunction: () => void)
{
    return function (cls: any, _context: any)
    {
        cls.prototype.__meta = cls.prototype.__meta ?? {};
        cls.prototype.__meta.afterEach = afterFunction;
        return cls;
    }
}