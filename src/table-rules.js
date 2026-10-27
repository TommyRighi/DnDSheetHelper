export const targets = {
  ac: "Classe armatura",
  initiative: "Iniziativa",
  speed: "Velocità in metri",
  proficiency: "Bonus di competenza",
  attack: "Tiro per colpire con armi",
  damage: "Danni con armi",
  spellDc: "CD incantesimi",
  spellAttack: "Attacco magico",
  checks: "Bonus alle prove di caratteristica e abilità",
  maxHp: "PF massimi",
  maxSlots: "Slot massimi di 1° livello",
  maxHitDice: "Dadi vita massimi",
};
export const durations = {
  manual: "Fino alla rimozione manuale",
  shortRest: "Fino al prossimo riposo breve o lungo",
  longRest: "Fino al prossimo riposo lungo",
};
export const recoveryLabels = {
  manual: "Recupero manuale",
  shortRest: "Ogni riposo breve o lungo",
  longRest: "Riposo lungo",
};
const nonnegative = new Set(["ac", "speed", "maxSlots", "maxHitDice"]);
const finite = (n) =>
  typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1e6;
const text = (s, limit = 200) =>
  typeof s === "string" ? s.slice(0, limit) : "";
export function normalizeRules(raw) {
  const rules = raw && typeof raw === "object" ? raw : {};
  return {
    overrides: Object.fromEntries(
      Object.entries(rules.overrides || {})
        .filter(
          ([key, v]) =>
            Object.hasOwn(targets, key) &&
            v &&
            finite(v.value) &&
            (key !== "maxHp" || v.value >= 1) &&
            (!nonnegative.has(key) || v.value >= 0) &&
            (!["maxSlots", "maxHitDice"].includes(key) ||
              Number.isInteger(v.value)),
        )
        .map(([k, v]) => [k, { value: v.value, reason: text(v.reason) }]),
    ),
    effects: (Array.isArray(rules.effects) ? rules.effects : [])
      .filter(
        (e) =>
          e &&
          typeof e.id === "string" &&
          typeof e.name === "string" &&
          e.name.trim() &&
          Object.hasOwn(targets, e.target) &&
          finite(e.amount) &&
          Object.hasOwn(durations, e.duration),
      )
      .slice(0, 100)
      .map((e) => ({
        id: text(e.id),
        name: text(e.name, 80),
        target: e.target,
        amount: e.amount,
        duration: e.duration,
      })),
    resources: (Array.isArray(rules.resources) ? rules.resources : [])
      .filter(
        (r) =>
          r &&
          typeof r.id === "string" &&
          typeof r.name === "string" &&
          r.name.trim() &&
          finite(r.current) &&
          r.current >= 0 &&
          finite(r.max) &&
          r.max >= 0 &&
          Object.hasOwn(recoveryLabels, r.recovery),
      )
      .slice(0, 100)
      .map((r) => ({
        id: text(r.id),
        name: text(r.name, 80),
        current: r.current,
        max: r.max,
        recovery: r.recovery,
      })),
    history: (Array.isArray(rules.history) ? rules.history : [])
      .filter(
        (h) =>
          h && Number.isFinite(h.at) && h.at >= 0 && typeof h.text === "string",
      )
      .slice(0, 60)
      .map((h) => ({ at: h.at, text: text(h.text, 500) })),
  };
}
export const rulesFor = (c) => normalizeRules(c.tableRules);
export const modifier = (n) => Math.floor((n - 10) / 2);
export function characterValues(c, calculated = {}) {
  const rules = rulesFor(c);
  const p = 2 + Math.floor((c.level - 1) / 4);
  const dex = modifier(c.stats[1]),
    wis = modifier(c.stats[4]);
  const base = {
    ac: 12 + dex,
    initiative: dex,
    speed: c.race === "Elfo dei boschi" ? 10.5 : 9,
    proficiency: p,
    checks: 0,
    maxHp: c.maxHp,
    maxSlots: c.level < 2 ? 0 : c.level < 3 ? 2 : c.level < 5 ? 3 : 4,
    maxHitDice: c.level,
    ...Object.fromEntries(
      Object.entries(calculated).filter(
        ([key]) =>
          !["attack", "damage", "spellDc", "spellAttack"].includes(key),
      ),
    ),
  };
  const details = {};
  const resolve = (key, calculated) => {
    const override = rules.overrides[key];
    const effects = rules.effects.filter((e) => e.target === key);
    let value =
      (override?.value ?? calculated) +
      effects.reduce((s, e) => s + e.amount, 0);
    if (nonnegative.has(key)) value = Math.max(0, value);
    if (key === "maxHp") value = Math.max(1, value);
    if (["maxSlots", "maxHitDice"].includes(key)) value = Math.trunc(value);
    details[key] = { base: calculated, override, effects, value };
    return value;
  };
  const values = Object.fromEntries(
    Object.entries(base).map(([key, value]) => [key, resolve(key, value)]),
  );
  for (const [key, value] of Object.entries({
    attack: calculated.attack ?? dex + values.proficiency,
    damage: calculated.damage ?? dex,
    spellDc: calculated.spellDc ?? 8 + wis + values.proficiency,
    spellAttack: calculated.spellAttack ?? wis + values.proficiency,
  }))
    values[key] = resolve(key, value);
  return { ...values, details };
}
export function explainValue(detail, t = text => text) {
  const parts = [
    detail.override
      ? `${detail.override.value} ${t("manuale")}`
      : `${detail.base} ${t("base")}`,
  ];
  for (const effect of detail.effects)
    parts.push(
      `${effect.amount >= 0 ? "+" : ""}${effect.amount} ${effect.name}`,
    );
  return `${detail.value} = ${parts.join(" ")}${detail.override ? `. ${t("Calcolo base")} ${detail.base}.${detail.override.reason ? ` ${t("Motivo")}: ${detail.override.reason}.` : ""}` : ""}`;
}
export function recordRuleChange(c, changes, message) {
  const next = { ...c, ...changes };
  const rules = rulesFor(next);
  return {
    ...next,
    tableRules: {
      ...rules,
      history: [{ at: Date.now(), text: message }, ...rules.history].slice(
        0,
        60,
      ),
    },
  };
}
export const expiringEffects = (c, long) =>
  rulesFor(c).effects.filter(
    (e) => e.duration === "shortRest" || (long && e.duration === "longRest"),
  );
export function applyRest(
  c,
  {
    long,
    rolls = [],
    expire = true,
    hp = true,
    slots = true,
    hitDice = true,
    resources = true,
  },
) {
  if (rolls.length > c.hitDice)
    throw new Error(
      "Dadi vita insufficienti. Modifica prima la riserva dalle regole del tavolo.",
    );
  const rules = rulesFor(c);
  const expired = expire ? expiringEffects(c, long) : [];
  const tableRules = {
    ...rules,
    effects: rules.effects.filter((e) => !expired.some((x) => x.id === e.id)),
    resources: rules.resources.map((r) =>
      resources &&
      (r.recovery === "shortRest" || (long && r.recovery === "longRest"))
        ? { ...r, current: Math.max(r.current, r.max) }
        : r,
    ),
  };
  const next = { ...c, tableRules };
  const v = characterValues(next);
  const healing = rolls.reduce(
    (sum, n) => sum + Math.max(0, n + modifier(c.stats[2])),
    0,
  );
  next.hp = long
    ? hp
      ? Math.max(c.hp, v.maxHp)
      : c.hp
    : Math.max(c.hp, Math.min(v.maxHp, c.hp + healing));
  next.slots = long && slots ? Math.max(c.slots, v.maxSlots) : c.slots;
  next.hitDice =
    long && hitDice
      ? Math.max(c.hitDice, v.maxHitDice)
      : c.hitDice - rolls.length;
  const message = `${long ? "Riposo lungo" : "Riposo breve"}: PF ${c.hp} → ${next.hp}, slot ${c.slots} → ${next.slots}, dadi vita ${c.hitDice} → ${next.hitDice}.${rolls.length ? ` Dadi tirati: ${rolls.join(", ")}.` : ""}${expired.length ? ` Effetti rimossi: ${expired.map((e) => e.name).join(", ")}.` : ""}${resources ? " Applicati i recuperi delle risorse personalizzate." : ""}`;
  return recordRuleChange(next, {}, message);
}

export function customizeDerived(c, d) {
  const baseProficiency = d.proficiency;
  const r = rulesFor(c);
  const v = characterValues(c, {
    ac: d.ac,
    initiative: d.initiative,
    speed: c.rules.speed,
    proficiency: d.proficiency,
    maxSlots: d.slotPools.find((p) => p.level === 1)?.max ?? 0,
    attack: d.ranged,
    spellDc: d.spellDC ?? 0,
    spellAttack: d.spellAttack ?? 0,
  });
  const proficiencyDelta = v.proficiency - baseProficiency;
  const fifth = c.editionId.startsWith("5");
  // Changes to proficiency propagate unless an attack or magic value was explicitly replaced.
  for (const [key, original] of [
    ["attack", d.ranged],
    ["spellDc", d.spellDC],
    ["spellAttack", d.spellAttack],
  ]) {
    if (fifth && !r.overrides[key] && original !== null) {
      v[key] += proficiencyDelta;
      v.details[key].base += proficiencyDelta;
      v.details[key].value = v[key];
    }
  }
  const slotPools = d.slotPools.map((p) =>
    p.level === 1 ? { ...p, max: v.maxSlots } : p,
  );
  if (!slotPools.some((p) => p.level === 1) && v.maxSlots > 0)
    slotPools.unshift({ level: 1, max: v.maxSlots });
  return {
    ...d,
    maxHp: v.maxHp,
    maxHitDice: v.maxHitDice,
    speed: v.speed,
    checkBonus: v.checks,
    ac: v.ac,
    initiative: v.initiative,
    proficiency: v.proficiency,
    ranged: v.attack,
    melee: d.melee + v.attack - d.ranged,
    skills: d.skills.map((s) => ({
      ...s,
      value:
        s.value +
        v.checks +
        (fifth && s.trained ? proficiencyDelta * (s.expertise ? 2 : 1) : 0),
    })),
    saves: d.saves.map((s, i) => ({
      ...s,
      value:
        s.value +
        (fifth && d.saveProficiencies?.includes(i) ? proficiencyDelta : 0),
    })),
    spellDC:
      d.spellDC === null &&
      !r.overrides.spellDc &&
      !r.effects.some((e) => e.target === "spellDc")
        ? null
        : v.spellDc,
    spellAttack: v.spellAttack,
    slotPools,
    tableValues: v,
    surgeValue: Math.floor(v.maxHp / 4),
    bloodied: Math.floor(v.maxHp / 2),
  };
}
