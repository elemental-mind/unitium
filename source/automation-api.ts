/**
 * Automation-facing types for Unitium CLI JSON reports.
 *
 * Import these types in CI scripts, dashboards, and other automation that reads
 * output produced by the Unitium CLI with the `--json` flag.
 *
 * @example
 * ```ts
 * import type { ConsoleJSONTestReport } from "@elemental/unitium/automation-api";
 *
 * const report = JSON.parse(jsonText) as ConsoleJSONTestReport;
 * const failedTests = report.modules
 *   .flatMap((module) => module.suites)
 *   .flatMap((suite) => suite.tests)
 *   .filter((test) => test.status === "Fail");
 * ```
 *
 * @module automation_api
 */
import type { SerializedSoftwareSpecification } from "./core/unitium.ts";

export type ConsoleJSONTestReport = SerializedSoftwareSpecification;
