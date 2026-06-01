import { AppSpecification } from "../../source/environments/cli/deno/api.ts";
import { SoftwareSpecification, TestRunner } from "../../source/core/unitium.ts";

export async function evaluateSpecIn(fileOrPath: string): Promise<SoftwareSpecification>
{
    const spec = new AppSpecification();
    await spec.load([fileOrPath]);
    await new TestRunner(spec).run();

    return spec;
}
