import { CLASSES } from './catalog.js';

// Suggestions are opt-in: keep the entered scores and only change their assignment.
export function priorityAbilities(editionId, classId) {
  const selected = CLASSES[editionId]?.find(c => c.id === classId);
  if (['full', 'pact'].includes(selected?.caster) && Number.isInteger(selected.castingAbility)) return [selected.castingAbility, 2, 1];
  if (['rogue', 'monk', 'ranger'].includes(classId)) return [1, 2, 4];
  return [0, 2, 1];
}
export function suggestScores(stats, editionId, classId) {
  const order = [...new Set([...priorityAbilities(editionId, classId), 0, 1, 2, 3, 4, 5])];
  const sorted = [...stats].sort((a, b) => b - a);
  const next = [...stats];
  order.forEach((ability, index) => { next[ability] = sorted[index]; });
  return next;
}
