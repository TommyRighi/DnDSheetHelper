import { parseCharacterSave } from "../storage.js";
export const LIBRARY_KEY = "fable-character-library";
export function readCharacters(storage) {
  try {
    const raw = JSON.parse(storage.getItem(LIBRARY_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((value) => {
      try {
        return [parseCharacterSave(JSON.stringify(value))];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
export function saveCharacter(storage, c) {
  parseCharacterSave(JSON.stringify(c));
  const characters = readCharacters(storage);
  const next = [c, ...characters.filter((x) => x.id !== c.id)];
  storage.setItem(LIBRARY_KEY, JSON.stringify(next));
  return next;
}
