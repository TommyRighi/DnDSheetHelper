import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialDM,
  startEncounter,
  advanceEncounter,
  removeMember,
  changeHP,
  parseDMSave,
  sortMembers,
} from "./dm.js";
test("encounters sort initiative, keep ties stable and increment round only on wrap", () => {
  const e = initialDM().encounter;
  const started = startEncounter(e);
  assert.equal(started.activeId, e.members[0].id);
  let next = advanceEncounter(started);
  assert.equal(next.round, 1);
  next = advanceEncounter(next);
  assert.equal(next.round, 1);
  next = advanceEncounter(next);
  assert.equal(next.round, 2);
  assert.equal(next.activeId, started.activeId);
  assert.deepEqual(
    sortMembers(e.members).map((m) => m.id),
    e.members.map((m) => m.id),
  );
});
test("removing active member selects successor; removing final active wraps round", () => {
  let e = startEncounter(initialDM().encounter);
  const second = e.members[1].id;
  e = removeMember(e, e.activeId);
  assert.equal(e.activeId, second);
  assert.equal(e.round, 1);
  e = advanceEncounter(e);
  const first = e.members[0].id;
  e = removeMember(e, e.activeId);
  assert.equal(e.activeId, first);
  assert.equal(e.round, 2);
  e = removeMember(e, first);
  assert.equal(e.running, false);
  assert.equal(e.activeId, null);
});
test("HP is clamped and saved DM state validates after combat changes", () => {
  const d = initialDM();
  assert.equal(changeHP(d.party[0], -999).hp, 0);
  assert.equal(changeHP(d.party[0], 999).hp, d.party[0].maxHp);
  d.encounter = startEncounter(d.encounter);
  assert.deepEqual(parseDMSave(JSON.stringify(d)), d);
  assert.throws(() => parseDMSave("{}"));
  assert.throws(() =>
    parseDMSave(
      JSON.stringify({
        ...d,
        encounter: { ...d.encounter, activeId: "missing" },
      }),
    ),
  );
});

test("encounter edition determines negative HP and 4e healing from zero", () => {
  const member = { ...initialDM().encounter.members[0], hp: 2, maxHp: 36 };
  assert.equal(changeHP(member, -5, "3.5").hp, -3);
  assert.equal(changeHP(member, -5, "4e").hp, -3);
  assert.equal(changeHP(member, -5, "5e-2014").hp, 0);
  assert.equal(changeHP({ ...member, hp: -5 }, 7, "4e").hp, 7);
});
test("encounter archives retain their edition and malformed archives are rejected", () => {
  const data = initialDM();
  data.encounterArchive = [
    { ...data.encounter, editionId: "4e", members: [], activeId: null },
  ];
  assert.equal(
    parseDMSave(JSON.stringify(data)).encounterArchive[0].editionId,
    "4e",
  );
  assert.throws(() =>
    parseDMSave(
      JSON.stringify({ ...data, encounterArchive: [{ name: "Broken" }] }),
    ),
  );
});
