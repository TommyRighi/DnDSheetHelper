import { parseCharacterSave } from './storage.js';

export function sharedCharacter(value) {
  const character = parseCharacterSave(JSON.stringify(value));
  if (new TextEncoder().encode(JSON.stringify(character)).length > 240000) throw new Error('Scheda troppo grande per la condivisione.');
  return character;
}
export const fingerprint = value => JSON.stringify(sharedCharacter(value));
export function syncAction(local, remote, link) {
  if (!link) return 'unlinked';
  if (!remote) return 'removed';
  const localText = fingerprint(local);
  if (localText === fingerprint(remote.data)) return 'adopt';
  if (remote.version !== link.version) return localText === link.fingerprint ? 'pull' : 'conflict';
  return localText === link.fingerprint ? 'synced' : 'push';
}
export function readSyncLinks(storage, key) {
  try {
    const raw = JSON.parse(storage.getItem(key) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => v && Number.isSafeInteger(v.version) && v.version > 0 && typeof v.fingerprint === 'string'));
  } catch { return {}; }
}
