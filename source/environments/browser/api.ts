/**
 * Browser runner API for executing Unitium tests in a web page.
 *
 * Use this module to load test modules from browser-resolvable URLs and report
 * the results with console, JSON, or DOM reporters.
 *
 * @example
 * ```ts
 * import {
 *   DOMReporter,
 *   TestRunner,
 *   URLSetSpecification,
 * } from "@elemental/unitium/browser-api";
 *
 * const spec = new URLSetSpecification();
 * await spec.load([new URL("./example.test.ts", import.meta.url).href]);
 *
 * await new TestRunner(spec, [new DOMReporter(spec)]).run();
 * ```
 *
 * @module browser_api
 */

export { BrowserAppSpecification } from "./index.ts";
export { URLSetSpecification } from "../../core/unitium.ts";

export { TestRunner } from "../../core/unitium.ts";

export { ConsoleReporter } from "../../reporters/consoleReporter.ts";
export { JSONReporter } from "../../reporters/jsonReporter.ts";
export { DOMReporter } from "../../reporters/domReporter.ts";
