import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudConfig, inviteToken, inviteLink } from './cloud-config.js';
import { sharedCharacter, fingerprint, syncAction, readSyncLinks } from './cloud-sync.js';
import { createCharacter } from './rules/engine.js';
import { networkCsp } from '../scripts/pwa.js';
const character = () => createCharacter({ name: 'Lyra', editionId: '5e-2014', classId: 'fighter', stats: [15,14,13,12,10,8] });

test('cloud configuration admits public keys and rejects secrets and unsafe endpoints', () => {
  assert.equal(cloudConfig(), null);
  const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example' };
  assert.equal(cloudConfig(env).url, env.VITE_SUPABASE_URL);
  for (const url of ['http://example.com', 'https://u:p@example.com', 'https://example.com/a', 'javascript:alert(1)']) assert.throws(() => cloudConfig({ ...env, VITE_SUPABASE_URL: url }));
  assert.throws(() => cloudConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_example' }));
  const jwt = `header.${btoa(JSON.stringify({ role: 'service_role' }))}.signature`;
  assert.throws(() => cloudConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: jwt }));
  assert.match(networkCsp(env.VITE_SUPABASE_URL), /connect-src 'self' https:\/\/example.supabase.co wss:\/\/example.supabase.co/);
  assert.doesNotMatch(networkCsp(), /supabase/);
});

test('invitation links retain a relative deployment path and keep the token out of query parameters', () => {
  const token = 'a'.repeat(48);
  const url = inviteLink(token, 'https://example.test/fable/?view=campaign');
  assert.equal(new URL(url).pathname, '/fable/');
  assert.equal(new URL(url).searchParams.get('fable-invite'), null);
  assert.equal(inviteToken(url), token);
  assert.equal(inviteToken(token), token);
  for (const invalid of ['', 'abc', 'https://example.test/?fable-invite='+token, 'javascript:alert(1)']) assert.throws(() => inviteToken(invalid));
});

test('sync distinguishes new devices, safe pulls, pending uploads and conflicting edits', () => {
  const original = character();
  const link = { version: 1, fingerprint: fingerprint(original) };
  const remote = { version: 1, data: original };
  assert.equal(syncAction(original, remote, null), 'unlinked');
  assert.equal(syncAction(original, null, link), 'removed');
  assert.equal(syncAction(original, remote, link), 'adopt');
  const localEdit = { ...original, hp: original.hp - 2 };
  assert.equal(syncAction(localEdit, remote, link), 'push');
  const remoteEdit = { version: 2, data: { ...original, notes: 'Appunti dal telefono' } };
  assert.equal(syncAction(original, remoteEdit, link), 'pull');
  assert.equal(syncAction(localEdit, remoteEdit, link), 'conflict');
  assert.equal(syncAction(remoteEdit.data, remoteEdit, link), 'adopt');
  assert.deepEqual(readSyncLinks({ getItem: () => '{' }, 'key'), {});
});

test('shared characters retain written fields and reject invalid or oversized incoming saves', () => {
  const c = { ...character(), sheetDetails: { bonds: 'La mia famiglia' } };
  assert.equal(sharedCharacter(c).sheetDetails.bonds, 'La mia famiglia');
  assert.throws(() => sharedCharacter({ ...c, stats: [12] }));
  assert.throws(() => sharedCharacter({ ...c, notes: 'x'.repeat(300000) }));
});
