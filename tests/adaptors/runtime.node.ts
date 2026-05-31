import { NodeAppSpecification } from "../../source/node/api.ts";
import { SoftwareSpecification, TestRunner } from "../../source/unitium.ts";
import path from "node:path";

export async function evaluateSpecIn(fileOrPath: string): Promise<SoftwareSpecification>
{
    const spec = await NodeAppSpecification.load([path.resolve(fileOrPath)]);
    await new TestRunner(spec).run();

    return spec;
}
