import { parseCharacterSave } from './storage.js';
import { parseDMSave } from './dm.js';
import { validateCampaign } from './campaign.js';
import { EDITIONS } from './rules/catalog.js';
import { normalizeSessionUrl } from './session.js';

// Backups include game data and preferences, never recovery originals.
export const WORKSPACE_KEYS = ['fable-character', 'fable-character-library', 'fable-campaign', 'fable-dm', 'fable-session', 'fable-appearance', 'fable-language', 'fable-default-edition'];
export const MAX_WORKSPACE_BYTES = 5 * 1024 * 1024;
export function validateWorkspace(value) {
  if (!value || value.schemaVersion !== 1 || !value.data || typeof value.data !== 'object' || Array.isArray(value.data)) throw new Error('Backup Fable non valido.');
  if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_WORKSPACE_BYTES) throw new Error('Backup troppo grande. Limite 5 MB.');
  const data = {};
  for (const [key, raw] of Object.entries(value.data)) {
    if (!WORKSPACE_KEYS.includes(key) || typeof raw !== 'string') throw new Error('Il backup contiene dati non supportati.');
    if (key === 'fable-character') parseCharacterSave(raw);
    if (key === 'fable-character-library') {
      const characters = JSON.parse(raw);
      if (!Array.isArray(characters) || characters.length > 500) throw new Error('Archivio personaggi non valido.');
      characters.forEach(c => parseCharacterSave(JSON.stringify(c)));
    }
    if (key === 'fable-campaign') validateCampaign(JSON.parse(raw));
    if (key === 'fable-dm') parseDMSave(raw);
    if (key === 'fable-session') {
      const session = JSON.parse(raw);
      if (!session || typeof session.name !== 'string' || session.name.length > 100) throw new Error('Collegamento non valido.');
      normalizeSessionUrl(session.url);
    }
    if (key === 'fable-appearance') {
      const appearance = JSON.parse(raw);
      if (!appearance || !['light', 'dark'].includes(appearance.mode) || !/^#[\da-f]{6}$/i.test(appearance.accent)) throw new Error('Aspetto non valido.');
    }
    if (key === 'fable-language' && !['it', 'en'].includes(raw)) throw new Error('Lingua non valida.');
    if (key === 'fable-default-edition' && !Object.hasOwn(EDITIONS, raw)) throw new Error('Edizione preferita non valida.');
    data[key] = raw;
  }
  if (!data['fable-character'] && !data['fable-character-library'] && !data['fable-campaign'] && !data['fable-dm']) throw new Error('Il backup non contiene dati di gioco.');
  return { schemaVersion: 1, data };
}
export function exportWorkspace(storage) {
  return validateWorkspace({ schemaVersion: 1, data: Object.fromEntries(WORKSPACE_KEYS.flatMap(key => {
    const value = storage.getItem(key);
    return value === null ? [] : [[key, value]];
  })) });
}
export function restoreWorkspace(storage, input) {
  const next = validateWorkspace(input);
  const previous = Object.fromEntries(WORKSPACE_KEYS.map(key => [key, storage.getItem(key)]));
  // Keep a complete local recovery copy before replacing the workspace.
  storage.setItem('fable-workspace-before-restore', JSON.stringify({ schemaVersion: 1, data: Object.fromEntries(Object.entries(previous).filter(([, v]) => v !== null)) }));
  try {
    for (const key of WORKSPACE_KEYS) {
      if (next.data[key] === undefined) storage.removeItem(key);
      else storage.setItem(key, next.data[key]);
    }
  } catch (error) {
    for (const [key, value] of Object.entries(previous)) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* Recovery copy remains available. */ }
    }
    throw error;
  }
}
