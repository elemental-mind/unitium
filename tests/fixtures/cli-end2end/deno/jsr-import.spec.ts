import { assertEquals } from "jsr:@std/assert";
import { Sequential } from "jsr:@elemental/unitium";

@Sequential
export class DenoJSRImportSpec {
  private executionOrder: number[] = [];

  firstTestUsesJSRImports() {
    this.executionOrder.push(1);

    assertEquals(this.executionOrder, [1]);
  }

  secondTestUsesSharedSequentialState() {
    this.executionOrder.push(2);

    assertEquals(this.executionOrder, [1, 2]);
  }
}
