import { NodeAppSpecification } from "../node/api.js";
import { SoftwareSpecification, TestRunner } from "../unitium.js";
import path from "path"

export async function evaluateNodeSpecIn(fileOrPath: string): Promise<SoftwareSpecification>
{
    const spec = await NodeAppSpecification.load([path.resolve(fileOrPath)]);
    const runner = await new TestRunner(spec).run();

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