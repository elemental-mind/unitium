//Public Console Output Types for CI/CD automation when using the --json flag
import type { SoftwareSpecification } from "./core/unitium.ts";

export type ConsoleJSONTestReport = ReturnType<SoftwareSpecification["serialize"]>