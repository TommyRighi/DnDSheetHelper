import { useTranslation } from '../i18n.jsx';
import {
  rulesFor,
  targets,
  durations,
  recoveryLabels,
  explainValue,
} from "../table-rules.js";
import React from "react";
import SheetInput from "../SheetInput.jsx";
import { ABILITIES, EDITIONS } from "./catalog.js";
import { derive } from "./engine.js";
export default function RulesPrint({ character: c, active, onChange }) {
  const translateUi = useTranslation();
  const details = c.sheetDetails || {};
  const setDetail = (key, value) => onChange({ sheetDetails: { ...details, [key]: value } });
  const setRuleText = (key, value) => onChange({ rules: { ...c.rules, [key]: value } });
  const d = derive(c),
    r = c.rules,
    e = EDITIONS[c.editionId];
  return (
    <div
      className={`character-sheet-view ${active ? "sheet-visible" : ""}`}
      aria-hidden={!active}
    >
      <div className="sheet-scroll">
        <article
          className="paper-sheet rules-print"
          aria-label={translateUi("Scheda {0}, stato attuale", e.label)}
        >
          <section className="paper-page">
            <header className="paper-header">
              <div className="paper-wordmark">
                <span className="sheet-name-inputs">
                  <SheetInput label={translateUi("Nome")} value={c.name} required maxLength={35} onChange={name => onChange({ name })} />
                  <SheetInput label={translateUi("Soprannome")} value={c.surname} maxLength={45} onChange={surname => onChange({ surname })} />
                </span>
                <span>
                  {translateUi(c.className)}{" "}{translateUi("· LIVELLO")}{" "}{c.level}
                </span>
              </div>
              <div className="paper-edition">
                {translateUi(e.label)}
                <br />
                <span>{translateUi("Regole core 0.1 · Vista adattata")}</span>
              </div>
            </header>
            <div className="paper-identity-details">
              <div className="paper-field">
                <strong><SheetInput label={translateUi("Origine")} value={c.race} maxLength={80} onChange={race => onChange({ race })} /></strong>
                <span>{translateUi("Origine")}</span>
              </div>
              <div className="paper-field">
                <strong><SheetInput label={translateUi("Background")} value={c.background || ""} maxLength={80} onChange={background => onChange({ background })} /></strong>
                <span>{translateUi("Background")}</span>
              </div>
              <div className="paper-field">
                <strong><SheetInput label={translateUi("Esperienza")} value={c.xp} type="number" min={0} max={1000000} onChange={xp => onChange({ xp })} /></strong>
                <span>{translateUi("Esperienza")}</span>
              </div>
              {[["playerName", "Nome del giocatore"], ["alignment", "Allineamento"]].map(([key, label]) => <div className="paper-field" key={key}>
                <strong><SheetInput label={translateUi(label)} value={details[key] || ''} maxLength={100} onChange={value => setDetail(key, value)} /></strong>
                <span>{translateUi(label)}</span>
              </div>)}
            </div>
            <div className="rules-print-vitals">
              <span>{translateUi("PF")}{" "}
                <strong>
                  {c.hp} / {d.tableValues.maxHp}
                </strong>
              </span>
              <span>{translateUi("CA")}{" "}<strong>{d.ac}</strong>
              </span>
              <span>{translateUi("Iniziativa")}{" "}
                <strong>
                  {d.initiative >= 0 ? "+" : ""}
                  {d.initiative}
                </strong>
              </span>
              <span>{translateUi("Velocità")}{" "}<strong>{d.tableValues.speed}{" "}{translateUi("m")}</strong>
              </span>
              {c.editionId === "3.5" ? (
                <>
                  <span>{translateUi("Contatto")}{" "}<strong>{d.touchAC}</strong>
                  </span>
                  <span>{translateUi("Colto alla sprovvista")}{" "}<strong>{d.flatFootedAC}</strong>
                  </span>
                  <span>{translateUi("BAB")}{" "}<strong>{translateUi(d.iterative.join(" / "))}</strong>
                  </span>
                </>
              ) : c.editionId === "4e" ? (
                <span>{translateUi("Impulsi")}{" "}
                  <strong>
                    {r.surges} / {d.surgesMax} · {d.surgeValue}{" "}{translateUi("PF")}{" "}</strong>
                </span>
              ) : (
                <>
                  <span>{translateUi("Competenza")}{" "}<strong>+{d.proficiency}</strong>
                  </span>
                  <span>{translateUi("Dadi vita")}{" "}
                    <strong>
                      {c.hitDice} / {d.tableValues.maxHitDice}
                    </strong>
                  </span>
                </>
              )}
            </div>
            <div className="paper-columns">
              <div className="paper-column">
                <section className="paper-box">
                  <h3>{translateUi("Caratteristiche")}</h3>
                  {ABILITIES.map((a, i) => (
                    <div className="paper-resource" key={a}>
                      <span>{translateUi(a)}</span>
                      <b>
                        {translateUi(c.stats[i])} · {d.mods[i] >= 0 ? "+" : ""}
                        {translateUi(d.mods[i])}
                      </b>
                    </div>
                  ))}
                </section>
                <section className="paper-box">
                  <h3>{c.editionId === "4e" ? translateUi("Difese") : translateUi("Tiri salvezza")}</h3>
                  {d.saves.map((s) => (
                    <div className="paper-resource" key={s.name}>
                      <span>{translateUi(s.name)}</span>
                      <b>{s.value}</b>
                    </div>
                  ))}
                </section>
                <section className="paper-box">
                  <h3>{translateUi("Risorse")}</h3>
                  {d.resources.map((res) => (
                    <div className="paper-resource" key={res.id}>
                      <span>{translateUi(res.label)}</span>
                      <b>
                        {Math.max(0, res.max - (r.resourceUsed[res.id] || 0))}/
                        {res.max}
                      </b>
                    </div>
                  ))}
                  {d.slotPools.map((p) => (
                    <div className="paper-resource" key={p.level}>
                      <span>{translateUi("Slot")}{" "}{p.level}°{p.pact ? translateUi(" · patto") : ""}
                      </span>
                      <b>
                        {Math.max(0, p.max - (r.slotUsed[p.level] || 0))}/
                        {p.max}
                      </b>
                    </div>
                  ))}
                  <p>{translateUi("PF temporanei:")}{" "}{r.tempHp}</p>
                  {c.editionId.startsWith("5") && (
                    <p>{translateUi("Ispirazione:")}{" "}{c.inspiration ? translateUi("sì") : translateUi("no")}
                      <br />{translateUi("Esaurimento:")}{" "}{r.exhaustion}
                    </p>
                  )}
                  {c.editionId === "4e" && (
                    <p>{translateUi("Punti azione:")}{" "}{r.actionPoints}
                      <br />{translateUi("Second wind:")}{" "}{r.secondWindUsed ? translateUi("usato") : translateUi("disponibile")}
                    </p>
                  )}
                  {c.editionId === "3.5" && c.hp <= 0 && (
                    <p>{translateUi("Stabilizzato:")}{" "}{r.stable ? translateUi("sì") : translateUi("no")}</p>
                  )}
                </section>
              </div>
              <div className="paper-column">
                <section className="paper-box">
                  <h3>{translateUi("Abilità")}</h3>
                  {d.skills.map((s) => (
                    <div className="paper-resource" key={s.name}>
                      <span>
                        {translateUi(s.name)}
                        {c.editionId === "3.5" ? translateUi(" · {0} gradi", s.rank) : s.trained ? " •" : ""}
                      </span>
                      <b>
                        {s.value >= 0 ? "+" : ""}
                        {s.value}
                      </b>
                    </div>
                  ))}
                </section>
              </div>
              <div className="paper-column">
                {[["personalityTraits", "Tratti caratteriali"], ["ideals", "Ideali"], ["bonds", "Legami"], ["flaws", "Difetti"]].map(([key, label]) => <section className="paper-box" key={key}>
                  <h3>{translateUi(label)}</h3>
                  <SheetInput label={translateUi(label)} value={details[key] || ''} onChange={value => setDetail(key, value)} multiline placeholder={translateUi('Scrivi qui…')} />
                </section>)}
                <section className="paper-box">
                  <h3>{translateUi("Altre competenze e linguaggi")}</h3>
                  <SheetInput label={translateUi("Altre competenze e linguaggi")} value={details.proficiencies || ''} onChange={value => setDetail('proficiencies', value)} multiline placeholder={translateUi('Scrivi qui…')} />
                </section>
                <section className="paper-box">
                  <h3>{translateUi("Origine e capacità")}</h3>
                  <SheetInput label={translateUi("Tratti di origine")} value={r.originNotes} onChange={value => setRuleText('originNotes', value)} multiline placeholder={translateUi("Scrivi qui…")} />
                  <SheetInput label={translateUi("Capacità, talenti e modificatori")} value={r.features} onChange={value => setRuleText('features', value)} multiline placeholder={translateUi("Scrivi qui…")} />
                </section>
                <section className="paper-box">
                  <h3>{translateUi("Scelte di avanzamento")}</h3>
                  <SheetInput label={translateUi("Scelte di avanzamento")} value={r.choices} onChange={value => setRuleText('choices', value)} multiline placeholder={translateUi("Scrivi qui…")} />
                </section>
              </div>
            </div>
            <footer className="paper-footer">
              <span>
                {translateUi(e.label)} · {translateUi(c.rulesVersion)}{" "}{translateUi("· Stato attuale")}{" "}</span>
              <span>{translateUi("Fable · Calcoli core e contenuti manuali")}</span>
            </footer>
          </section>
          <section className="paper-page paper-details-page">
            <header className="paper-header">
              <div className="paper-wordmark paper-small-wordmark">
                {c.name}
                <span>{translateUi("EQUIPAGGIAMENTO E REPERTORIO")}</span>
              </div>
              <div className="paper-edition">{translateUi(e.label)}</div>
            </header>
            <section className="paper-box">
              <h3>{translateUi("Equipaggiamento")}</h3>
              <p>{translateUi("Monete d’oro:")}{" "}{c.gold}</p>
              {c.inventory.length ? (
                c.inventory.map((i) => (
                  <div className="paper-resource" key={i.name}>
                    <span>
                      {i.name} · {i.detail}
                    </span>
                    <b>{translateUi("×")}{i.qty} · {i.weight * i.qty}{" "}{translateUi("kg")}{" "}</b>
                  </div>
                ))
              ) : (
                <p>{translateUi("Nessun oggetto registrato.")}</p>
              )}
            </section>
            <section className="paper-box">
              <h3>{translateUi("Poteri, incantesimi e capacità registrati")}</h3>
              {r.abilities.length ? (
                r.abilities.map((p) => (
                  <div className="paper-spell" key={p.id}>
                    <h4>
                      {p.name}{" "}
                      <span>
                        {translateUi(p.recharge)} ·{" "}
                        {p.recharge === "atwill" ? "∞" : `${p.max - p.used}/${p.max}`}
                      </span>
                    </h4>
                    <p>{p.description}</p>
                    {p.formula && <p>{translateUi(p.formula)}</p>}
                  </div>
                ))
              ) : (
                <p>{translateUi("Nessuna capacità registrata.")}</p>
              )}
            </section>
            <section className="paper-box">
              <h3>{translateUi("Regole del tavolo")}</h3>
              {Object.entries(d.tableValues.details)
                .filter(([, v]) => v.override || v.effects.length)
                .map(([key, v]) => (
                  <p key={key}>
                    <strong>{translateUi(targets[key])}</strong> · {explainValue(v, translateUi)}
                  </p>
                ))}
              {rulesFor(c).effects.map((e) => (
                <p key={e.id}>
                  {e.name} · {translateUi(durations[e.duration])}
                </p>
              ))}
              {rulesFor(c).resources.map((r) => (
                <p key={r.id}>
                  {r.name} · {r.current}/{r.max} · {translateUi(recoveryLabels[r.recovery])}
                </p>
              ))}
            </section>
            <section className="paper-box">
              <h3>{translateUi("Diario")}</h3>
              <SheetInput label={translateUi("Diario")} value={c.notes} onChange={notes => onChange({ notes })} multiline maxLength={50000} placeholder={translateUi("Scrivi qui…")} />
            </section>
            <p className="rules-print-scope">{translateUi("Copertura:")}{" "}{translateUi(e.limitations)}</p>
          </section>
        </article>
      </div>
    </div>
  );
}
