import type { TestEnvironment } from "./environments/testEnvironment.js";

export let environment: TestEnvironment;

export class InternalError extends Error {}