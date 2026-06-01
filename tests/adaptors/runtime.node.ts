import { AppSpecification } from "../../source/environments/cli/node/api.ts";
import { SoftwareSpecification, TestRunner } from "../../source/core/unitium.ts";
import path from "node:path";

export async function evaluateSpecIn(fileOrPath: string): Promise<SoftwareSpecification>
{
    const spec = new AppSpecification();
    await spec.load([path.resolve(fileOrPath)]);
    await new TestRunner(spec).run();

    return spec;
}
