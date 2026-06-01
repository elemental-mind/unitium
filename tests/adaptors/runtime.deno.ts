import { DenoAppSpecification } from "../../source/runtimes/deno/api.ts";
import { SoftwareSpecification, TestRunner } from "../../source/core/unitium.ts";

export async function evaluateSpecIn(fileOrPath: string): Promise<SoftwareSpecification>
{
    const spec = await DenoAppSpecification.load([fileOrPath]);
    await new TestRunner(spec).run();

    return spec;
}
