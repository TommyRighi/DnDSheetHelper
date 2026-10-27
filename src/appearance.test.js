import { test } from "node:test";
import assert from "node:assert/strict";
import { readAppearance, themeVariables, defaultAppearance } from "./appearance.js";

const luminance = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
};
const contrast = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);

test("custom accents remain legible for extreme and preset colors in both themes", () => {
  for (const mode of ["light", "dark"]) {
    for (const accent of ["#000000", "#ffffff", "#ff0000", "#0000ff", "#00ff00", "#d99a68", "#81a9e8", "#df8a9b", "#bc9fea", "#757575", "#797979", "#808080"]) {
      const vars = themeVariables({ mode, accent });
      assert.equal(vars["--accent-fill"], accent);
      assert.ok(contrast(luminance(vars["--accent"]), mode === "light" ? .9 : .025) >= 4.5);
      assert.ok(contrast(luminance(vars["--on-accent"]), luminance(accent)) >= 4.5);
    }
  }
});

test("appearance storage rejects malformed preferences and preserves valid ones", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  try {
    for (const raw of ["{", "null", '{"mode":"other","accent":"red"}']) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => raw } });
      assert.deepEqual(readAppearance(), defaultAppearance);
    }
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => '{"mode":"light","accent":"#123456"}' } });
    assert.deepEqual(readAppearance(), { mode: "light", accent: "#123456" });
  } finally { if (previous) Object.defineProperty(globalThis, "localStorage", previous); else delete globalThis.localStorage; }
});
