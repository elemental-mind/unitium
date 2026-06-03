export function equal<T>(actual: T, expected: T)
{
    if (actual !== expected)
        throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
}
