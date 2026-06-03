import { BaseReporter } from "./base.ts";

export class JSONReporter extends BaseReporter {
    onTestRunEnd() {
        console.log(JSON.stringify(this.specification.serialize(), undefined, 2));
    }
}
