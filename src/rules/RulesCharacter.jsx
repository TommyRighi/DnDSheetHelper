import { useTranslation } from '../i18n.jsx';
import { expiringEffects } from "../table-rules.js";
import React, { useState, useRef } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Dice5,
  Heart,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Sword,
  Trash2,
} from "lucide-react";
import { ABILITIES, EDITIONS } from "./catalog.js";
import {
  advanceLevel,
  adjustHP,
  changeStats,
  classFor,
  derive,
  isFifth,
  mod,
  restCharacter,
  restWithExceptions,
  rollDeathSave,
} from "./engine.js";
import "./rules.css";
const signed = (n) => (n >= 0 ? `+${n}` : n);
const integer = (v, min = -99, max = 999) =>
  Math.min(max, Math.max(min, Math.trunc(Number(v) || 0)));
export function RulesRestDialog({ character: c, onChange, onClose, long }) {
  const translateUi = useTranslation();
  const [count, setCount] = useState(0),
    [error, setError] = useState(""),
    [manual, setManual] = useState(false);
  const [options, setOptions] = useState({
    expire: true,
    hp: true,
    slots: true,
    hitDice: true,
    resources: true,
  });
  const d = derive(c),
    e = EDITIONS[c.editionId],
    fourth = c.editionId === "4e",
    expired = expiringEffects(c, long);
  const preview = (() => {
    try {
      return restWithExceptions(c, long ? "long" : "short", {
        options,
        manual,
        count: 0,
      });
    } catch {
      return c;
    }
  })();
  return (
    <>
      <Heart className="modal-emblem" />
      <h2 id="modal-title">{long ? translateUi("Riposo completo") : translateUi("Riposo breve")}</h2>
      <span className="pill">{translateUi(e.label)}</span>
      <p className="rules-help">
        {long ? translateUi(e.longRest) : translateUi(e.shortRest)}{translateUi(". Le risorse sopra il massimo restano disponibili.")}{" "}</p>
      <div className="rest-options">
        <label>
          <input
            type="checkbox"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />{translateUi("Usa recupero manuale invece dei requisiti dell'edizione")}{" "}</label>
        {long &&
          [
            ["hp", "Recupera punti ferita"],
            ["slots", "Recupera slot"],
            ["hitDice", "Recupera dadi vita"],
          ].map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) =>
                  setOptions({ ...options, [key]: e.target.checked })
                }
              />
              {translateUi(label)}
            </label>
          ))}
        <label>
          <input
            type="checkbox"
            checked={options.resources}
            onChange={(e) =>
              setOptions({ ...options, resources: e.target.checked })
            }
          />{translateUi("Recupera le risorse personalizzate previste")}{" "}</label>
        <label>
          <input
            type="checkbox"
            checked={options.expire}
            onChange={(e) =>
              setOptions({ ...options, expire: e.target.checked })
            }
          />{translateUi("Rimuovi gli effetti in scadenza")}{" "}</label>
      </div>
      {manual && (
        <p className="rules-help">{translateUi("Riposo manuale: lungo fino ai massimi personalizzati; breve senza consumo di dadi o impulsi.")}{" "}</p>
      )}
      {!long && !manual && c.editionId !== "3.5" && (
        <label className="field">
          {fourth ? translateUi("Impulsi curativi da spendere · {0} disponibili", c.rules.surges) : translateUi("Dadi vita d{0} da spendere · {1} disponibili", classFor(c).hitDie, c.hitDice)}
          <input
            type="number"
            min={0}
            max={fourth ? c.rules.surges : c.hitDice}
            value={count}
            onChange={(e) =>
              setCount(
                integer(
                  e.target.value,
                  0,
                  Math.min(100, fourth ? c.rules.surges : c.hitDice),
                ),
              )
            }
          />
        </label>
      )}
      <div className="rest-effects">
        <strong>{translateUi("Effetti in scadenza")}</strong>
        <p>{expired.map((e) => e.name).join(", ") || (translateUi("Nessuno."))}</p>
        {!options.expire && <p>{translateUi("Gli effetti resteranno attivi.")}</p>}
      </div>
      <div className="rest-preview">
        <div>
          <span>{translateUi("Punti ferita")}</span>
          <strong>
            {c.hp} → {preview.hp}
          </strong>
        </div>
        <div>
          <span>{translateUi("Dadi vita")}</span>
          <strong>
            {c.hitDice} →{" "}
            {long ? preview.hitDice : c.hitDice - (manual ? 0 : count)}
          </strong>
        </div>
        {derive(preview).slotPools.map((pool) => (
          <div key={pool.level}>
            <span>{translateUi("Slot di")}{" "}{pool.level}{translateUi("° livello")}</span>
            <strong>
              {Math.max(
                0,
                (d.slotPools.find((p) => p.level === pool.level)?.max ?? 0) -
                  (c.rules.slotUsed[pool.level] || 0),
              )}{" "}
              →{" "}
              {Math.max(
                0,
                pool.max - (preview.rules.slotUsed[pool.level] || 0),
              )}
            </strong>
          </div>
        ))}
      </div>
      {!long && count > 0 && !manual && (
        <p className="rules-help">{translateUi("Recupero PF al consumo di dadi o impulsi.")}{" "}</p>
      )}
      {error && (
        <p className="session-error" role="alert">
          {translateUi(error)}
        </p>
      )}
      <button
        className="button primary full"
        onClick={() => {
          try {
            onChange(
              restWithExceptions(c, long ? "long" : "short", {
                count,
                options,
                manual,
                rollDie: (s) => {
                  const a = new Uint32Array(1);
                  crypto.getRandomValues(a);
                  return (a[0] % s) + 1;
                },
              }),
            );
            onClose();
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        <Check size={14} />{translateUi("Conferma riposo")}{" "}</button>
    </>
  );
}
export function RulesLevelDialog({ character: c, onChange, onClose }) {
  const translateUi = useTranslation();
  const k = classFor(c),
    [die, setDie] = useState(Math.ceil(k.hitDie / 2)),
    [error, setError] = useState("");
  const fourth = c.editionId === "4e";
  return (
    <>
      <Sparkles className="modal-emblem" />
      <h2 id="modal-title">{translateUi("Livello")}{" "}{c.level + 1}</h2>
      <span className="pill">
        {translateUi(EDITIONS[c.editionId].label)} · {translateUi(k.name)}
      </span>
      <p className="rules-help">{translateUi("Avanzamento monoclasse: aggiorna PF, livello e valori derivati.")}{" "}</p>
      {fourth ? (
        <p className="info-box">{translateUi("Aumento fisso di")}{" "}{k.hpPerLevel}{" "}{translateUi("PF.")}</p>
      ) : (
        <label className="field">{translateUi("Risultato del dado vita d")}{k.hitDie}
          <input
            type="number"
            min={1}
            max={k.hitDie}
            value={die}
            onChange={(e) => setDie(integer(e.target.value, 1, k.hitDie))}
          />
        </label>
      )}
      <p className="rules-help">{translateUi("Registra manualmente talenti, aumenti di caratteristica, sottoclassi e poteri.")}{" "}</p>
      {error && (
        <p className="session-error" role="alert">
          {translateUi(error)}
        </p>
      )}
      <button
        className="button primary full"
        disabled={c.level >= EDITIONS[c.editionId].maxLevel}
        onClick={() => {
          try {
            onChange(advanceLevel(c, die));
            onClose();
          } catch (e) {
            setError(e.message);
          }
        }}
      >{translateUi("Conferma avanzamento")}{" "}<ArrowRight size={15} />
      </button>
    </>
  );
}
export function RulesEditDialog({ character: c, onChange, onClose }) {
  const translateUi = useTranslation();
  const r = c.rules;
  const setR = (p) => onChange({ ...c, rules: { ...r, ...p } });
  return (
    <>
      <Shield className="modal-emblem" />
      <h2 id="modal-title">{translateUi("Valori della scheda")}</h2>
      <label className="field">{translateUi("Nome")}{" "}<input
          maxLength={35}
          value={c.name}
          onChange={(e) => onChange({ ...c, name: e.target.value })}
        />
      </label>
      <label className="field">{c.editionId === "5.5-2024" ? translateUi("Specie") : translateUi("Razza")}<input maxLength={80} value={c.race} onChange={e => onChange({ ...c, race: e.target.value })} /></label>
      <label className="field">{translateUi("Background / origine")}<input maxLength={80} value={c.background || ""} onChange={e => onChange({ ...c, background: e.target.value })} /></label>
      <div className="rules-stats-inputs">
        {ABILITIES.map((a, i) => (
          <label key={a} className="field">
            {translateUi(a)}
            <input
              type="number"
              min={1}
              max={30}
              value={c.stats[i]}
              onChange={(e) =>
                onChange(
                  changeStats(
                    c,
                    c.stats.map((n, j) =>
                      i === j ? integer(e.target.value, 1, 30) : n,
                    ),
                  ),
                )
              }
            />
          </label>
        ))}
      </div>
      <p className="rules-help">{translateUi("Punteggi finali, inclusi i bonus. La Costituzione aggiorna i PF retroattivi.")}{" "}</p>
      <div className="rules-stats-inputs">
        {[
          ["armor", "Bonus armatura", 0],
          ["shield", "Bonus scudo", 0],
          ["acOther", "Altri bonus CA", -99],
          ["dexCap", "Limite DES armatura", -99],
          ["initiativeOther", "Altri bonus iniziativa", -99],
          ["attackOther", "Altri bonus attacco", -99],
          ["speed", "Velocità in metri", 0],
          ["tempHp", "PF temporanei", 0],
        ].map(([key, label, min]) => (
          <label className="field" key={key}>
            {translateUi(label)}
            <input
              type="number"
              value={r[key]}
              min={min}
              max={999}
              onChange={(e) =>
                setR({ [key]: integer(e.target.value, min, 999) })
              }
            />
          </label>
        ))}
      </div>
      <label className="rules-check">
        <input
          type="checkbox"
          checked={r.heavyArmor}
          onChange={(e) => setR({ heavyArmor: e.target.checked })}
        />{translateUi("Armatura senza bonus di Destrezza. In 4ª esclude anche Intelligenza.")}{" "}</label>
      <p className="rules-help">{translateUi("CA fissa 5e: inserisci il bonus oltre 10. CA 16 → +6. Evita bonus duplicati.")}{" "}</p>
      <label className="field">{translateUi("Tratti di origine")}{" "}<textarea
          value={r.originNotes}
          onChange={(e) => setR({ originNotes: e.target.value })}
        />
      </label>
      <label className="field">{translateUi("Capacità, talenti e modificatori")}{" "}<textarea
          value={r.features}
          onChange={(e) => setR({ features: e.target.value })}
        />
      </label>
      <label className="field">{translateUi("Scelte e verifiche di avanzamento")}{" "}<textarea
          value={r.choices}
          onChange={(e) => setR({ choices: e.target.value })}
        />
      </label>
      <button className="button primary full" onClick={onClose}>
        <Check size={15} />{translateUi("Salva modifiche")}{" "}</button>
    </>
  );
}
export default function RulesCharacter({
  character: c,
  onChange,
  page,
  onRoll,
  onFormula,
  onModal,
}) {
  const translateUi = useTranslation();
  const [amount, setAmount] = useState(5),
    [powerDraft, setPowerDraft] = useState({
      name: "",
      description: "",
      formula: "",
      recharge: "day",
      max: 1,
    }),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [itemName, setItemName] = useState("");
  const [editingPowerId, setEditingPowerId] = useState(null);
  const powerNameRef = useRef();
  const d = derive(c),
    r = c.rules,
    e = EDITIONS[c.editionId],
    k = classFor(c),
    fourth = c.editionId === "4e",
    old = c.editionId === "3.5";
  const setR = (p) => onChange({ ...c, rules: { ...r, ...p } });
  const usePower = (p) => {
    if (p.recharge !== "atwill" && p.used >= p.max) return;
    setR({
      abilities: r.abilities.map((a) =>
        a.id === p.id
          ? { ...a, used: a.recharge === "atwill" ? 0 : a.used + 1 }
          : a,
      ),
    });
  };
  const status =
    c.hp > 0
      ? fourth && c.hp <= d.bloodied
        ? "Sanguinante"
        : "In piedi"
      : old
        ? c.hp <= -10
          ? "Morto"
          : c.hp < 0
            ? r.stable
              ? "Stabile"
              : "Morente"
            : "Inabile"
        : fourth
          ? c.hp <= -d.bloodied || r.deathFailure >= 3
            ? "Morto"
            : "Morente"
          : r.deathFailure >= 3
            ? "Morto"
            : r.stable
              ? "Stabile"
              : "A terra";
  const active = ["Panoramica", "Incantesimi", "Inventario", "Diario"].includes(
    page,
  );
  return (
    <div className={`rules-workbench ${active ? "rules-visible" : ""}`}>
      {active && (
        <>
          <div className="rules-identity">
            <span className="pill">{translateUi(e.label)}</span>
            <h2>
              {c.name} <em>{c.surname}</em>
            </h2>
            <p>
              {c.race || (translateUi("Origine da registrare"))} · {translateUi(k.name)}{" "}{translateUi("· Livello")}{" "}{c.level}
            </p>
            <div className="rules-identity-actions">
              <button
                className="button secondary"
                onClick={() => onModal("edit")}
              >{translateUi("Modifica scheda")}{" "}</button>
              <button
                className="button primary"
                onClick={() => onModal("level")}
              >{translateUi("Passa di livello")}{" "}<ArrowRight size={14} />
              </button>
            </div>
          </div>
          <details className="rules-coverage">
            <summary>{translateUi("Copertura del regolamento e fonti")}</summary>
            <p>{translateUi(e.limitations)}</p>
            <p>{translateUi("Prerequisiti e multiclasse richiedono verifica manuale.")}{" "}</p>
            <a href={e.source} target="_blank" rel="noopener noreferrer">{translateUi("Riferimento dell’edizione")}{" "}</a>
          </details>
        </>
      )}
      {page === "Panoramica" && (
        <>
          <div className="rules-vitals">
            <section className="panel">
              <Heart size={19} />
              <span>{translateUi("PUNTI FERITA")}</span>
              <strong>
                {c.hp}
                <small>/ {d.tableValues.maxHp}</small>
              </strong>
              <p>
                {translateUi(status)}
                {r.tempHp > 0 ? translateUi(" · {0} PF temporanei", r.tempHp) : ""}
              </p>
              <div className="rules-hp-input">
                <input
                  aria-label={translateUi("Quantità danni o guarigione")}
                  type="number"
                  min={1}
                  max={9999}
                  value={amount}
                  onChange={(e) => setAmount(integer(e.target.value, 1, 9999))}
                />
                <button
                  aria-label={translateUi("Subisci danni")}
                  onClick={() => onChange(adjustHP(c, -amount))}
                >{translateUi("− PF")}{" "}</button>
                <button
                  aria-label={translateUi("Recupera punti ferita")}
                  onClick={() => onChange(adjustHP(c, amount))}
                >{translateUi("+ PF")}{" "}</button>
              </div>
            </section>
            <section className="panel">
              <Shield size={19} />
              <span>{translateUi("CLASSE ARMATURA")}</span>
              <strong>{d.ac}</strong>
              <p>
                {old ? translateUi("Contatto {0} · Colto alla sprovvista {1}", d.touchAC, d.flatFootedAC) : translateUi("Bonus inclusi")}
              </p>
            </section>
            <button
              className="panel"
              onClick={() => onRoll("Iniziativa", 20, d.initiative)}
            >
              <Dice5 size={19} />
              <span>{translateUi("INIZIATIVA")}</span>
              <strong>{signed(d.initiative)}</strong>
            </button>
            <section className="panel">
              <Sword size={19} />
              <span>
                {old ? translateUi("ATTACCO BASE") : fourth ? translateUi("METÀ LIVELLO") : translateUi("COMPETENZA")}
              </span>
              <strong>
                {signed(
                  old
                    ? d.bab
                    : fourth
                      ? Math.floor(c.level / 2)
                      : d.proficiency,
                )}
              </strong>
              <p>
                {old ? translateUi("Sequenza BAB {0}", d.iterative.map(signed).join(" / ")) : translateUi("Velocità {0} m", d.tableValues.speed)}
              </p>
            </section>
          </div>
          <section className="panel rules-section quick-attacks">
              <h3>{translateUi("Attacchi generici")}</h3>
              <div className="rules-actions">
                <button
                  onClick={() => onRoll("Attacco in mischia", 20, d.melee)}
                >{translateUi("Mischia")}{" "}{signed(d.melee)}
                </button>
                <button
                  onClick={() => onRoll("Attacco a distanza", 20, d.ranged)}
                >{translateUi("Distanza")}{" "}{signed(d.ranged)}
                </button>
              </div>
              <p className="rules-help">{translateUi("Mischia: Forza. Distanza: Destrezza. Registra a parte bonus d’arma, talenti e caratteristiche alternative.")}{" "}</p>
          </section>
          <section className="panel rules-section turn-panel">
            <h3>{translateUi("Il tuo turno")}</h3>
            <div className="rules-actions">
              {e.actions.map((a) => (
                <button
                  key={a}
                  aria-pressed={r.usedActions.includes(a)}
                  className={r.usedActions.includes(a) ? "used" : ""}
                  onClick={() =>
                    setR({
                      usedActions: r.usedActions.includes(a)
                        ? r.usedActions.filter((x) => x !== a)
                        : [...r.usedActions, a],
                    })
                  }
                >
                  {r.usedActions.includes(a) ? <Check size={13} /> : <span className="rules-square" />}
                  {translateUi(a)}
                </button>
              ))}
              <button
                className="button secondary"
                onClick={() => setR({ usedActions: [] })}
              >{translateUi("Nuovo turno")}{" "}</button>
            </div>
            <p className="rules-help">{translateUi("Azioni gestite manualmente. In 3.5, round completo sostituisce standard e movimento; veloce e immediata condividono il limite.")}{" "}</p>
          </section>
          <div className="rules-two-columns">
            <section className="panel rules-section checks-panel">
              <h3>{translateUi("Caratteristiche")}</h3>
              <div className="rules-stat-cards">
                {ABILITIES.map((a, i) => (
                  <button
                    key={a}
                    onClick={() => onRoll(a, 20, d.mods[i] + d.checkBonus)}
                  >
                    <span>{translateUi(a)}</span>
                    <strong>{signed(d.mods[i])}</strong>
                    <small>{translateUi(c.stats[i])}</small>
                  </button>
                ))}
              </div>
              <h3>{fourth ? translateUi("Difese") : translateUi("Tiri salvezza")}</h3>
              <div className="rules-saves">
                {d.saves.map((s, i) => (
                  <div key={s.name}>
                    <button
                      onClick={() => {
                        if (!fourth) onRoll(s.name, 20, s.value);
                      }}
                      disabled={fourth}
                    >
                      {translateUi(s.name)}
                      <strong>{fourth ? s.value : signed(s.value)}</strong>
                    </button>
                    <input
                      type="number"
                      aria-label={translateUi("Altri bonus {0}", translateUi(s.name))}
                      title={translateUi("Altri bonus registrati")}
                      value={r.saveOther[i]}
                      onChange={(e) =>
                        setR({
                          saveOther: r.saveOther.map((n, j) =>
                            j === i ? integer(e.target.value) : n,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
            <section className="panel rules-section resource-panel">
              <h3>{fourth ? translateUi("Impulsi e risorse") : translateUi("Risorse")}</h3>
              {fourth ? (
                <>
                  <div className="rules-resource">
                    <span>{translateUi("Impulsi curativi")}</span>
                    <b>
                      {r.surges} / {d.surgesMax}
                    </b>
                  </div>
                  <div className="rules-resource">
                    <span>{translateUi("Valore impulso")}</span>
                    <b>{d.surgeValue}{" "}{translateUi("PF")}</b>
                  </div>
                  <button
                    className="button secondary full"
                    disabled={
                      r.surges <= 0 ||
                      r.secondWindUsed ||
                      c.hp <= 0 ||
                      c.hp >= d.tableValues.maxHp
                    }
                    onClick={() => {
                      const healed = adjustHP(c, d.surgeValue);
                      onChange({
                        ...healed,
                        rules: {
                          ...healed.rules,
                          surges: r.surges - 1,
                          secondWindUsed: true,
                        },
                      });
                    }}
                  >{translateUi("Second wind · 1 impulso")}{" "}</button>
                  <p className="rules-help">{translateUi("Second wind: azione standard, +2 difese fino al prossimo turno. Bonus manuale.")}{" "}</p>
                  <label className="field">{translateUi("Punti azione")}{" "}<input
                      type="number"
                      min={0}
                      max={99}
                      value={r.actionPoints}
                      onChange={(e) =>
                        setR({ actionPoints: integer(e.target.value, 0, 99) })
                      }
                    />
                  </label>
                  <p className="rules-help">{translateUi("Milestone manuali. Riposo esteso: punti azione a 1.")}{" "}</p>
                </>
              ) : old ? (
                <>
                  <div className="rules-resource">
                    <span>{translateUi("Punti abilità base totali")}</span>
                    <b>{translateUi(d.skillPoints)}</b>
                  </div>
                  <p className="rules-help">
                    {d.skillsPerLevel}{" "}{translateUi("per livello, quadruplicati al livello 1. Bonus razziali e altri talenti si registrano a parte.")}{" "}</p>
                </>
              ) : (
                <>
                  <div className="rules-resource">
                    <span>{translateUi("Dadi vita d")}{k.hitDie}</span>
                    <b>
                      {c.hitDice} / {d.tableValues.maxHitDice}
                    </b>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() =>
                      onChange({ ...c, inspiration: !c.inspiration })
                    }
                  >
                    {c.editionId === "5.5-2024" ? translateUi("Ispirazione eroica") : translateUi("Ispirazione")}{" "}
                    · {c.inspiration ? translateUi("Disponibile") : translateUi("Assente")}
                  </button>
                  <p className="rules-help">
                    {c.editionId === "5.5-2024" ? translateUi("Consente di ritirare un dado appena lanciato; usa il nuovo risultato.") : translateUi("Concede vantaggio a un tiro per colpire, salvezza o prova prima del tiro.")}{" "}{" "}{translateUi("Spunta e consumo sono manuali.")}{" "}</p>
                </>
              )}
              {d.resources.map((res) => (
                <div className="rules-resource" key={res.id}>
                  <span>
                    {translateUi(res.label)}
                    <small>
                      {res.short ? translateUi("Riposo breve / lungo") : translateUi("Riposo lungo")}
                    </small>
                  </span>
                  <b>
                    {Math.max(0, res.max - (r.resourceUsed[res.id] || 0))} /{" "}
                    {res.max}
                  </b>
                  <button
                    className="icon-button"
                    aria-label={translateUi("Consuma {0}", translateUi(res.label))}
                    disabled={(r.resourceUsed[res.id] || 0) >= res.max}
                    onClick={() =>
                      setR({
                        resourceUsed: {
                          ...r.resourceUsed,
                          [res.id]: (r.resourceUsed[res.id] || 0) + 1,
                        },
                      })
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={translateUi("Ripristina {0}", translateUi(res.label))}
                    disabled={!(r.resourceUsed[res.id] > 0)}
                    onClick={() =>
                      setR({
                        resourceUsed: {
                          ...r.resourceUsed,
                          [res.id]: r.resourceUsed[res.id] - 1,
                        },
                      })
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
              <div className="rest-buttons">
                <button
                  className="button secondary"
                  onClick={() => onModal("shortRest")}
                >{translateUi("Riposo breve")}{" "}</button>
                <button
                  className="button secondary"
                  onClick={() => onModal("longRest")}
                >
                  {old ? translateUi("Riposo notturno") : fourth ? translateUi("Riposo esteso") : translateUi("Riposo lungo")}
                </button>
              </div>
            </section>
          </div>
          {c.hp <= 0 && (
            <section className="panel rules-section">
              <h3>{translateUi("Stato a terra")}</h3>
              <p>{translateUi(status)}</p>
              <p className="rules-help">
                {old ? translateUi("A 0 PF sei inabile, da −1 a −9 morente, a −10 morto. Stabilizzazione: 10% con d100.") : fourth ? translateUi("Tiro salvezza: meno di 10 è un fallimento; a 20+ puoi spendere un impulso. Morte a tre fallimenti o a −{0} PF.", d.bloodied) : translateUi("Tiro contro morte: 10+ successo, 1 naturale due fallimenti, 20 naturale recupera 1 PF. Tre successi stabilizzano, tre fallimenti sono fatali.")}
              </p>
              <div className="rules-resource">
                <span>{translateUi("Successi / fallimenti")}</span>
                <b>
                  {r.deathSuccess} / {r.deathFailure}
                </b>
              </div>
              <button
                className="button secondary"
                disabled={status === "Morto" || r.stable}
                onClick={() => {
                  try {
                    const n = onRoll(
                      old ? "Stabilizzazione" : "Tiro contro morte",
                      old ? 100 : 20,
                    );
                    onChange(rollDeathSave(c, n));
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >{translateUi("Tira")}{" "}{old ? translateUi("d100") : translateUi("d20")}
              </button>
              <label className="rules-check">
                <input
                  type="checkbox"
                  checked={r.stable}
                  onChange={(e) => setR({ stable: e.target.checked })}
                />{translateUi("Stabilizzato dal master")}{" "}</label>
            </section>
          )}
          <section className="panel rules-section">
            <h3>{translateUi("Abilità")}</h3>
            <p className="rules-help">
              {old ? translateUi("Registra gradi e modificatori. Verifica abilità di classe e spesa dei punti sul manuale.") : fourth ? translateUi("Metà livello e +5 se addestrato. Scegli gli addestramenti dal manuale.") : translateUi("Competenza ×1, maestria ×2.")}
            </p>
            <input
              className="rules-search"
              aria-label={translateUi("Filtra abilità")}
              placeholder={translateUi("Cerca abilità…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {d.skills
              .filter((s) =>
                translateUi(s.name).toLowerCase().includes(search.toLowerCase()),
              )
              .map((s) => (
                <div className="rules-skill-row" key={s.name}>
                  <button onClick={() => onRoll(s.name, 20, s.value)}>
                    <span>
                      {translateUi(s.name)}
                      <small>{translateUi(ABILITIES[s.ability])}</small>
                    </span>
                    <b>{signed(s.value)}</b>
                  </button>
                  <label>
                    <input
                      type="checkbox"
                      aria-label={`${old ? "Di classe" : "Addestrato"} ${translateUi(s.name)}`}
                      checked={s.trained}
                      onChange={(e) =>
                        setR({
                          skills: {
                            ...r.skills,
                            [s.name]: {
                              rank: s.rank,
                              trained: e.target.checked,
                              expertise: s.expertise,
                              other: s.other,
                            },
                          },
                        })
                      }
                    />
                    {old ? translateUi("Classe") : translateUi("Competenza")}
                  </label>
                  {old ? (
                    <label>{translateUi("Gradi")}{" "}<input
                        type="number"
                        aria-label={translateUi("Gradi {0}", translateUi(s.name))}
                        min={0}
                        max={s.trained ? c.level + 3 : (c.level + 3) / 2}
                        step={0.5}
                        value={s.rank}
                        onChange={(e) =>
                          setR({
                            skills: {
                              ...r.skills,
                              [s.name]: {
                                rank: Math.min(
                                  s.trained ? c.level + 3 : (c.level + 3) / 2,
                                  Math.max(
                                    0,
                                    Math.round(
                                      Number(e.target.value || 0) * 2,
                                    ) / 2,
                                  ),
                                ),
                                trained: s.trained,
                                expertise: false,
                                other: s.other,
                              },
                            },
                          })
                        }
                      />
                    </label>
                  ) : !fourth ? (
                    <label>
                      <input
                        type="checkbox"
                        aria-label={translateUi("Maestria {0}", translateUi(s.name))}
                        checked={s.expertise}
                        disabled={!s.trained}
                        onChange={(e) =>
                          setR({
                            skills: {
                              ...r.skills,
                              [s.name]: {
                                rank: 0,
                                trained: s.trained,
                                expertise: e.target.checked,
                                other: s.other,
                              },
                            },
                          })
                        }
                      />{translateUi("Maestria")}{" "}</label>
                  ) : null}
                  <label>{translateUi("Altri")}{" "}<input
                      type="number"
                      aria-label={translateUi("Bonus aggiuntivi {0}", translateUi(s.name))}
                      value={s.other}
                      onChange={(e) =>
                        setR({
                          skills: {
                            ...r.skills,
                            [s.name]: {
                              rank: s.rank,
                              trained: s.trained,
                              expertise: s.expertise,
                              other: integer(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </label>
                </div>
              ))}
          </section>
          <section className="panel rules-section">
            <h3>{translateUi("Origine, capacità e scelte")}</h3>
            <p className="rules-preformatted">
              {r.originNotes || (translateUi("Tratti di origine non ancora registrati."))}
            </p>
            <p className="rules-preformatted">
              {r.features || (translateUi("Capacità e talenti non ancora registrati."))}
            </p>
            <p className="rules-preformatted">{r.choices}</p>
            <button
              className="button secondary"
              onClick={() => onModal("edit")}
            >{translateUi("Registra capacità e modificatori")}{" "}</button>
          </section>
        </>
      )}
      {page === "Incantesimi" && (
        <>
          <section className="panel rules-section">
            <h3>
              {fourth ? translateUi("Poteri") : old ? translateUi("Incantesimi e capacità giornaliere") : translateUi("Slot incantesimo")}
            </h3>
            {d.slotPools.length ? (
              <>
                {d.slotPools.map((pool) => (
                  <div className="rules-resource" key={pool.level}>
                    <span>
                      {pool.pact ? translateUi("Magia del patto · ") : ""}
                      {pool.level}{translateUi("° livello")}{" "}<small>
                        {pool.pact ? translateUi("Recupero breve / lungo") : translateUi("Recupero lungo")}
                      </small>
                    </span>
                    <b>
                      {Math.max(0, pool.max - (r.slotUsed[pool.level] || 0))} /{" "}
                      {pool.max}
                    </b>
                    <button
                      className="button secondary"
                      disabled={(r.slotUsed[pool.level] || 0) >= pool.max}
                      onClick={() =>
                        setR({
                          slotUsed: {
                            ...r.slotUsed,
                            [pool.level]: (r.slotUsed[pool.level] || 0) + 1,
                          },
                        })
                      }
                    >{translateUi("Consuma slot")}{" "}</button>
                    <button
                      className="icon-button"
                      aria-label={translateUi("Ripristina slot {0}", pool.level)}
                      disabled={!(r.slotUsed[pool.level] > 0)}
                      onClick={() =>
                        setR({
                          slotUsed: {
                            ...r.slotUsed,
                            [pool.level]: r.slotUsed[pool.level] - 1,
                          },
                        })
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
                <p className="rules-help">{translateUi("Registra incantesimi e componenti. Consuma gli slot separatamente.")}{" "}</p>
                {d.spellDC !== null && (
                  <p>{translateUi("CD incantesimi")}{" "}{d.spellDC}{" "}{translateUi("· Attacco magico")}{" "}
                    {signed(d.spellAttack)}
                  </p>
                )}
              </>
            ) : (
              <p className="rules-help">
                {old ? translateUi("3.5: registra usi giornalieri e incantesimi bonus dal manuale.") : fourth ? translateUi("Poteri a volontà, incontro o giornalieri.") : translateUi("Nessuno slot base. Registra a parte le capacità aggiuntive.")}
              </p>
            )}
          </section>
          <section className="panel rules-section">
            <p className="rules-help">{translateUi("Uso, tiro, slot ed effetti si gestiscono separatamente.")}</p>
            {error && <p className="session-error" role="alert">{translateUi(error)}</p>}
            <h3>
              {fourth ? translateUi("Il tuo repertorio di poteri") : translateUi("Incantesimi e capacità registrati")}
            </h3>
            {r.abilities.map((p) => (
              <article className="rules-power" key={p.id}>
                <div>
                  <h4>{p.name}</h4>
                  <span className="pill">
                    {p.recharge === "atwill" ? translateUi("A volontà") : p.recharge === "encounter" ? translateUi("A incontro / riposo breve") : translateUi("Giornaliero / riposo lungo")}
                  </span>
                  <p>{p.description}</p>
                  {p.formula && (
                    <small>{translateUi("Formula di riferimento:")}{" "}{translateUi(p.formula)}</small>
                  )}
                </div>
                <div>
                  <strong>
                    {p.recharge === "atwill" ? "∞" : `${p.max - p.used} / ${p.max}`}
                  </strong>
                  <button
                    className="button secondary"
                    disabled={p.recharge !== "atwill" && p.used >= p.max}
                    onClick={() => usePower(p)}
                  >{translateUi("Segna uso")}{" "}</button>
                  {p.formula && <button className="button secondary" onClick={() => { try { onFormula(p.formula, p.name); setError(""); } catch (err) { setError(err.message); } }}>{translateUi("Tira formula")}</button>}
                  <button className="button secondary" onClick={() => {
                    setEditingPowerId(p.id); setPowerDraft({ name: p.name, description: p.description, formula: p.formula, recharge: p.recharge, max: p.max });
                    setTimeout(() => { powerNameRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); powerNameRef.current?.focus(); }, 0);
                  }}>{translateUi("Modifica capacità")}</button>
                  <button
                    className="icon-button"
                    aria-label={translateUi("Ripristina {0}", p.name)}
                    onClick={() =>
                      setR({
                        abilities: r.abilities.map((a) =>
                          a.id === p.id ? { ...a, used: 0 } : a,
                        ),
                      })
                    }
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={translateUi("Elimina {0}", p.name)}
                    onClick={() =>
                      setR({
                        abilities: r.abilities.filter((a) => a.id !== p.id),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
            {!r.abilities.length && (
              <p className="rules-help">{translateUi("Nessuna capacità registrata.")}{" "}</p>
            )}
          </section>
          <form
            className="panel rules-section"
            onSubmit={(event) => {
              event.preventDefault();
              if (!powerDraft.name.trim()) return;
              if (editingPowerId) {
                const old = r.abilities.find(p => p.id === editingPowerId);
                if (!old) { setEditingPowerId(null); return; }
                if (powerDraft.max < old.used) { setError(translateUi("Gli usi massimi non possono essere inferiori a quelli già consumati. Ripristina prima gli usi se necessario.")); return; }
                setR({ abilities: r.abilities.map(p => p.id === editingPowerId ? { ...p, ...powerDraft, used: p.used } : p) });
              } else setR({
                abilities: [
                  ...r.abilities,
                  {
                    ...powerDraft,
                    name: powerDraft.name.trim(),
                    id: crypto.randomUUID(),
                    used: 0,
                  },
                ],
              });
              setEditingPowerId(null);
              setError("");
              setPowerDraft({
                ...powerDraft,
                name: "",
                description: "",
                formula: "",
              });
            }}
          >
            <h3>{editingPowerId ? translateUi("Modifica dal tuo manuale") : translateUi("Aggiungi dal tuo manuale")}</h3>
            <label className="field">{translateUi("Nome")}{" "}<input
                ref={powerNameRef}
                maxLength={100}
                required
                value={powerDraft.name}
                onChange={(e) =>
                  setPowerDraft({ ...powerDraft, name: e.target.value })
                }
              />
            </label>
            <label className="field">{translateUi("Descrizione / requisiti")}{" "}<textarea
                value={powerDraft.description}
                onChange={(e) =>
                  setPowerDraft({ ...powerDraft, description: e.target.value })
                }
              />
            </label>
            <div className="rules-two-columns">
              <label className="field">{translateUi("Recupero")}{" "}<select
                  value={powerDraft.recharge}
                  onChange={(e) =>
                    setPowerDraft({ ...powerDraft, recharge: e.target.value })
                  }
                >
                  <option value="atwill">{translateUi("A volontà")}</option>
                  <option value="encounter">{translateUi("Incontro / riposo breve")}</option>
                  <option value="day">{translateUi("Giornaliero / riposo lungo")}</option>
                </select>
              </label>
              <label className="field">{translateUi("Usi massimi")}{" "}<input
                  type="number"
                  min={1}
                  max={999}
                  value={powerDraft.max}
                  onChange={(e) =>
                    setPowerDraft({
                      ...powerDraft,
                      max: integer(e.target.value, 1, 999),
                    })
                  }
                />
              </label>
            </div>
            <label className="field">{translateUi("Formula di riferimento")}{" "}<input
                value={powerDraft.formula}
                onChange={(e) =>
                  setPowerDraft({ ...powerDraft, formula: e.target.value })
                }
                placeholder={translateUi("Es. 2d8+3")}
              />
            </label>
            <p className="rules-help">{translateUi("Effetti, bersagli e prerequisiti manuali.")}{" "}</p>
            <button className="button primary">
              <Plus size={15} /> {editingPowerId ? translateUi("Salva capacità") : translateUi("Aggiungi capacità")}
            </button>
            {editingPowerId && <button type="button" className="button secondary" onClick={() => { setEditingPowerId(null); setPowerDraft({ name: "", description: "", formula: "", recharge: "day", max: 1 }); setError(""); }}>{translateUi("Annulla modifica capacità")}</button>}
          </form>
        </>
      )}
      {page === "Inventario" && (
        <section className="panel rules-section">
          <h3>{translateUi("Equipaggiamento")}</h3>
          <p className="rules-help">{translateUi("Bonus degli oggetti: aggiorna CA e attacchi nell’editor della scheda.")}{" "}</p>
          <label className="field">{translateUi("Monete d’oro")}{" "}<input
              type="number"
              min={0}
              max={999999}
              value={c.gold}
              onChange={(e) =>
                onChange({ ...c, gold: integer(e.target.value, 0, 999999) })
              }
            />
          </label>
          {c.inventory.map((item, i) => (
            <div className="rules-item" key={item.name}>
              <h4>{item.name}</h4>
              <label className="field">{translateUi("Dettagli")}{" "}<input
                  value={item.detail}
                  onChange={(e) =>
                    onChange({
                      ...c,
                      inventory: c.inventory.map((it, j) =>
                        i === j ? { ...it, detail: e.target.value } : it,
                      ),
                    })
                  }
                />
              </label>
              <label className="field">{translateUi("Quantità")}{" "}<input
                  type="number"
                  min={0}
                  value={item.qty}
                  onChange={(e) =>
                    onChange({
                      ...c,
                      inventory: c.inventory.map((it, j) =>
                        i === j
                          ? { ...it, qty: integer(e.target.value, 0, 9999) }
                          : it,
                      ),
                    })
                  }
                />
              </label>
              <label className="field">{translateUi("Peso unitario kg")}{" "}<input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.weight}
                  onChange={(e) =>
                    onChange({
                      ...c,
                      inventory: c.inventory.map((it, j) =>
                        i === j
                          ? {
                              ...it,
                              weight: Math.max(0, Number(e.target.value) || 0),
                            }
                          : it,
                      ),
                    })
                  }
                />
              </label>
              <button
                className="icon-button"
                aria-label={translateUi("Elimina {0}", item.name)}
                onClick={() =>
                  onChange({
                    ...c,
                    inventory: c.inventory.filter((_, j) => i !== j),
                  })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <form
            className="rules-item-add"
            onSubmit={(event) => {
              event.preventDefault();
              if (!itemName.trim()) return;
              if (c.inventory.some((i) => i.name === itemName.trim())) {
                setError(translateUi("Oggetto già presente. Modifica la quantità."));
                return;
              }
              onChange({
                ...c,
                inventory: [
                  ...c.inventory,
                  {
                    name: itemName.trim(),
                    detail: "",
                    weight: 0,
                    qty: 1,
                    equipped: false,
                  },
                ],
              });
              setItemName("");
              setError("");
            }}
          >
            <label className="field">{translateUi("Nuovo oggetto")}{" "}<input
                maxLength={100}
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </label>
            <button className="button primary">
              <Plus size={15} />{translateUi("Aggiungi")}{" "}</button>
          </form>
        </section>
      )}
      {page === "Diario" && (
        <section className="panel rules-section">
          <h3>{translateUi("Appunti personali di")}{" "}{c.name}</h3>
          <label className="field">{translateUi("Appunti della tua avventura")}{" "}<textarea
              className="rules-journal"
              value={c.notes}
              onChange={(e) => onChange({ ...c, notes: e.target.value })}
            />
          </label>
          <h3>{translateUi("Ultimi tiri")}</h3>
          {c.logs.map((l) => (
            <div className="rules-resource" key={l.id}>
              <span>
                {translateUi(l.label)}
                <small>
                  {translateUi(l.values.join(" + "))} {l.bonus ? signed(l.bonus) : ""}
                </small>
              </span>
              <b>{l.total}</b>
            </div>
          ))}
        </section>
      )}
      {error && (
        <p role="alert" className="session-error">
          {translateUi(error)}
        </p>
      )}
    </div>
  );
}
