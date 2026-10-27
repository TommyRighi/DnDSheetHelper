export const SHEET_TEXT_FIELDS = {
  playerName: 100,
  alignment: 100,
  personalityTraits: 10000,
  ideals: 10000,
  bonds: 10000,
  flaws: 10000,
  proficiencies: 10000,
  features: 10000,
};

export function parseSheetDetails(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Dati della scheda non validi.');
  }
  const details = {};
  for (const [key, limit] of Object.entries(SHEET_TEXT_FIELDS)) {
    if (!Object.hasOwn(value, key)) continue;
    if (typeof value[key] !== 'string' || value[key].length > limit) {
      throw new Error('Dati della scheda non validi.');
    }
    details[key] = value[key];
  }
  return details;
}
