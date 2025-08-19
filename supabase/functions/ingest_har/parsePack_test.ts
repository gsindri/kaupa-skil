import { parsePack } from "./parsePack.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Assertion failed: expected ${JSON.stringify(expected)}, got ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("parsePack extracts quantity and unit", () => {
  assertEquals(parsePack("6x0.5L"), { qty: 3, unit: "L" });
  assertEquals(parsePack("250g"), { qty: 0.25, unit: "kg" });
  assertEquals(parsePack(""), { qty: 1, unit: "each" });
  assertEquals(parsePack("invalid"), { qty: 1, unit: "each" });
});
