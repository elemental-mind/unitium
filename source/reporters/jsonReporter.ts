import { BaseReporter } from "./base.js";

export class JSONReporter extends BaseReporter {
    onTestRunEnd() {
        console.log(JSON.stringify(this.specification));
    }
}