import { parseSheetDetails } from './sheet-details.js';
import { normalizeRules } from "./table-rules.js";
import { EDITIONS } from "./rules/catalog.js";
import { validateRules } from "./rules/validation.js";
// Keep the save format independent of the UI so a desktop shell can reuse it.
const numericFields = [
  "hp",
  "maxHp",
  "level",
  "xp",
  "slots",
  "hitDice",
  "gold",
];
const stringFields = ["name", "surname", "race", "className", "notes"];
export function parseCharacterSave(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object")
    throw new Error("Salvataggio non valido");
  const editionId = data.editionId || "5e-2014";
  if (!EDITIONS[editionId]) throw new Error("Edizione sconosciuta.");
  const rules = data.rules ? validateRules({ ...data, editionId }) : null;
  if (!rules && editionId !== "5e-2014")
    throw new Error("Questa edizione richiede i dati del proprio regolamento.");
  if (data.schemaVersion && data.schemaVersion > 2)
    throw new Error("Il salvataggio usa una versione più recente dell’app.");
  for (const key of numericFields) {
    if (
      !Number.isFinite(data[key]) ||
      data[key] <
        (key === "hp" && rules && !editionId.startsWith("5") ? -9999 : 0)
    )
      throw new Error(`Valore non valido: ${key}`);
  }
  for (const key of stringFields) {
    if (typeof data[key] !== "string")
      throw new Error(`Testo non valido: ${key}`);
  }
  if (
    !data.name.trim() ||
    data.name.length > 35 ||
    data.surname.length > 45 ||
    data.maxHp < 1 ||
    data.level < 1 ||
    data.level > EDITIONS[editionId].maxLevel ||
    !Number.isInteger(data.level)
  )
    throw new Error("Personaggio non valido");
  if (
    !Array.isArray(data.stats) ||
    data.stats.length !== 6 ||
    !data.stats.every((n) => Number.isInteger(n) && n >= 1 && n <= 1000)
  )
    throw new Error("Caratteristiche non valide");
  if (!Array.isArray(data.inventory) || data.inventory.length > 500)
    throw new Error("Inventario non valido");
  for (const item of data.inventory) {
    if (
      !item ||
      typeof item.name !== "string" ||
      typeof item.detail !== "string" ||
      !Number.isInteger(item.qty) ||
      item.qty < 0 ||
      !Number.isFinite(item.weight) ||
      item.weight < 0
    )
      throw new Error("Oggetto non valido");
  }
  return {
    id: typeof data.id === "string" ? data.id : crypto.randomUUID(),
    editionId,
    schemaVersion: 2,
    rulesVersion: rules ? "core-0.1" : "legacy-demo",
    ...(rules ? { rules } : {}),
    sheetDetails: parseSheetDetails(data.sheetDetails),
    background: typeof data.background === "string" ? data.background : "",
    ...Object.fromEntries(
      [...numericFields, ...stringFields].map((key) => [key, data[key]]),
    ),
    hp: data.hp,
    slots: data.slots,
    hitDice: data.hitDice,
    tableRules: normalizeRules(data.tableRules),
    inspiration: data.inspiration === true,
    stats: data.stats,
    inventory: data.inventory.map((i) => ({
      name: i.name,
      detail: i.detail,
      qty: i.qty,
      weight: i.weight,
      equipped: i.equipped === true,
    })),
    logs: Array.isArray(data.logs)
      ? data.logs
          .filter(
            (l) =>
              l &&
              typeof l.label === "string" &&
              Number.isFinite(l.total) &&
              Number.isFinite(l.sides) &&
              Number.isFinite(l.bonus) &&
              Number.isFinite(l.id) &&
              Array.isArray(l.values) &&
              l.values.every(Number.isFinite),
          )
          .slice(0, 15)
          .map((l) => ({
            ...l,
            expression:
              typeof l.expression === "string"
                ? l.expression.slice(0, 120)
                : undefined,
          }))
      : [],
    conditions: [],
  };
}
