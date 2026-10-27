import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCharacterSave } from "./storage.js";

const validSave = () => ({
  name: "Lyra",
  surname: "",
  race: "Umano",
  className: "Ranger",
  hp: 12,
  maxHp: 12,
  level: 1,
  xp: 0,
  slots: 0,
  hitDice: 1,
  gold: 10,
  notes: "Una pista nel bosco.",
  stats: [12, 16, 14, 10, 15, 8],
  inventory: [{ name: "Frecce", detail: "Munizioni", qty: 20, weight: 0.05 }],
  inspiration: false,
  logs: [],
});

test("round-trips a valid save and preserves inventory and notes", () => {
  const original = validSave();
  const parsed = parseCharacterSave(JSON.stringify(original));
  assert.equal(parsed.notes, original.notes);
  assert.deepEqual(parsed.inventory[0], {
    ...original.inventory[0],
    equipped: false,
  });
  assert.deepEqual(parseCharacterSave(JSON.stringify(parsed)), parsed);
});

test("rejects malformed JSON, invalid stats and object-valued UI fields", () => {
  assert.throws(() => parseCharacterSave("{"));
  for (const bad of [
    { stats: [12] },
    { stats: [12, 16, 14, 10, 15, -1] },
    { notes: {} },
    { hp: "12" },
    { level: 21 },
    { inventory: [{ name: "Oggetto", detail: {}, qty: 1, weight: 1 }] },
  ]) {
    assert.throws(() =>
      parseCharacterSave(JSON.stringify({ ...validSave(), ...bad })),
    );
  }
});

test("preserves resources above the reference limits on import", () => {
  const parsed = parseCharacterSave(
    JSON.stringify({ ...validSave(), hp: 999, slots: 99, hitDice: 99 }),
  );
  assert.equal(parsed.hp, 999);
  assert.equal(parsed.slots, 99);
  assert.equal(parsed.hitDice, 99);
});

test("discards malformed dice logs without losing the character", () => {
  const parsed = parseCharacterSave(
    JSON.stringify({
      ...validSave(),
      logs: [
        null,
        { label: "Prova", values: "broken" },
        {
          label: "Destrezza",
          values: [12],
          bonus: 3,
          total: 15,
          sides: 20,
          id: 1,
        },
      ],
    }),
  );
  assert.equal(parsed.name, "Lyra");
  assert.equal(parsed.logs.length, 1);
  assert.equal(parsed.logs[0].total, 15);
});

test('editable sheet fields survive save, reload and character exports without translating user text', () => {
  const sheetDetails = {
    playerName: 'Tommaso', alignment: 'Caotico buono',
    personalityTraits: 'Forza\nMi fido del gruppo.', ideals: 'Libertà',
    bonds: 'La mia famiglia', flaws: 'Sono testardo.',
    proficiencies: 'Elfico, Comune, strumenti da cartografo',
    features: 'Un tratto scelto dal manuale.',
  };
  const saved = parseCharacterSave(JSON.stringify({ ...validSave(), background: 'Esploratore', sheetDetails }));
  assert.deepEqual(saved.sheetDetails, sheetDetails);
  assert.equal(saved.background, 'Esploratore');
  assert.deepEqual(parseCharacterSave(JSON.stringify(saved)), saved);
  assert.deepEqual(parseCharacterSave(JSON.stringify(validSave())).sheetDetails, {});
});

test('imported sheet fields reject invalid types and excessive content while ignoring unknown keys', () => {
  for (const sheetDetails of [null, [], 'invalid', { ideals: {} }, { playerName: 42 }, { bonds: 'a'.repeat(10001) }, { alignment: 'a'.repeat(101) }]) {
    assert.throws(() => parseCharacterSave(JSON.stringify({ ...validSave(), sheetDetails })));
  }
  const saved = parseCharacterSave(JSON.stringify({ ...validSave(), sheetDetails: { ideals: '', unexpected: '<script>' } }));
  assert.deepEqual(saved.sheetDetails, { ideals: '' });
});
