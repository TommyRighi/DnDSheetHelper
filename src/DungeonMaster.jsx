import { useTranslation } from './i18n.jsx';
import { EDITIONS, LATEST_EDITION } from "./rules/catalog.js";
import { snapshotCharacter, refreshSnapshot } from "./dm-snapshots.js";
import React, { useEffect, useState, useRef } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  Dice5,
  Flag,
  Flame,
  Heart,
  Link,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Sword,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import {
  DM_KEY,
  CONDITIONS,
  uid,
  combatant,
  initialDM,
  parseDMSave,
  sortMembers,
  startEncounter,
  advanceEncounter,
  removeMember,
  changeHP,
} from "./dm.js";
import "./dm.css";
const number = (value, min, max) =>
  Math.min(max, Math.max(min, Math.trunc(Number(value) || 0)));
const kindLabels = { player: "Personaggio", npc: "PNG", enemy: "Avversario" };
export default function DungeonMaster({ character, campaign, onDice, onSession }) {
  const translateUi = useTranslation();
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(DM_KEY);
      return raw ? parseDMSave(raw) : initialDM(campaign ? { empty: true, editionId: campaign.editionId } : {});
    } catch {
      return initialDM();
    }
  });
  const [tab, setTab] = useState(() => {
    try { const saved = localStorage.getItem("fable-dm-tab"); return ["Sessione", "Incontro", "Gruppo e PNG"].includes(saved) ? saved : "Sessione"; } catch { return "Sessione"; }
  }),
    [newTask, setNewTask] = useState(""),
    [adding, setAdding] = useState(false),
    [draft, setDraft] = useState({
      name: "",
      kind: "enemy",
      maxHp: 7,
      ac: 15,
      initiativeBonus: 2,
    }),
    [amount, setAmount] = useState(5),
    [previous, setPrevious] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(DM_KEY, JSON.stringify(data));
      setError("");
    } catch {
      setError(
        translateUi("Salvataggio non riuscito. Esporta una copia prima di chiudere la pagina."),
      );
    }
  }, [data]);
  const [pendingCopy, setPendingCopy] = useState(null);
  const memberNameRef = useRef();
  useEffect(() => { try { localStorage.setItem("fable-dm-tab", tab); } catch { /* Optional preference. */ } }, [tab]);
  useEffect(() => {
    if (!adding) return;
    const previousFocus = document.activeElement;
    memberNameRef.current?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = oldOverflow; previousFocus?.focus(); };
  }, [adding]);
  const update = (p) => setData((d) => ({ ...d, ...p }));
  const encounter = data.encounter;
  const setEncounter = (fn) => {
    setPrevious(encounter);
    setData((d) => ({
      ...d,
      encounter: typeof fn === "function" ? fn(d.encounter) : fn,
    }));
  };
  const editMember = (id, fn) =>
    setEncounter((e) => ({
      ...e,
      members: e.members.map((m) => (m.id === id ? fn(m) : m)),
    }));
  const copyMember = (m) => {
    if ((m.editionId || "5e-2014") !== (encounter.editionId || "5e-2014")) {
      setMessage(
        translateUi("Il partecipante appartiene a un’altra edizione. Crea un incontro nel suo regolamento o ricostruisci i valori manualmente."),
      );
      return;
    }
    if (encounter.members.some(member => member.sourceMemberId === m.id)) {
      setMessage(translateUi("{0} è già nell’incontro. Usa Aggiorna dall’archivio sulla sua riga.", m.name));
      return;
    }
    setEncounter((e) => ({
      ...e,
      members: [
        ...e.members,
        { ...m, id: uid(), sourceMemberId: m.id, conditions: [...m.conditions] },
      ],
    }));
    setMessage(
      translateUi("{0} aggiunto all’incontro. I valori sono una copia indipendente.", m.name),
    );
  };
  const rollInitiatives = () =>
    setEncounter((e) => ({
      ...e,
      members: sortMembers(
        e.members.map((m) => {
          const r = new Uint32Array(1);
          crypto.getRandomValues(r);
          return { ...m, initiative: (r[0] % 20) + 1 + m.initiativeBonus };
        }),
      ),
    }));
  const exportData = () => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    a.href = url;
    a.download = "fable-dungeon-master.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const active = encounter.members.find((m) => m.id === encounter.activeId);
  return (
    <section className="dm-console" aria-label={translateUi("Console Dungeon Master")}>
      <div className="dm-command">
        <div className="dm-insignia">
          <Shield size={28} />
        </div>
        <div>
          <div className="eyebrow">{translateUi("DIETRO LO SCHERMO")}</div>
          <h2>{translateUi("Prepara e conduci la sessione")}</h2>
          <p>
            {campaign ? `${campaign.name} · ${EDITIONS[campaign.editionId].label}` : translateUi("Nessuna campagna.")}
          </p>
        </div>
        <div className="dm-command-actions">
          <button className="button secondary" onClick={onSession}>
            <Link size={14} />{translateUi("Tavolo online")}{" "}</button>
          <button className="button secondary" onClick={exportData}>
            <ArrowDown size={14} />{translateUi("Esporta console")}{" "}</button>
        </div>
      </div>
      <div className="dm-summary">
        <span>
          <Users size={16} />
          <strong>
            {data.party.filter((m) => m.kind === "player").length}
          </strong>{" "}{" "}{translateUi("personaggi")}{" "}</span>
        <span>
          <Sword size={16} />
          <strong>{encounter.members.length}</strong>{translateUi("partecipanti")}{" "}</span>
        <span>
          <Flag size={16} />
          {encounter.running ? translateUi("Round {0} · {1}", encounter.round, active?.name || "—") : translateUi("Incontro in preparazione")}
        </span>
        <span className="dm-local">
          <span />{translateUi("Dati DM locali")}{" "}</span>
      </div>
      <div
        className="dm-tabs"
        role="tablist"
        aria-label={translateUi("Sezioni del Dungeon Master")}
        onKeyDown={(e) => {
          const names = ["Sessione", "Incontro", "Gruppo e PNG"];
          const index = names.indexOf(tab);
          let next;
          if (e.key === "ArrowRight") next = names[(index + 1) % names.length];
          if (e.key === "ArrowLeft")
            next = names[(index + names.length - 1) % names.length];
          if (e.key === "Home") next = names[0];
          if (e.key === "End") next = names[2];
          if (next && e.target.getAttribute("role") === "tab") {
            e.preventDefault();
            setTab(next);
            setPendingCopy(null);
            setAdding(false);
            setMessage("");
            document.getElementById(`dm-tab-${next.split(" ")[0]}`)?.focus();
          }
        }}
      >
        {[
          ["Sessione", ClipboardList],
          ["Incontro", Sword],
          ["Gruppo e PNG", Users],
        ].map(([name, Icon]) => (
          <button
            key={name}
            role="tab"
            id={`dm-tab-${name.split(" ")[0]}`}
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            aria-controls="dm-content"
            className={tab === name ? "active" : ""}
            onClick={() => {
              setTab(name);
              setPendingCopy(null);
              setAdding(false);
              setMessage("");
            }}
          >
            <Icon size={16} />
            {translateUi(name)}
          </button>
        ))}
        <button className="dm-dice-button" onClick={onDice}>
          <Dice5 size={16} />{translateUi("Dadi")}{" "}</button>
      </div>
      {error && (
        <p role="alert" className="session-error">
          {translateUi(error)}
        </p>
      )}
      {message && (
        <p className="dm-message" role="status">
          <Check size={14} />
          {translateUi(message)}
          <button aria-label={translateUi("Chiudi messaggio")} onClick={() => setMessage("")}>{translateUi("×")}{" "}</button>
        </p>
      )}
      <div
        id="dm-content"
        role="tabpanel"
        aria-labelledby={`dm-tab-${tab.split(" ")[0]}`}
      >
        {tab === "Sessione" && (
          <div className="dm-prep-grid">
            <div className="dm-main-column">
              <section className="panel dm-editor">
                <div className="panel-heading">
                  <h3>{translateUi("La prossima sessione")}</h3>
                  <span className="pill">{translateUi("Preparazione")}</span>
                </div>
                <label className="field">{translateUi("Titolo")}{" "}<input
                    maxLength={100}
                    value={data.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </label>
                <div className="dm-session-fields">
                  <label className="field">{translateUi("Obiettivo della sessione")}{" "}<input
                      maxLength={240}
                      value={data.objective}
                      onChange={(e) => update({ objective: e.target.value })}
                    />
                  </label>
                  <label className="field">{translateUi("Data e ora")}{" "}<input
                      type="datetime-local"
                      value={data.date}
                      onChange={(e) => update({ date: e.target.value })}
                    />
                  </label>
                </div>
                <label className="field">{translateUi("Scaletta, scene e indizi")}{" "}<textarea
                    value={data.prep}
                    onChange={(e) => update({ prep: e.target.value })}
                    placeholder={translateUi("Apertura, luoghi, indizi, possibili sviluppi…")}
                  />
                </label>
              </section>
              <section className="panel dm-editor">
                <div className="panel-heading">
                  <h3>{translateUi("Dopo l’avventura")}</h3>
                  <Flag size={18} />
                </div>
                <label className="field">{translateUi("Riepilogo e prossimi passi")}{" "}<textarea
                    value={data.recap}
                    onChange={(e) => update({ recap: e.target.value })}
                    placeholder={translateUi("Decisioni del gruppo, promesse, ricompense assegnate e cosa preparare…")}
                  />
                </label>
              </section>
            </div>
            <aside className="dm-side-column">
              <section className="panel dm-checklist">
                <div className="panel-heading">
                  <h3>{translateUi("Prima di iniziare")}</h3>
                  <span className="subtle">
                    {data.tasks.filter((t) => t.done).length}/
                    {data.tasks.length}
                  </span>
                </div>
                {data.tasks.map((t) => (
                  <div className="dm-task" key={t.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() =>
                          update({
                            tasks: data.tasks.map((task) =>
                              task.id === t.id
                                ? { ...task, done: !task.done }
                                : task,
                            ),
                          })
                        }
                      />
                      <span>{t.text}</span>
                    </label>
                    <button
                      className="icon-button"
                      aria-label={translateUi("Rimuovi promemoria {0}", t.text)}
                      onClick={() =>
                        update({
                          tasks: data.tasks.filter((task) => task.id !== t.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <form
                  className="dm-add-task"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newTask.trim()) {
                      update({
                        tasks: [
                          ...data.tasks,
                          { id: uid(), text: newTask.trim(), done: false },
                        ],
                      });
                      setNewTask("");
                    }
                  }}
                >
                  <input
                    aria-label={translateUi("Nuovo promemoria")}
                    maxLength={160}
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder={translateUi("Aggiungi un promemoria…")}
                  />
                  <button
                    className="icon-button"
                    aria-label={translateUi("Aggiungi promemoria")}
                  >
                    <Plus size={16} />
                  </button>
                </form>
              </section>
              <section className="panel dm-editor dm-secrets">
                <div className="panel-heading">
                  <h3>{translateUi("Solo per il master")}</h3>
                  <Sparkles size={18} />
                </div>
                <p>{translateUi("Note del DM, salvate in locale.")}{" "}</p>
                <label className="field">{translateUi("Segreti, motivazioni e conseguenze")}{" "}<textarea
                    value={data.secrets}
                    onChange={(e) => update({ secrets: e.target.value })}
                  />
                </label>
              </section>
              <div className="dm-note">
                <Shield size={17} />
                <p>{translateUi("La modalità DM non protegge i dati con permessi. Le note sono escluse dalla stampa della scheda.")}{" "}</p>
              </div>
            </aside>
          </div>
        )}
        {tab === "Incontro" && (
          <section className="panel dm-encounter">
            <div className="dm-encounter-archive">
              <label className="field">{translateUi("Regolamento dell’incontro")}{" "}<select
                  value={encounter.editionId || "5e-2014"}
                  disabled={encounter.members.length > 0 || encounter.running}
                  onChange={(e) =>
                    setEncounter((en) => ({ ...en, editionId: e.target.value }))
                  }
                >
                  {Object.values(EDITIONS).map((e) => (
                    <option key={e.id} value={e.id}>
                      {translateUi(e.label)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button secondary"
                onClick={() => {
                  setPrevious(null);
                  update({
                    encounterArchive: [
                      encounter,
                      ...(data.encounterArchive || []),
                    ],
                    encounter: {
                      name: "Nuovo incontro",
                      editionId: campaign?.editionId || encounter.editionId || character.editionId || LATEST_EDITION,
                      members: [],
                      activeId: null,
                      round: 1,
                      running: false,
                    },
                  });
                  setMessage(
                    translateUi("Incontro precedente conservato nell’archivio. Scegli l’edizione prima di aggiungere partecipanti."),
                  );
                }}
              >{translateUi("Archivia e crea un incontro")}{" "}</button>
              {!!data.encounterArchive?.length && (
                <label className="field">{translateUi("Riprendi un incontro archiviato")}{" "}<select
                    value=""
                    onChange={(e) => {
                      const index = Number(e.target.value);
                      if (e.target.value === "") return;
                      const restored = data.encounterArchive[index];
                      setPrevious(null);
                      update({
                        encounter: restored,
                        encounterArchive: [
                          encounter,
                          ...data.encounterArchive.filter(
                            (_, i) => i !== index,
                          ),
                        ],
                      });
                    }}
                  >
                    <option value="">{translateUi("Scegli incontro…")}</option>
                    {data.encounterArchive.map((en, i) => (
                      <option key={i} value={i}>
                        {en.name} · {translateUi(EDITIONS[en.editionId || "5e-2014"].label)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="dm-encounter-heading">
              <div>
                <div className="eyebrow">{translateUi("IL RITMO DEL COMBATTIMENTO")}</div>
                <label className="field">{translateUi("Nome dell’incontro")}{" "}<input
                    maxLength={100}
                    value={encounter.name}
                    onChange={(e) =>
                      setEncounter((en) => ({ ...en, name: e.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="dm-round">
                <span>{translateUi("ROUND")}</span>
                <strong>{translateUi(encounter.round)}</strong>
              </div>
            </div>
            <div className="dm-combat-controls">
              <button
                className="button secondary"
                onClick={rollInitiatives}
                disabled={!encounter.members.length}
              >
                <Dice5 size={14} />{translateUi("Tira iniziative")}{" "}</button>
              <button
                className="button secondary"
                onClick={() =>
                  setEncounter((e) => ({
                    ...e,
                    members: sortMembers(e.members),
                  }))
                }
                disabled={!encounter.members.length}
              >{translateUi("Ordina")}{" "}</button>
              {encounter.running ? (
                <>
                  <button
                    className="button primary"
                    onClick={() => setEncounter(advanceEncounter)}
                  >{translateUi("Prossimo turno")}{" "}<ArrowRight size={15} />
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      setEncounter((e) => ({ ...e, running: false }))
                    }
                  >{translateUi("Termina incontro")}{" "}</button>
                </>
              ) : (
                <button
                  className="button primary"
                  disabled={!encounter.members.length}
                  onClick={() => setEncounter(startEncounter)}
                >
                  <Flame size={14} />{translateUi("Inizia incontro")}{" "}</button>
              )}
              <button
                className="button secondary"
                disabled={!previous}
                onClick={() => {
                  update({ encounter: previous });
                  setPrevious(null);
                }}
              >
                <Undo2 size={14} />{translateUi("Annulla")}{" "}</button>
            </div>
            {encounter.running && (
              <div className="dm-current-turn">
                <span className="live-dot" />{translateUi("Tocca a")}{" "}
                <strong>{active?.name}</strong>
                <span>{translateUi("Dopo l’ultimo partecipante comincia il round successivo.")}{" "}</span>
              </div>
            )}
            <div className="dm-hp-controls">
              <label className="field">{translateUi("Danni / guarigione")}{" "}<input
                  type="number"
                  min="1"
                  max="9999"
                  value={amount}
                  onChange={(e) => setAmount(number(e.target.value, 1, 9999))}
                />
              </label>
              <p>{translateUi("A 0 PF il partecipante resta nell’ordine dei turni.")}{" "}</p>
            </div>
            <div className="dm-combat-list">
              {encounter.members.map((m) => (
                <article
                  className={`dm-combatant ${encounter.running && encounter.activeId === m.id ? "is-current" : ""} ${m.hp <= 0 ? "is-down" : ""}`}
                  key={m.id}
                >
                  {m.sourceMemberId && data.party.some(p => p.id === m.sourceMemberId) && <button className="button secondary dm-refresh-copy" onClick={() => {
                    const source = data.party.find(p => p.id === m.sourceMemberId);
                    try { const refreshed = refreshSnapshot(m, source); editMember(m.id, () => refreshed); setMessage(translateUi("{0}: PF e statistiche aggiornati dall’archivio.", m.name)); } catch (err) { setMessage(err.message); }
                  }}>{translateUi("Aggiorna dall’archivio")}</button>}
                  <div className="dm-combatant-main">
                    <label className="dm-initiative">{translateUi("INI")}{" "}<input
                        aria-label={translateUi("Iniziativa {0}", m.name)}
                        type="number"
                        min="-99"
                        max="99"
                        value={m.initiative}
                        onChange={(e) =>
                          editMember(m.id, (member) => ({
                            ...member,
                            initiative: number(e.target.value, -99, 99),
                          }))
                        }
                      />
                    </label>
                    <div className="dm-combatant-name">
                      <h4>{m.name}</h4>
                      <small>
                        {translateUi(kindLabels[m.kind])}{" "}{translateUi("· CA")}{" "}{m.ac}
                        {m.hp <= 0 ? translateUi(" · A terra") : ""}
                      </small>
                      <div className="dm-hp-track">
                        <i
                          style={{
                            width: `${Math.max(0, (m.hp / m.maxHp) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="dm-hp-value">
                      <Heart size={13} />
                      <strong>{m.hp}</strong>
                      <span>/ {m.maxHp}</span>
                    </div>
                    <div className="dm-hp-buttons">
                      <button
                        aria-label={translateUi("Danneggia {0}", m.name)}
                        onClick={() =>
                          editMember(m.id, (member) =>
                            changeHP(member, -amount, encounter.editionId),
                          )
                        }
                      >{translateUi("− PF")}{" "}</button>
                      <button
                        aria-label={translateUi("Guarisci {0}", m.name)}
                        onClick={() =>
                          editMember(m.id, (member) =>
                            changeHP(member, amount, encounter.editionId),
                          )
                        }
                      >{translateUi("+ PF")}{" "}</button>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={translateUi("Rimuovi dal combattimento {0}", m.name)}
                      onClick={() => setEncounter((e) => removeMember(e, m.id))}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="dm-condition-row">
                    {m.conditions.map((c) => (
                      <button
                        key={c}
                        onClick={() =>
                          editMember(m.id, (member) => ({
                            ...member,
                            conditions: member.conditions.filter(
                              (x) => x !== c,
                            ),
                          }))
                        }
                      >
                        {translateUi(c)}{translateUi("×")}{" "}</button>
                    ))}
                    <select
                      aria-label={translateUi("Aggiungi condizione a {0}", m.name)}
                      value=""
                      onChange={(e) => {
                        const condition = e.target.value;
                        if (condition)
                          editMember(m.id, (member) => ({
                            ...member,
                            conditions: [
                              ...new Set([...member.conditions, condition]),
                            ],
                          }));
                      }}
                    >
                      <option value="">{translateUi("+ Condizione")}</option>
                      {CONDITIONS.filter((c) => !m.conditions.includes(c)).map(
                        (c) => (
                          <option key={c}>{translateUi(c)}</option>
                        ),
                      )}
                    </select>
                  </div>
                </article>
              ))}
              {!encounter.members.length && (
                <div className="empty">{translateUi("Nessun partecipante. Aggiungi qualcuno dal gruppo o crea un avversario.")}{" "}</div>
              )}
            </div>
            <div className="dm-add-combatant">
              <label className="field">{translateUi("Aggiungi dall’archivio")}{" "}<select
                  value=""
                  onChange={(e) => {
                    const m = data.party.find((m) => m.id === e.target.value);
                    if (m) copyMember(m);
                  }}
                >
                  <option value="">{translateUi("Scegli un personaggio o PNG…")}</option>
                  {data.party.filter(m => (m.editionId || "5e-2014") === (encounter.editionId || "5e-2014")).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {translateUi(kindLabels[m.kind])} · {translateUi(EDITIONS[m.editionId || "5e-2014"].label)}
                    </option>
                  ))}
                </select>
              </label>
              {data.party.some(m => (m.editionId || "5e-2014") !== (encounter.editionId || "5e-2014")) && <p className="rules-help">{translateUi("Archivio filtrato per regolamento.")}</p>}
              <button
                className="button secondary"
                onClick={() => { setDraft(d => ({ ...d, kind: "enemy" })); setAdding(true); }}
              >
                <Plus size={14} />{translateUi("Nuovo avversario")}{" "}</button>
            </div>
            <p className="dm-footnote">{translateUi("Incontro locale, senza sincronizzazione. Le condizioni non applicano effetti.")}{" "}</p>
          </section>
        )}
        {tab === "Gruppo e PNG" && (
          <>
            <div className="dm-roster-heading">
              <div>
                <h3>{translateUi("Le persone della tua storia")}</h3>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  const m = snapshotCharacter(character);
                  const existing = data.party.find(p => p.sourceCharacterId === character.id);
                  if (!existing && data.party.some(p => !p.sourceCharacterId && p.name === character.name && (p.editionId || "5e-2014") === m.editionId)) {
                    setPendingCopy(m);
                    setMessage(translateUi("Esiste già una copia con lo stesso nome. Scegli se aggiornarla o creare un partecipante distinto."));
                    return;
                  }
                  update({ party: existing ? data.party.map(p => p.id === existing.id ? refreshSnapshot(p, m) : p) : [...data.party, m] });
                  setMessage(existing ? translateUi("Copia aggiornata. Incontro invariato.") : translateUi("Personaggio copiato nell’archivio."));
                }}
              >
                <Plus size={14} /> {data.party.some(p => p.sourceCharacterId === character.id) ? translateUi("Aggiorna copia attiva") : translateUi("Copia personaggio attivo")}
              </button>
              <button
                className="button primary"
                onClick={() => { setDraft(d => ({ ...d, kind: "npc" })); setAdding(true); }}
              >
                <Plus size={14} />{translateUi("Nuovo PNG")}{" "}</button>
            </div>
            {pendingCopy && <section className="panel dm-copy-decision" aria-label={translateUi("Copia già presente")}>
              <p>{translateUi("Scegli la copia da aggiornare. Le copie nell’incontro restano invariate.")}</p>
              {data.party.filter(p => !p.sourceCharacterId && p.name === pendingCopy.name && (p.editionId || "5e-2014") === pendingCopy.editionId).map(p => <button key={p.id} className="button secondary" onClick={() => {
                update({ party: data.party.map(old => old.id === p.id ? refreshSnapshot(old, pendingCopy) : old) }); setPendingCopy(null); setMessage(translateUi("Copia aggiornata e collegata alla scheda."));
              }}>{translateUi("Aggiorna")}{" "}{p.name} · {p.hp}/{p.maxHp}{" "}{translateUi("PF")}</button>)}
              <button className="button secondary" onClick={() => { update({ party: [...data.party, pendingCopy] }); setPendingCopy(null); setMessage(translateUi("Nuova copia collegata alla scheda.")); }}>{translateUi("Crea copia distinta")}</button>
              <button className="button secondary" onClick={() => setPendingCopy(null)}>{translateUi("Annulla copia")}</button>
            </section>}
            <div className="dm-roster">
              {data.party.map((m) => (
                <article className="panel dm-roster-card" key={m.id}>
                  <div className="dm-roster-title">
                    <span className={`dm-kind ${m.kind}`}>
                      {translateUi(kindLabels[m.kind])} · {translateUi(EDITIONS[m.editionId || "5e-2014"].label)}
                    </span>
                    <button
                      className="icon-button"
                      aria-label={translateUi("Elimina dall’archivio {0}", m.name)}
                      onClick={() =>
                        update({
                          party: data.party.filter((p) => p.id !== m.id),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="rules-help">{m.sourceCharacterId === character.id ? translateUi("Scheda attiva · aggiornamento manuale") : m.sourceCharacterId ? translateUi("Altra scheda locale") : translateUi("Copia senza collegamento")}</p>
                  <label className="field">{translateUi("Nome")}{" "}<input
                      maxLength={60}
                      value={m.name}
                      onChange={(e) =>
                        update({
                          party: data.party.map((p) =>
                            p.id === m.id ? { ...p, name: e.target.value } : p,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="dm-roster-stats">
                    {[
                      ["maxHp", "PF massimi", 1, 9999],
                      ["hp", "PF attuali", 0, m.maxHp],
                      ["ac", "CA", 1, 40],
                      ["initiativeBonus", "Bonus iniziativa", -10, 30],
                      ["passive", "Percezione passiva", 1, 40],
                    ].map(([key, label, min, max]) => (
                      <label className="field" key={key}>
                        {translateUi(label)}
                        <input
                          type="number"
                          value={m[key]}
                          min={min}
                          max={max}
                          onChange={(e) =>
                            update({
                              party: data.party.map((p) =>
                                p.id === m.id
                                  ? {
                                      ...p,
                                      [key]: number(e.target.value, min, max),
                                      ...(key === "maxHp"
                                        ? {
                                            hp: Math.min(
                                              p.hp,
                                              number(e.target.value, min, max),
                                            ),
                                          }
                                        : {}),
                                    }
                                  : p,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="field">{translateUi("Motivazioni e appunti")}{" "}<textarea
                      value={m.notes}
                      onChange={(e) =>
                        update({
                          party: data.party.map((p) =>
                            p.id === m.id ? { ...p, notes: e.target.value } : p,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    className="button secondary full"
                    onClick={() => copyMember(m)}
                  >
                    <Sword size={14} />{translateUi("Aggiungi all’incontro")}{" "}</button>
                </article>
              ))}
            </div>
            <p className="dm-footnote">{translateUi("Archivio, incontro e scheda hanno PF indipendenti.")}{" "}</p>
          </>
        )}
        {adding && tab !== "Sessione" && (
          <div className="dm-member-overlay" onClick={event => { if (event.target === event.currentTarget) setAdding(false); }}>
          <form role="dialog" aria-modal="true" aria-labelledby="dm-member-title"
            onKeyDown={event => {
              if (event.key === "Escape") setAdding(false);
              if (event.key !== "Tab") return;
              const fields = [...event.currentTarget.querySelectorAll('input, select, button')].filter(el => !el.disabled);
              if (event.shiftKey && document.activeElement === fields[0]) { event.preventDefault(); fields.at(-1)?.focus(); }
              else if (!event.shiftKey && document.activeElement === fields.at(-1)) { event.preventDefault(); fields[0]?.focus(); }
            }}
            className="panel dm-new-member"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim()) return;
              const m = combatant(
                draft.name.trim(),
                draft.kind,
                draft.maxHp,
                draft.ac,
                draft.initiativeBonus,
              );
              m.editionId = tab === "Incontro" ? encounter.editionId || "5e-2014" : campaign?.editionId || encounter.editionId || "5e-2014";
              if (tab === "Incontro") copyMember(m);
              else update({ party: [...data.party, m] });
              setDraft({ ...draft, name: "" });
              setAdding(false);
            }}
          >
            <h3 id="dm-member-title">
              {tab === "Incontro" ? translateUi("Un nuovo partecipante") : translateUi("Un volto da ricordare")}
            </h3>
            <div className="dm-new-fields">
              <label className="field">{translateUi("Nome")}{" "}<input
                  ref={memberNameRef}
                  required
                  maxLength={60}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="field">{translateUi("Tipo")}{" "}<select aria-label={translateUi("Tipo")}
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
                >
                  {Object.entries(kindLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {translateUi(v)}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["maxHp", "PF massimi", 1, 9999],
                ["ac", "CA", 1, 40],
                ["initiativeBonus", "Bonus iniziativa", -10, 30],
              ].map(([key, label, min, max]) => (
                <label className="field" key={key}>
                  {translateUi(label)}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [key]: number(e.target.value, min, max),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="dm-new-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setAdding(false)}
              >{translateUi("Annulla")}{" "}</button>
              <button className="button primary" type="submit">
                <Plus size={14} />{translateUi("Aggiungi")}{" "}</button>
            </div>
          </form>
          </div>
        )}
      </div>
    </section>
  );
}
