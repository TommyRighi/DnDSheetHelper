import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from './rules/engine.js';
import { saveCharacter, readCharacters } from './rules/library.js';
import { ACTIVE_KEY, BACKUP_KEY, RECOVERY_KEY, persistCharacter, loadCharacter, recoverCharacter } from './character-persistence.js';
const memory = () => {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};
const make = () => createCharacter({ name: 'Lyra', classId: 'fighter' });
test('invalid editing states cannot replace a valid active character or archive entry', () => {
  const storage = memory(), character = make();
  persistCharacter(storage, character);
  const before = storage.getItem(ACTIVE_KEY);
  assert.throws(() => persistCharacter(storage, { ...character, name: '' }));
  assert.throws(() => saveCharacter(storage, { ...character, name: '' }));
  assert.equal(storage.getItem(ACTIVE_KEY), before);
  assert.equal(readCharacters(storage)[0].name, 'Lyra');
});
test('a corrupt active save requires explicit recovery and keeps the original bytes', () => {
  const storage = memory(), character = make();
  persistCharacter(storage, character);
  persistCharacter(storage, { ...character, name: 'Lyra II' });
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)).name, 'Lyra');
  storage.setItem(ACTIVE_KEY, '{broken');
  const loaded = loadCharacter(storage, make());
  assert.equal(loaded.blocked, true);
  assert.equal(loaded.character.name, 'Lyra');
  assert.throws(() => persistCharacter(storage, loaded.character));
  assert.equal(storage.getItem(ACTIVE_KEY), '{broken');
  recoverCharacter(storage, loaded.character);
  assert.equal(storage.getItem(RECOVERY_KEY), '{broken');
  assert.equal(loadCharacter(storage, make()).blocked, false);
});
test('storage failure is reported without replacing the last active version', () => {
  const storage = memory(), character = make();
  persistCharacter(storage, character);
  const before = storage.getItem(ACTIVE_KEY);
  const failing = { ...storage, setItem() { throw new Error('quota'); } };
  assert.throws(() => persistCharacter(failing, { ...character, name: 'New' }));
  assert.equal(storage.getItem(ACTIVE_KEY), before);
});
test('missing active save restores archive and unavailable storage blocks autosave', () => {
  const storage = memory(), character = make();
  saveCharacter(storage, character);
  assert.equal(loadCharacter(storage, make()).character.id, character.id);
  assert.equal(loadCharacter({ getItem() { throw new Error('denied'); } }, character).blocked, true);
});
