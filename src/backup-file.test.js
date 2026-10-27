import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeBackup, parseBackup, backupSummary } from './backup-file.js';
import { exportWorkspace } from './workspace.js';
import { createCharacter } from './rules/engine.js';
import { initialDM } from './dm.js';
const fixture = () => {
  const character = createCharacter({ name: 'Mira', classId: 'cleric' });
  character.notes = 'Una porta, un "corvo" e una promessa.\nSeconda riga: è già tardi. 🐦';
  character.inventory = [{ name: 'Fiala, "ambra"', detail: 'Due righe\nTre indizi', qty: 2, weight: .1, equipped: false }];
  const dm = initialDM(); dm.secrets = 'Non leggere ad alta voce!\n"Il custode mente", dice Mira.';
  return { schemaVersion: 1, data: {
    'fable-character': JSON.stringify(character), 'fable-character-library': JSON.stringify([character]),
    'fable-campaign': JSON.stringify({ id: 'c1', name: 'La cripta', editionId: character.editionId, description: 'Nebbia\ne indizi', characterIds: [character.id] }),
    'fable-dm': JSON.stringify(dm), 'fable-session': JSON.stringify({ name: 'Tavolo', url: 'https://example.com/join?invite=abc#room' }),
    'fable-appearance': JSON.stringify({ mode: 'light', accent: '#334455' }), 'fable-language': 'it', 'fable-default-edition': '5.5-2024',
  } };
};
for (const format of ['json', 'csv']) test(`${format} preserves characters, inventories, campaign, encounters, private notes and preferences`, () => {
  const original = fixture();
  const text = serializeBackup(original, format);
  assert.deepEqual(parseBackup(text), original);
  assert.deepEqual(backupSummary(original), { characters: 1, campaign: 'La cripta', encounters: 1, hasDm: true });
  if (format === 'json') assert.equal(JSON.parse(text).sections['fable-character'].name, 'Mira');
});
test('CSV rejects duplicates, unexpected sections, unsupported versions and broken quoting', () => {
  const csv = serializeBackup(fixture(), 'csv');
  const header = '"fable_backup_version","section","data_json"\r\n';
  for (const broken of [csv.replace('"1","fable-character"', '"9","fable-character"'), csv + csv.split('\r\n')[1] + '\r\n', header + '"1","fable-unknown","{}"', header + '"1","fable-character","unclosed', 'a,b,c\n1,2,3']) assert.throws(() => parseBackup(broken));
  assert.throws(() => parseBackup(JSON.stringify({ format: 'fable-backup', version: 5, sections: {} })));
});
test('legacy full JSON backups can still be imported and ordinary character files are not mistaken for complete backups', () => {
  const original = fixture();
  assert.deepEqual(parseBackup(JSON.stringify(original)), original);
  assert.throws(() => parseBackup(original.data['fable-character']));
});
