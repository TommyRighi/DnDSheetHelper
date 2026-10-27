import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestScores } from './rules/creation-guidance.js';
test('opt-in class assignment preserves entered scores and prioritizes the casting ability', () => {
  const stats = [15, 14, 13, 12, 10, 8];
  const result = suggestScores(stats, '5.5-2024', 'cleric');
  assert.equal(result[4], 15);
  assert.deepEqual([...result].sort((a,b) => a-b), [...stats].sort((a,b) => a-b));
  assert.deepEqual(stats, [15, 14, 13, 12, 10, 8]);
});
