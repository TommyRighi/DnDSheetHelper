import { test } from "node:test";
import assert from "node:assert/strict";
import { CLASSES, EDITIONS } from "./rules/catalog.js";
import {
  createCharacter,
  derive,
  restCharacter,
  restWithExceptions,
  advanceLevel,
  adjustHP,
  changeStats,
  rollDeathSave,
} from "./rules/engine.js";
import { parseCharacterSave } from "./storage.js";
import { readCharacters, saveCharacter } from "./rules/library.js";
const make = (editionId, classId = "fighter") =>
  createCharacter({ name: "Test", editionId, classId });
test("every edition and core class creates a valid, round-trippable independent character", () => {
  for (const editionId of Object.keys(EDITIONS))
    for (const k of CLASSES[editionId]) {
      const c = make(editionId, k.id),
        d = derive(c);
      assert.ok(Number.isFinite(d.ac));
      assert.ok(d.saves.every((s) => Number.isFinite(s.value)));
      assert.equal(parseCharacterSave(JSON.stringify(c)).rules.classId, k.id);
      assert.equal(parseCharacterSave(JSON.stringify(c)).editionId, editionId);
    }
  assert.equal(createCharacter({ name: "Latest" }).editionId, "5.5-2024");
});
test("3.5 ranger has d8, BAB, three saves, iterative attacks and natural recovery", () => {
  let c = make("3.5", "ranger");
  assert.equal(c.maxHp, 9);
  let d = derive(c);
  assert.equal(d.bab, 1);
  assert.deepEqual(
    d.saves.map((s) => s.value),
    [3, 4, 0],
  );
  assert.equal(d.skillPoints, 28);
  c = { ...c, level: 6, maxHp: 40, hp: 10 };
  d = derive(c);
  assert.deepEqual(d.iterative, [6, 1]);
  assert.deepEqual(
    d.saves.map((s) => s.value),
    [6, 7, 2],
  );
  assert.equal(restCharacter(c, "long").hp, 16);
  assert.throws(() => restCharacter(c, "short"));
  c = adjustHP(c, -15);
  assert.equal(c.hp, -5);
  assert.equal(parseCharacterSave(JSON.stringify(c)).hp, -5);
});
test("4e fighter uses Constitution score, class HP, four defenses and healing surges", () => {
  let c = make("4e");
  assert.equal(c.maxHp, 28);
  let d = derive(c);
  assert.equal(d.surgesMax, 10);
  assert.equal(d.surgeValue, 7);
  assert.equal(d.ac, 12);
  assert.deepEqual(
    d.saves.map((s) => s.value),
    [14, 12, 10],
  );
  c = { ...c, hp: 5 };
  const short = restCharacter(c, "short", { surges: 2 });
  assert.equal(short.hp, 19);
  assert.equal(short.rules.surges, 8);
  assert.equal(restCharacter(short, "long").hp, 28);
  assert.equal(restCharacter(short, "long").rules.surges, 10);
  const advanced = advanceLevel(c, 0);
  assert.equal(advanced.maxHp, 34);
  assert.equal(derive(advanced).ac, 13);
});
test("2014 and 2024 ranger spellcasting and long-rest hit dice differ", () => {
  assert.equal(derive(make("5e-2014", "ranger")).slotPools.length, 0);
  assert.equal(derive(make("5.5-2024", "ranger")).slotPools[0].max, 2);
  for (const [id, expected] of [
    ["5e-2014", 2],
    ["5.5-2024", 5],
  ]) {
    const c = { ...make(id), level: 5, hp: 2, hitDice: 0 };
    const n = restCharacter(c, "long");
    assert.equal(n.hitDice, expected);
    assert.equal(n.hp, c.maxHp);
  }
});
test("pact magic recovers on short rest while ordinary slots do not", () => {
  const w = make("5.5-2024", "warlock");
  w.rules.slotUsed = { 1: 1 };
  assert.deepEqual(restCharacter(w, "short").rules.slotUsed, {});
  const mage = make("5.5-2024", "wizard");
  mage.rules.slotUsed = { 1: 2 };
  assert.deepEqual(restCharacter(mage, "short").rules.slotUsed, { 1: 2 });
  assert.deepEqual(restCharacter(mage, "long").rules.slotUsed, {});
});
test("damage consumes temporary HP, death saves follow edition and Constitution is retroactive", () => {
  let c = make("5e-2014");
  c.rules.tempHp = 3;
  assert.equal(adjustHP(c, -5).hp, c.hp - 2);
  c = { ...c, hp: 0 };
  let fail = rollDeathSave(c, 1);
  assert.equal(fail.rules.deathFailure, 2);
  assert.equal(rollDeathSave(fail, 20).hp, 1);
  const stats = [...c.stats];
  stats[2] = 15;
  assert.equal(changeStats(c, stats).maxHp, c.maxHp + 1);
  let fourth = make("4e");
  fourth.hp = -5;
  fourth = rollDeathSave(fourth, 20);
  assert.equal(fourth.hp, 7);
  assert.equal(fourth.rules.surges, 9);
});
test("level 30 remains available only in 4e and negative/excess resources survive storage", () => {
  const c = { ...make("4e"), level: 30, hp: -3 };
  assert.equal(parseCharacterSave(JSON.stringify(c)).level, 30);
  assert.throws(() => advanceLevel(c, 0));
  assert.throws(() =>
    parseCharacterSave(JSON.stringify({ ...make("5e-2014"), level: 30 })),
  );
});
test("new editions share manual table overrides without applying them twice", () => {
  const c = make("4e");
  c.tableRules = {
    overrides: { ac: { value: 24, reason: "Master" } },
    effects: [
      {
        id: "x",
        name: "Bless",
        target: "ac",
        amount: 2,
        duration: "shortRest",
      },
    ],
    resources: [],
    history: [],
  };
  assert.equal(derive(c).ac, 26);
  assert.equal(derive(c).tableValues.ac, 26);
  const rested = restWithExceptions(c, "short", { count: 0 });
  assert.equal(derive(rested).ac, 24);
  assert.equal(rested.tableRules.effects.length, 0);
});
test("library stores multiple editions and replacing a snapshot preserves the others", () => {
  const values = new Map();
  const storage = {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
  };
  const a = make("3.5"),
    b = make("5.5-2024");
  saveCharacter(storage, a);
  saveCharacter(storage, b);
  saveCharacter(storage, { ...a, hp: 1 });
  const list = readCharacters(storage);
  assert.equal(list.length, 2);
  assert.equal(list.find((c) => c.id === a.id).hp, 1);
  assert.equal(list.find((c) => c.id === b.id).editionId, "5.5-2024");
});

test("an edition label cannot make legacy 5e data masquerade as a different ruleset", () => {
  const c = make("3.5");
  delete c.rules;
  assert.throws(() => parseCharacterSave(JSON.stringify(c)));
  const future = { ...make("5.5-2024"), schemaVersion: 99 };
  assert.throws(() => parseCharacterSave(JSON.stringify(future)));
});
