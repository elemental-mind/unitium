import { BaseReporter } from "./base.ts";

export class JSONReporter extends BaseReporter
{
    onTestRunnerEnd(): void
    {
        console.log(JSON.stringify(this.specification.serialize(), undefined, 2));
    }
}
