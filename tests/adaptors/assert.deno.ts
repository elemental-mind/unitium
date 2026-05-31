type AssertionErrorOptions = {
    actual?: unknown;
    expected?: unknown;
    message?: string;
};

class AssertionError extends Error
{
    actual?: unknown;
    expected?: unknown;

    constructor(options: AssertionErrorOptions)
    {
        super(options.message ?? "Assertion failed");
        this.name = "AssertionError";
        this.actual = options.actual;
        this.expected = options.expected;
    }
}

function ok(value: unknown, message?: string)
{
    if (!value)
        throw new AssertionError({ actual: value, expected: true, message });
}

function equal(actual: unknown, expected: unknown, message?: string)
{
    if (actual != expected)
        throw new AssertionError({ actual, expected, message: message ?? `${actual} == ${expected}` });
}

function deepEqual(actual: unknown, expected: unknown, message?: string)
{
    const actualValue = JSON.stringify(actual);
    const expectedValue = JSON.stringify(expected);

    if (actualValue !== expectedValue)
        throw new AssertionError({ actual, expected, message: message ?? `${actualValue} deepEqual ${expectedValue}` });
}

export default Object.assign(ok, {
    equal,
    deepEqual,
    deepStrictEqual: deepEqual,
});
