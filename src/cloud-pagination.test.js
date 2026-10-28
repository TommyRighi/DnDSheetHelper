import test from 'node:test';
import assert from 'node:assert/strict';
import { allCloudRows } from './cloud-pagination.js';
test('fetches all 257 sheets across API pages', async () => {
  const records = Array.from({ length: 257 }, (_, id) => ({ id }));
  const calls = [];
  const result = await allCloudRows(async (from, to) => {
    calls.push([from, to]);
    return { data: records.slice(from, to + 1), error: null };
  });
  assert.deepEqual(result, records);
  assert.deepEqual(calls, [[0, 99], [100, 199], [200, 299]]);
});
test('does not return partial data when a subsequent page fails', async () => {
  const error = new Error('Offline');
  await assert.rejects(allCloudRows(async from => from ? { error } : { data: Array(100).fill({}) }), error);
});
