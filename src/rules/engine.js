import {
  customizeDerived,
  rulesFor,
  expiringEffects,
  recordRuleChange,
  applyRest,
} from "../table-rules.js";
import {
  ABILITIES,
  CLASSES,
  EDITIONS,
  FULL_SLOTS,
  LATEST_EDITION,
  SKILLS,
} from "./catalog.js";
export const mod = (n) => Math.floor((n - 10) / 2);
export const isFifth = (id) => id === "5e-2014" || id === "5.5-2024";
export const classFor = (c) =>
  CLASSES[c.editionId]?.find((k) => k.id === c.rules.classId);
export function spellSlots(c) {
  const k = classFor(c),
    l = c.level;
  if (!isFifth(c.editionId)) return [];
  if (k.caster === "pact")
    return [
      {
        level: Math.min(5, Math.ceil(l / 2)),
        max: l === 1 ? 1 : l < 11 ? 2 : l < 17 ? 3 : 4,
        pact: true,
      },
    ];
  let effective =
    k.caster === "full"
      ? l
      : k.caster === "half"
        ? c.editionId === "5.5-2024"
          ? Math.ceil(l / 2)
          : Math.floor(l / 2)
        : 0;
  return (FULL_SLOTS[effective] || []).map((max, i) => ({ level: i + 1, max }));
}
export function resourceDefinitions(c) {
  if (!isFifth(c.editionId)) return [];
  const id = c.rules.classId,
    l = c.level,
    modern = c.editionId === "5.5-2024",
    out = [];
  const add = (id, label, max, short = 0) =>
    out.push({ id, label, max, short });
  if (id === "barbarian")
    add(
      "rage",
      "Ira",
      l >= 17 ? 6 : l >= 12 ? 5 : l >= 6 ? 4 : l >= 3 ? 3 : 2,
      modern ? 1 : 0,
    );
  if (id === "fighter") {
    add(
      "second-wind",
      "Recuperare energie",
      modern ? (l >= 10 ? 4 : l >= 4 ? 3 : 2) : 1,
      modern ? 1 : "all",
    );
    if (l >= 2) add("action-surge", "Azione impetuosa", l >= 17 ? 2 : 1, "all");
  }
  if (id === "bard")
    add(
      "inspiration",
      "Ispirazione bardica",
      Math.max(1, mod(c.stats[5])),
      l >= 5 ? "all" : 0,
    );
  if (id === "monk" && l >= 2)
    add("focus", modern ? "Punti focus" : "Punti ki", l, "all");
  if (id === "sorcerer" && l >= 2) add("sorcery", "Punti stregoneria", l);
  if (id === "paladin")
    add("lay-hands", "Riserva imposizione delle mani", 5 * l);
  if (id === "ranger" && modern)
    add(
      "favored-enemy",
      "Marchio del cacciatore senza slot",
      l >= 17 ? 6 : l >= 13 ? 5 : l >= 9 ? 4 : l >= 5 ? 3 : 2,
    );
  if (id === "wizard") add("arcane-recovery", "Recupero arcano: usi", 1);
  return out;
}
export function derive(c, { applyOverrides = true } = {}) {
  const k = classFor(c);
  if (!k) throw Error("Classe non valida per questa edizione.");
  const a = c.stats.map(mod),
    r = c.rules,
    half = Math.floor(c.level / 2),
    fifth = isFifth(c.editionId);
  const proficiency = fifth ? 2 + Math.floor((c.level - 1) / 4) : 0;
  const dex = r.heavyArmor ? 0 : Math.min(a[1], r.dexCap ?? 99);
  const ac =
    c.editionId === "4e"
      ? 10 +
        half +
        r.armor +
        r.shield +
        (r.heavyArmor ? 0 : Math.max(a[1], a[3])) +
        r.acOther
      : 10 + r.armor + r.shield + dex + r.acOther;
  const bab = c.editionId === "3.5" ? Math.floor(c.level * k.bab) : 0;
  const saves =
    c.editionId === "3.5"
      ? ["Tempra", "Riflessi", "Volontà"].map((name, i) => ({
          name,
          value:
            a[[2, 1, 4][i]] +
            (k.saves.includes(i)
              ? 2 + Math.floor(c.level / 2)
              : Math.floor(c.level / 3)) +
            (r.saveOther[i] || 0),
        }))
      : c.editionId === "4e"
        ? ["Tempra", "Riflessi", "Volontà"].map((name, i) => ({
            name,
            value:
              10 +
              half +
              Math.max(a[[0, 1, 4][i]], a[[2, 3, 5][i]]) +
              k.defenses[i] +
              (i === 1 ? r.shield : 0) +
              (r.saveOther[i] || 0),
          }))
        : ABILITIES.map((name, i) => ({
            name,
            value:
              a[i] +
              (k.saves.includes(i) ? proficiency : 0) +
              (r.saveOther[i] || 0),
          }));
  const skillList = SKILLS[c.editionId].map(([name, ability]) => {
    const entry = r.skills[name] || {
      rank: 0,
      trained: false,
      expertise: false,
      other: 0,
    };
    return {
      name,
      ability,
      ...entry,
      value:
        a[ability] +
        (c.editionId === "3.5"
          ? entry.rank
          : c.editionId === "4e"
            ? half + (entry.trained ? 5 : 0)
            : entry.trained
              ? proficiency * (entry.expertise ? 2 : 1)
              : 0) +
        entry.other,
    };
  });
  const skillsPerLevel =
    c.editionId === "3.5" ? Math.max(1, k.skillPoints + a[3]) : 0;
  const result = {
    mods: a,
    proficiency,
    bab,
    ac,
    touchAC: 10 + dex + r.acOther,
    flatFootedAC: 10 + r.armor + r.shield + Math.min(0, dex) + r.acOther,
    saves,
    skills: skillList,
    initiative: a[1] + (c.editionId === "4e" ? half : 0) + r.initiativeOther,
    melee:
      a[0] +
      (fifth ? proficiency : c.editionId === "3.5" ? bab : half) +
      r.attackOther,
    ranged:
      a[1] +
      (fifth ? proficiency : c.editionId === "3.5" ? bab : half) +
      r.attackOther,
    iterative: bab
      ? Array.from(
          { length: Math.max(1, Math.ceil(bab / 5)) },
          (_, i) => bab - 5 * i,
        )
      : [],
    surgeValue: Math.floor(c.maxHp / 4),
    surgesMax: c.editionId === "4e" ? Math.max(0, k.surges + a[2]) : 0,
    bloodied: Math.floor(c.maxHp / 2),
    skillsPerLevel,
    skillPoints: c.editionId === "3.5" ? skillsPerLevel * (c.level + 3) : 0,
    slotPools: spellSlots(c),
    resources: resourceDefinitions(c),
    spellDC: fifth ? 8 + proficiency + a[k.castingAbility] : null,
    spellAttack: fifth ? proficiency + a[k.castingAbility] : null,
  };
  result.maxHp = c.maxHp;
  result.maxHitDice = c.level;
  result.speed = r.speed;
  result.checkBonus = 0;
  result.saveProficiencies = k.saves;
  return applyOverrides ? customizeDerived(c, result) : result;
}
export function createCharacter({
  name,
  editionId = LATEST_EDITION,
  classId = "fighter",
  stats = [15, 14, 13, 12, 10, 8],
  race = "",
  background = "",
  originNotes = "",
}) {
  if (
    !EDITIONS[editionId] ||
    !CLASSES[editionId].some((k) => k.id === classId) ||
    !name.trim() ||
    stats.length !== 6 ||
    !stats.every((n) => Number.isInteger(n) && n >= 1 && n <= 30)
  )
    throw Error("Controlla nome, classe e caratteristiche.");
  const k = CLASSES[editionId].find((k) => k.id === classId),
    maxHp =
      editionId === "4e"
        ? k.firstHp + stats[2]
        : Math.max(1, k.hitDie + mod(stats[2]));
  const c = {
    id: crypto.randomUUID(),
    schemaVersion: 2,
    rulesVersion: "core-0.1",
    editionId,
    name: name.trim(),
    surname: "",
    race,
    className: k.name,
    background,
    level: 1,
    hp: maxHp,
    maxHp,
    xp: 0,
    inspiration: false,
    slots: 0,
    hitDice: 1,
    notes: "",
    inventory: [],
    gold: 0,
    logs: [],
    conditions: [],
    stats,
    rules: {
      classId,
      armor: 0,
      shield: 0,
      heavyArmor: false,
      dexCap: 99,
      acOther: 0,
      initiativeOther: 0,
      attackOther: 0,
      saveOther: [0, 0, 0, 0, 0, 0],
      speed: 9,
      skills: {},
      originNotes,
      features: "",
      choices: "",
      slotUsed: {},
      resourceUsed: {},
      surges: 0,
      actionPoints: 1,
      secondWindUsed: false,
      exhaustion: 0,
      deathSuccess: 0,
      deathFailure: 0,
      tempHp: 0,
      usedActions: [],
      abilities: [],
      stable: false,
    },
  };
  c.rules.surges = derive(c).surgesMax;
  return c;
}
export function adjustHP(c, delta) {
  let rules = { ...c.rules };
  let hp = c.hp;
  if (delta < 0) {
    const absorbed = Math.min(rules.tempHp, -delta);
    rules.tempHp -= absorbed;
    delta += absorbed;
  }
  if (delta > 0 && c.editionId === "4e" && hp < 0) hp = 0;
  hp =
    delta > 0
      ? Math.max(hp, Math.min(derive(c).maxHp, hp + delta))
      : hp + delta;
  if (isFifth(c.editionId)) hp = Math.max(0, hp);
  if (isFifth(c.editionId) && c.hp === 0 && delta < 0)
    rules = {
      ...rules,
      stable: false,
      deathFailure: Math.min(3, rules.deathFailure + 1),
    };
  if (hp > 0)
    rules = { ...rules, deathSuccess: 0, deathFailure: 0, stable: false };
  return { ...c, hp, rules };
}
export function restCharacter(
  c,
  kind,
  { diceCount = 0, surges = 0, rollDie = () => 1, applyExpiry = true } = {},
) {
  const d = derive(c),
    r = {
      ...c.rules,
      slotUsed: { ...c.rules.slotUsed },
      resourceUsed: { ...c.rules.resourceUsed },
      usedActions: [],
    };
  let result = { ...c, rules: r };
  if (c.editionId === "3.5") {
    if (kind === "short")
      throw Error("In 3.5 il riposo breve non concede recuperi automatici.");
    if (c.hp <= -10 || (c.hp < 0 && !c.rules.stable))
      throw Error(
        "Non puoi recuperare naturalmente mentre sei morente o morto.",
      );
    result.hp = Math.max(c.hp, Math.min(d.maxHp, c.hp + c.level));
    r.abilities = r.abilities.map((p) =>
      p.recharge === "day" ? { ...p, used: 0 } : p,
    );
    return result;
  }
  if (c.editionId === "4e") {
    r.abilities = r.abilities.map((p) =>
      kind === "long" || p.recharge === "encounter" ? { ...p, used: 0 } : p,
    );
    r.secondWindUsed = false;
    if (kind === "long") {
      result.hp = Math.max(c.hp, d.maxHp);
      r.surges = d.surgesMax;
      r.actionPoints = 1;
      r.deathSuccess = 0;
      r.deathFailure = 0;
    } else {
      if (!Number.isInteger(surges) || surges < 0 || surges > r.surges)
        throw Error("Numero di impulsi non valido.");
      r.surges -= surges;
      if (surges)
        result.hp = Math.min(
          c.maxHp,
          Math.max(0, c.hp) + d.surgeValue * surges,
        );
    }
    return result;
  }
  if (kind === "long") {
    if (c.hp <= 0)
      throw Error("Il riposo lungo richiede almeno 1 PF all’inizio.");
    result.hp = Math.max(c.hp, d.maxHp);
    result.hitDice =
      c.editionId === "5.5-2024"
        ? c.level
        : Math.min(c.level, c.hitDice + Math.max(1, Math.floor(c.level / 2)));
    r.slotUsed = {};
    r.exhaustion = Math.max(0, r.exhaustion - 1);
    r.abilities = r.abilities.map((p) => ({ ...p, used: 0 }));
  } else {
    if (!Number.isInteger(diceCount) || diceCount < 0 || diceCount > c.hitDice)
      throw Error("Dadi vita non disponibili.");
    result.hp = Math.min(
      d.maxHp,
      c.hp +
        Array.from({ length: diceCount }, () =>
          Math.max(0, rollDie(classFor(c).hitDie) + mod(c.stats[2])),
        ).reduce((a, b) => a + b, 0),
    );
    result.hitDice -= diceCount;
    for (const p of d.slotPools) if (p.pact) delete r.slotUsed[p.level];
    r.abilities = r.abilities.map((p) =>
      p.recharge === "encounter" ? { ...p, used: 0 } : p,
    );
  }
  for (const res of d.resources) {
    if (kind === "long") r.resourceUsed[res.id] = 0;
    else if (res.short === "all") r.resourceUsed[res.id] = 0;
    else if (res.short)
      r.resourceUsed[res.id] = Math.max(
        0,
        (r.resourceUsed[res.id] || 0) - res.short,
      );
  }
  return result;
}
export function advanceLevel(c, dieResult) {
  if (c.level >= EDITIONS[c.editionId].maxLevel)
    throw Error("Livello massimo raggiunto.");
  const k = classFor(c);
  if (
    c.editionId !== "4e" &&
    (!Number.isInteger(dieResult) || dieResult < 1 || dieResult > k.hitDie)
  )
    throw Error("Risultato del dado vita non valido.");
  const gain =
    c.editionId === "4e"
      ? k.hpPerLevel
      : Math.max(1, dieResult + mod(c.stats[2]));
  return {
    ...c,
    level: c.level + 1,
    maxHp: c.maxHp + gain,
    hp: c.hp + gain,
    hitDice: c.hitDice + 1,
    rules: {
      ...c.rules,
      choices:
        c.rules.choices +
        `\nLivello ${c.level + 1}: verificare nuove scelte, capacità e requisiti sul manuale.`,
    },
  };
}
export function changeStats(c, stats) {
  const difference =
    c.editionId === "4e"
      ? stats[2] - c.stats[2]
      : (mod(stats[2]) - mod(c.stats[2])) * c.level;
  const maxHp = Math.max(1, c.maxHp + difference);
  return {
    ...c,
    stats,
    maxHp,
    hp: isFifth(c.editionId)
      ? Math.max(0, Math.min(maxHp, c.hp + difference))
      : Math.min(maxHp, c.hp + difference),
  };
}
export function rollDeathSave(c, n) {
  if (c.hp > 0 || c.rules.stable || c.rules.deathFailure >= 3)
    throw Error("Nessun tiro contro morte disponibile.");
  let next = { ...c, rules: { ...c.rules } };
  if (isFifth(c.editionId)) {
    if (n === 20)
      return {
        ...next,
        hp: 1,
        rules: { ...next.rules, deathSuccess: 0, deathFailure: 0 },
      };
    if (n >= 10) {
      next.rules.deathSuccess = Math.min(3, next.rules.deathSuccess + 1);
      next.rules.stable = next.rules.deathSuccess === 3;
    } else
      next.rules.deathFailure = Math.min(
        3,
        next.rules.deathFailure + (n === 1 ? 2 : 1),
      );
  } else if (c.editionId === "4e") {
    if (n >= 20 && next.rules.surges > 0) {
      next = adjustHP(next, Math.floor(c.maxHp / 4));
      next.rules.surges--;
    } else if (n < 10)
      next.rules.deathFailure = Math.min(3, next.rules.deathFailure + 1);
  } else if (n <= 10) next.rules.stable = true;
  else next.hp--;
  return next;
}

export function restWithExceptions(
  c,
  kind,
  { count = 0, options = {}, manual = false, rollDie = () => 1 } = {},
) {
  const long = kind === "long",
    before = derive(c),
    rules = rulesFor(c),
    expired = options.expire === false ? [] : expiringEffects(c, long);
  const prepared = {
    ...c,
    tableRules: {
      ...rules,
      effects: rules.effects.filter((e) => !expired.some((x) => x.id === e.id)),
    },
  };
  const after = derive(prepared),
    limit = after.tableValues.maxHp;
  let next;
  if (manual) {
    next = {
      ...prepared,
      hp: long ? Math.max(c.hp, limit) : c.hp,
      hitDice: long
        ? Math.max(c.hitDice, after.tableValues.maxHitDice)
        : c.hitDice,
      rules: {
        ...c.rules,
        slotUsed: long ? {} : { ...c.rules.slotUsed },
        usedActions: [],
      },
    };
  } else {
    next = restCharacter(prepared, kind, {
      diceCount: count,
      surges: count,
      rollDie,
      applyExpiry: false,
    });
    next.maxHp = c.maxHp;
  }
  next.hp = options.hp === false ? c.hp : Math.max(c.hp, next.hp);
  next.hitDice = long
    ? options.hitDice === false
      ? c.hitDice
      : Math.max(c.hitDice, next.hitDice)
    : next.hitDice;
  next.rules.slotUsed = { ...next.rules.slotUsed };
  for (const pool of after.slotPools) {
    const old = before.slotPools.find((p) => p.level === pool.level),
      available = (old?.max ?? 0) - (c.rules.slotUsed[pool.level] || 0);
    const recovered = pool.max - (next.rules.slotUsed[pool.level] || 0);
    next.rules.slotUsed[pool.level] =
      pool.max -
      (options.slots === false ? available : Math.max(available, recovered));
  }
  const tableRules = {
    ...prepared.tableRules,
    resources: rules.resources.map((r) =>
      options.resources !== false &&
      (r.recovery === "shortRest" || (long && r.recovery === "longRest"))
        ? { ...r, current: Math.max(r.current, r.max) }
        : r,
    ),
  };
  return recordRuleChange(
    next,
    { tableRules },
    `${long ? "Riposo lungo" : "Riposo breve"}${manual ? " con recupero manuale" : ""}: PF ${c.hp} → ${next.hp}.${expired.length ? ` Effetti rimossi: ${expired.map((e) => e.name).join(", ")}.` : ""}`,
  );
}
