import { BaseReporter } from "./base.ts";

export class JSONReporter extends BaseReporter {
    onTestRunEnd() {
        console.log(this.specification.serialize());
    }
}