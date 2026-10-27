import test from 'node:test';
import assert from 'node:assert/strict';
import { readLanguage, saveLanguage } from './language.js';

test('language preference persists and unknown stored values fall back to Italian', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(readLanguage(storage), 'it');
  saveLanguage('en', storage);
  assert.equal(readLanguage(storage), 'en');
  saveLanguage('it', storage);
  assert.equal(readLanguage(storage), 'it');
  values.set('fable-language', 'fr');
  assert.equal(readLanguage(storage), 'it');
  assert.throws(() => saveLanguage('fr', storage));
  assert.equal(values.get('fable-language'), 'fr');
});

test('language preference reads safely when browser storage is unavailable', () => {
  assert.equal(readLanguage({ getItem() { throw new Error('Unavailable'); } }), 'it');
});

test('UI translations interpolate values without interpreting user content', async () => {
  const { translate } = await import('./translations.js');
  assert.equal(translate('en', 'La mia campagna'), 'My campaign');
  assert.equal(translate('it', 'La mia campagna'), 'La mia campagna');
  assert.equal(translate('en', 'Tavolo di {0}', 'Diario {1}'), "Diario {1}'s table");
  assert.equal(translate('en', '__proto__'), '__proto__');
  assert.equal(translate('en', 'Custom note'), 'Custom note');
  assert.equal(translate('en', 12), 12);
});
