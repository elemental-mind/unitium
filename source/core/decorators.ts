import type { TestMethod, TestSuiteConstructor } from "./unitium.ts";

/**
 * Marks a test suite class to run its tests sequentially in declaration order.
 *
 * Sequential suites share a single class instance and may use member lifecycle hooks.
 *
 * @example
 * ```ts
 * import { Sequential } from "unitium";
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
 *     assertEquals(this.itemCount, 1);
 *   }
 * }
 * ```
 */
export function Sequential<T extends new (...args: any[]) => any>(classConstructor: T, context: ClassDecoratorContext): T
{
    (classConstructor as TestSuiteConstructor).isSequential = true;
    return classConstructor;
}

/**
 * Marks one test method as the only test to execute across all loaded modules for debugging purposes.
 *
 * In sequential suites, Unitium runs the selected test and all tests before it so
 * previous state setup still occurs.
 *
 * @example
 * ```ts
 * import { Debug } from "unitium";
 *
 * export class CheckoutTest {
 *   preparesCart() {
 *     // Runs first when this suite is sequential.
 *   }
 *
 *   @Debug
 *   chargesPaymentMethod() {
 *     // Only this test is run across all loaded test modules.
 *   }
 * }
 * ```
 */
export function Debug<This, Args extends any[], Return>(method: (this: This, ...args: Args) => Return, context: ClassMethodDecoratorContext): void
{
    (method as Function as TestMethod).isDebugTest = true;
}
