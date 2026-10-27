import { derive } from './rules/engine.js';
import { characterValues } from './table-rules.js';
import { combatant } from './dm.js';

export function snapshotCharacter(c) {
  const d = c.rules ? derive(c) : null;
  const values = d?.tableValues || characterValues(c);
  const m = combatant(c.name, 'player', values.maxHp, d?.ac ?? values.ac, d?.initiative ?? values.initiative);
  // Encounter snapshots use reference maxima; excess sheet values remain on the sheet.
  m.hp = Math.min(c.hp, m.maxHp);
  m.editionId = c.editionId || '5e-2014';
  m.sourceCharacterId = c.id;
  m.passive = d ? 10 + (d.skills.find(s => s.name === 'Percezione')?.value ?? d.mods[4]) : 10 + Math.floor((c.stats[4] - 10) / 2) + values.proficiency;
  return m;
}
export function refreshSnapshot(existing, source) {
  if (existing.editionId && source.editionId && existing.editionId !== source.editionId) throw new Error('Le copie usano regolamenti diversi.');
  return { ...source, id: existing.id, initiative: existing.initiative, conditions: [...existing.conditions], notes: existing.notes, sourceMemberId: existing.sourceMemberId };
}
