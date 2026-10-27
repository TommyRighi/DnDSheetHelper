import { CLASSES, EDITIONS } from "./catalog.js";
const finite = (n, min = -9999, max = 99999) =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const mapNumbers = (o) =>
  o &&
  typeof o === "object" &&
  !Array.isArray(o) &&
  Object.values(o).every((n) => finite(n, -1e6, 1e6));
export function validateRules(data) {
  const r = data.rules;
  if (!r || !CLASSES[data.editionId]?.some((k) => k.id === r.classId))
    throw Error("Regolamento o classe non validi.");
  for (const k of [
    "armor",
    "shield",
    "dexCap",
    "acOther",
    "initiativeOther",
    "attackOther",
    "speed",
    "surges",
    "actionPoints",
    "exhaustion",
    "deathSuccess",
    "deathFailure",
    "tempHp",
  ])
    if (!finite(r[k])) throw Error(`Parametro non valido: ${k}`);
  if (
    !Number.isInteger(data.level) ||
    data.level > EDITIONS[data.editionId].maxLevel ||
    data.level < 1
  )
    throw Error("Livello non valido.");
  if (
    typeof r.heavyArmor !== "boolean" ||
    typeof r.secondWindUsed !== "boolean" ||
    typeof r.stable !== "boolean"
  )
    throw Error("Stato del personaggio non valido.");
  if (
    !Array.isArray(r.saveOther) ||
    r.saveOther.length !== 6 ||
    !r.saveOther.every((n) => finite(n))
  )
    throw Error("Salvezze non valide.");
  if (!mapNumbers(r.slotUsed) || !mapNumbers(r.resourceUsed))
    throw Error("Risorse non valide.");
  if (
    !r.skills ||
    typeof r.skills !== "object" ||
    Array.isArray(r.skills) ||
    !Object.values(r.skills).every(
      (s) =>
        s &&
        finite(s.rank, 0, 99) &&
        typeof s.trained === "boolean" &&
        typeof s.expertise === "boolean" &&
        finite(s.other),
    )
  )
    throw Error("Abilità non valide.");
  for (const k of ["originNotes", "features", "choices"])
    if (typeof r[k] !== "string") throw Error("Descrizione non valida.");
  if (
    !Array.isArray(r.usedActions) ||
    !r.usedActions.every((s) => typeof s === "string")
  )
    throw Error("Azioni non valide.");
  if (
    !Array.isArray(r.abilities) ||
    !r.abilities.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.description === "string" &&
        typeof p.formula === "string" &&
        ["atwill", "encounter", "day"].includes(p.recharge) &&
        Number.isInteger(p.max) &&
        p.max >= 1 &&
        p.max <= 999 &&
        Number.isInteger(p.used) &&
        p.used >= 0 &&
        p.used <= p.max,
    )
  )
    throw Error("Poteri o incantesimi non validi.");
  return r;
}
