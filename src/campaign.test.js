import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCampaign, saveCampaign, readPage, NAVIGATION_KEY, characterChecklist } from './campaign.js';
import { createCharacter } from './rules/engine.js';
const memory = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }; };
test('campaign saves validate before replacing identity and migrate existing table names', () => {
  const storage = memory();
  storage.setItem('fable-session', JSON.stringify({ name: 'La cripta', url: 'https://example.com/table' }));
  assert.equal(readCampaign(storage).name, 'La cripta');
  const c = saveCampaign(storage, { id: 'local', name: 'Corvo', editionId: '5e-2014', description: 'Indizi', characterIds: ['one', 'one'] });
  assert.deepEqual(c.characterIds, ['one']);
  assert.throws(() => saveCampaign(storage, { ...c, name: '' }));
  assert.equal(readCampaign(storage).name, 'Corvo');
  assert.throws(() => saveCampaign(storage, { ...c, editionId: '__proto__' }));
});
test('navigation recovers only known views and character preparation follows stored data', () => {
  const storage = memory();
  storage.setItem(NAVIGATION_KEY, 'Schermo del DM');
  assert.equal(readPage(storage), 'Schermo del DM');
  storage.setItem(NAVIGATION_KEY, 'broken');
  assert.equal(readPage(storage), 'Panoramica');
  const c = createCharacter({ name: 'Mira', classId: 'cleric' });
  assert.equal(characterChecklist(c).filter(x => !x.done).length, 4);
  assert.equal(characterChecklist({ ...c, inventory: [{ name: 'Scudo' }] }).find(x => x.target === 'Inventario').done, true);
});
