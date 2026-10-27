import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDiceFormula, rollFormula } from "./dice.js";
test("mixed dice produce individual results and apply bonus once", () => {
  const sides = [];
  const r = rollFormula("2d6 + 1d8 - 3", (s) => {
    sides.push(s);
    return s;
  });
  assert.deepEqual(sides, [6, 6, 8]);
  assert.equal(r.total, 17);
  assert.deepEqual(r.values, [6, 6, 8]);
  assert.equal(r.expression, "2d6+1d8-3");
  assert.equal(r.sides, 0);
});
test("accepts single dice and rejects unsafe or excessive expressions", () => {
  assert.equal(parseDiceFormula("d20+4").groups[0].count, 1);
  for (const f of [
    "alert(1)",
    "2d6*9",
    "0d6",
    "101d20",
    "2d7",
    "2d6-1d4",
    "2.5d6",
    "2d6+1000",
    "123",
    "2d6;fetch(1)",
  ])
    assert.throws(() => parseDiceFormula(f));
  assert.equal(rollFormula("20d6+4", () => 1).total, 24);
});
