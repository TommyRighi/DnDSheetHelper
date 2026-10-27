import { parseCharacterSave } from './storage.js';
import { readCharacters, saveCharacter } from './rules/library.js';

export const ACTIVE_KEY = 'fable-character';
export const BACKUP_KEY = 'fable-character-backup';
export const RECOVERY_KEY = 'fable-character-unreadable';

export function loadCharacter(storage, fallback) {
  try {
    const raw = storage.getItem(ACTIVE_KEY);
    if (raw) {
      try { return { character: parseCharacterSave(raw), blocked: false }; }
      catch {
        let recovery = null;
        try { recovery = parseCharacterSave(storage.getItem(BACKUP_KEY)); } catch { /* Try archive next. */ }
        recovery ||= readCharacters(storage)[0];
        return { character: recovery || fallback, blocked: true };
      }
    }
    return { character: readCharacters(storage)[0] || fallback, blocked: false };
  } catch {
    return { character: fallback, blocked: true };
  }
}

export function persistCharacter(storage, character) {
  // Validate before touching either saved copy.
  parseCharacterSave(JSON.stringify(character));
  const previous = storage.getItem(ACTIVE_KEY);
  if (previous) {
    try {
      parseCharacterSave(previous);
    } catch {
      throw new Error('Ripristina prima il salvataggio non leggibile.');
    }
  }
  const characters = saveCharacter(storage, character);
  if (previous && previous !== JSON.stringify(character)) storage.setItem(BACKUP_KEY, previous);
  storage.setItem(ACTIVE_KEY, JSON.stringify(character));
  return characters;
}

export function recoverCharacter(storage, character) {
  parseCharacterSave(JSON.stringify(character));
  const raw = storage.getItem(ACTIVE_KEY);
  if (raw) storage.setItem(RECOVERY_KEY, raw);
  const characters = saveCharacter(storage, character);
  storage.setItem(ACTIVE_KEY, JSON.stringify(character));
  return characters;
}
