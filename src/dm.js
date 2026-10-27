import { EDITIONS } from "./rules/catalog.js";
export const DM_KEY = "fable-dm";
export const CONDITIONS = [
  "Accecato",
  "Affascinato",
  "Afferrato",
  "Assordato",
  "Avvelenato",
  "Incapacitato",
  "Invisibile",
  "Paralizzato",
  "Pietrificato",
  "Prono",
  "Spaventato",
  "Stordito",
  "Trattenuto",
  "Privo di sensi",
  "Concentrazione",
];
export const uid = () => crypto.randomUUID();
export function combatant(
  name,
  kind = "enemy",
  maxHp = 7,
  ac = 15,
  initiativeBonus = 2,
) {
  return {
    id: uid(),
    name,
    kind,
    maxHp,
    hp: maxHp,
    ac,
    initiativeBonus,
    initiative: 0,
    conditions: [],
    notes: "",
    passive: 10,
  };
}
export function initialDM({ empty = false, editionId = "5e-2014" } = {}) {
  if (empty) return {
    title: "Sessione 1", objective: "", date: "", prep: "", secrets: "", recap: "", tasks: [], party: [],
    encounter: { name: "Primo incontro", editionId, members: [], activeId: null, round: 1, running: false },
  };
  const party = [
    combatant("Thalion", "player", 36, 16, 4),
    combatant("Elara", "player", 22, 12, 2),
    combatant("Gundren", "npc", 18, 12, 0),
  ];
  party[0].passive = 15;
  party[1].notes = "Studiosa delle rune. Vuole capire il simbolo della cripta.";
  party[2].notes = "Conosce la strada per la miniera. Ha bisogno del gruppo.";
  return {
    title: "Oltre la porta sigillata",
    objective:
      "Scoprire cosa si nasconde nella cripta e chi ha inciso il simbolo.",
    date: "",
    prep: "La porta porta lo stesso simbolo visto sulla mappa. Il rumore dell’acqua copre dei passi.\n\nSe il gruppo esita, Gundren riconosce l’incisione.",
    secrets:
      "Il custode conosce il nome di Elara. Non rivelarlo finché non vedono il suo volto.",
    recap: "",
    tasks: [
      {
        id: uid(),
        text: "Rileggere gli indizi della sessione precedente",
        done: true,
      },
      { id: uid(), text: "Preparare il primo incontro", done: false },
      {
        id: uid(),
        text: "Controllare il link Roll20 con il gruppo",
        done: false,
      },
    ],
    party,
    encounter: {
      name: "Imboscata alla cripta",
      editionId: "5e-2014",
      members: [
        { ...party[0], id: uid(), initiative: 17 },
        combatant("Goblin sentinella", "enemy"),
        combatant("Goblin arciere", "enemy"),
      ],
      activeId: null,
      round: 1,
      running: false,
    },
  };
}
export function sortMembers(members) {
  return [...members].sort((a, b) => b.initiative - a.initiative);
}
export function startEncounter(e) {
  const members = sortMembers(e.members);
  return {
    ...e,
    members,
    running: !!members.length,
    activeId: members[0]?.id ?? null,
    round: 1,
  };
}
export function advanceEncounter(e) {
  if (!e.running || !e.members.length) return e;
  const i = e.members.findIndex((m) => m.id === e.activeId);
  const next = (i + 1) % e.members.length;
  return {
    ...e,
    activeId: e.members[next].id,
    round: e.round + (next === 0 ? 1 : 0),
  };
}
export function removeMember(e, id) {
  const i = e.members.findIndex((m) => m.id === id);
  const members = e.members.filter((m) => m.id !== id);
  if (!members.length) return { ...e, members, activeId: null, running: false };
  const removedActive = e.activeId === id;
  return {
    ...e,
    members,
    activeId: removedActive ? members[i % members.length].id : e.activeId,
    round:
      e.round + (removedActive && e.running && i === members.length ? 1 : 0),
  };
}
export function changeHP(member, delta, editionId = "5e-2014") {
  return {
    ...member,
    hp: Math.min(
      member.maxHp,
      editionId === "3.5" || editionId === "4e"
        ? (delta > 0 && editionId === "4e"
            ? Math.max(0, member.hp)
            : member.hp) + delta
        : Math.max(0, member.hp + delta),
    ),
  };
}
export function parseDMSave(raw) {
  const d = JSON.parse(raw);
  for (const key of ["title", "objective", "date", "prep", "secrets", "recap"])
    if (typeof d?.[key] !== "string") throw Error("Sessione non valida");
  if (
    !Array.isArray(d.tasks) ||
    !d.tasks.every(
      (t) =>
        typeof t.id === "string" &&
        typeof t.text === "string" &&
        typeof t.done === "boolean",
    )
  )
    throw Error("Scaletta non valida");
  const valid = (m) =>
    m &&
    typeof m.id === "string" &&
    typeof m.name === "string" &&
    ["player", "npc", "enemy"].includes(m.kind) &&
    typeof m.notes === "string" &&
    (m.editionId === undefined || (typeof m.editionId === "string" && Object.hasOwn(EDITIONS, m.editionId))) &&
    (m.sourceCharacterId === undefined || typeof m.sourceCharacterId === "string") &&
    (m.sourceMemberId === undefined || typeof m.sourceMemberId === "string") &&
    Number.isFinite(m.passive) &&
    ["hp", "maxHp", "ac", "initiativeBonus", "initiative"].every((k) =>
      Number.isFinite(m[k]),
    ) &&
    m.maxHp > 0 &&
    m.hp >= -9999 &&
    m.hp <= m.maxHp &&
    Array.isArray(m.conditions) &&
    m.conditions.every((c) => CONDITIONS.includes(c));
  if (
    !Array.isArray(d.party) ||
    !d.party.every(valid) ||
    !d.encounter ||
    typeof d.encounter.name !== "string" ||
    !Array.isArray(d.encounter.members) ||
    !d.encounter.members.every(valid) ||
    !Number.isInteger(d.encounter.round) ||
    d.encounter.round < 1 ||
    typeof d.encounter.running !== "boolean"
  )
    throw Error("Incontro non valido");
  const ids = d.encounter.members.map((m) => m.id);
  if (new Set(ids).size !== ids.length) throw Error("Partecipanti duplicati");
  if (d.encounter.activeId !== null && !ids.includes(d.encounter.activeId))
    throw Error("Turno non valido");
  if (d.encounter.running && !ids.includes(d.encounter.activeId))
    throw Error("Turno non valido");
  if (!Object.hasOwn(EDITIONS, d.encounter.editionId || "5e-2014"))
    throw Error("Regolamento incontro non valido");
  if (
    d.encounterArchive !== undefined &&
    (!Array.isArray(d.encounterArchive) ||
      !d.encounterArchive.every(
        (en) =>
          en &&
          typeof en.name === "string" &&
          Object.hasOwn(EDITIONS, en.editionId || "5e-2014") &&
          Array.isArray(en.members) &&
          en.members.every(valid) &&
          Number.isInteger(en.round) &&
          en.round > 0 &&
          typeof en.running === "boolean" &&
          (en.activeId === null ||
            en.members.some((m) => m.id === en.activeId)),
      ))
  )
    throw Error("Archivio incontri non valido");
  return d;
}
