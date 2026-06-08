/**
 * Test authoring API for Unitium suites.
 *
 * Import this module from test files to mark suites as sequential, select a
 * focused debug test, and type lifecycle hooks. Unitium discovers exported
 * classes as test suites and exported class methods as tests.
 *
 * @example
 * ```ts
 * import { Sequential } from "@elemental/unitium";
 *
 * @Sequential
 * export class ShoppingCartTest {
 *   private itemCount = 0;
 *
 *   addsItem() {
 *     this.itemCount++;
 *   }
 *
 *   keepsPreviousState() {
 *     if (this.itemCount !== 1) {
 *       throw new Error("Expected previous test state to be preserved.");
 *     }
 *   }
 * }
 * ```
 *
 * @module unitium
 */

export * from "./core/decorators.ts";
export * from "./core/hooks.ts";
