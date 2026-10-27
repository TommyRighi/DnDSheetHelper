import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snapshotCharacter, refreshSnapshot } from './dm-snapshots.js';
import { createCharacter } from './rules/engine.js';
import { initialDM, parseDMSave } from './dm.js';
test('new campaign consoles start empty in the campaign edition', () => {
  const data = initialDM({ empty: true, editionId: '4e' });
  assert.equal(data.party.length, 0);
  assert.equal(data.encounter.editionId, '4e');
  assert.deepEqual(parseDMSave(JSON.stringify(data)), data);
});
test('refreshing a snapshot keeps initiative, conditions, notes and its stable identifier', () => {
  const c = createCharacter({ name: 'Mira', classId: 'cleric' });
  const source = snapshotCharacter(c);
  const copy = { ...source, id: 'encounter-copy', initiative: 19, conditions: ['Prono'], notes: 'In copertura', sourceMemberId: 'roster-id' };
  const updated = refreshSnapshot(copy, snapshotCharacter({ ...c, hp: 2 }));
  assert.equal(updated.id, copy.id);
  assert.equal(updated.hp, 2);
  assert.equal(updated.initiative, 19);
  assert.deepEqual(updated.conditions, ['Prono']);
  assert.equal(updated.notes, 'In copertura');
  assert.equal(updated.sourceMemberId, 'roster-id');
  assert.throws(() => refreshSnapshot(copy, { ...source, editionId: '3.5' }));
});
test('snapshot metadata from stored data cannot inject an unknown edition or object identifiers', () => {
  const data = initialDM();
  for (const extra of [{ editionId: '__proto__' }, { sourceCharacterId: {} }, { sourceMemberId: [] }]) {
    assert.throws(() => parseDMSave(JSON.stringify({ ...data, party: [{ ...data.party[0], ...extra }] })));
  }
});
