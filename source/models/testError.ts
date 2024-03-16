import { Transportable } from "../distributedTesting.js";

export class TestError extends Transportable
{
    public actual: any;
    public expected: any;
    public name!: string;
    public message!: string;
    public stack!: string;
    public sourceFile: string;
    public fileLocation: {
        line: number,
        column: number;
    };

    constructor(private error: Error)
    {
        super();
        Object.assign(this, error);
        this.name = error.name;
        const errorPosition = error.stack!.split("\n    at")[1].trim();
        const fileParseResults = /\((.*?)\:(\d+)\:(\d+)\)/.exec(errorPosition)!;
        this.sourceFile = fileParseResults[1];
        this.fileLocation = { line: Number(fileParseResults[2]), column: Number(fileParseResults[3]) };
    }
}