import { SoftwareSpecification, TestRunner } from "../source/core/unitium.ts";

type RuntimeModule = {
    AppSpecification: new () => SoftwareSpecification;
};

async function getRuntimeModule(): Promise<RuntimeModule>
{
    if ("Deno" in globalThis)
        return await import("../source/environments/cli/deno/api.ts") as RuntimeModule;
    else if ("Bun" in globalThis)
        return await import("../source/environments/cli/bun/api.ts") as RuntimeModule;
    else
        return await import("../source/environments/cli/node/api.ts") as RuntimeModule;
}

export async function evaluateSpecIn(fileOrPath: string): Promise<SoftwareSpecification>
{
    const { AppSpecification } = await getRuntimeModule();
    const spec = new AppSpecification();
    await spec.load([fileOrPath]);
    await new TestRunner(spec).run();

    return spec;
}

export function arraysContainSameElements(array1: any[], array2: any[])
{
    return (
        array1.length === array2.length
        &&
        (
            array1.length === 0
            ||
            array1.every(element => array2.includes(element)) && array2.every(element => array1.includes(element))
        )
    );
}
