export { evaluateSpecIn } from "#unitium/test-runtime";

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
