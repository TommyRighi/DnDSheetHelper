import { useTranslation } from './i18n.jsx';
import React from "react";
import SheetInput from "./SheetInput.jsx";
import { targets, durations, recoveryLabels, explainValue } from "./table-rules.js";
import "./character-sheet.css";

const modifier = (n) => Math.floor((n - 10) / 2);
const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);

function Box({ title, children, className = "", id }) {
  const translateUi = useTranslation();
  return (
    <section id={id} className={`paper-box ${className}`}>
      <h3>{translateUi(title)}</h3>
      {children}
    </section>
  );
}
function Field({ label, children }) {
  const translateUi = useTranslation();
  return (
    <div className="paper-field">
      <strong>{children}</strong>
      <span>{translateUi(label)}</span>
    </div>
  );
}

export default function CharacterSheet({
  character: c,
  onChange,
  abilities,
  skills,
  spells,
  proficiency,
  maxSlots,
  values,
  tableRules,
  turn,
  active,
}) {
  const translateUi = useTranslation();
  const details = c.sheetDetails || {};
  const setDetail = (key, value) => onChange({ sheetDetails: { ...details, [key]: value } });
  const editDetail = (key, label) => <SheetInput label={translateUi(label)} value={details[key] || ''} onChange={value => setDetail(key, value)} multiline placeholder={translateUi('Scrivi qui…')} />;
  const wisdom = modifier(c.stats[4]);
  const passive = 10 + wisdom + proficiency + values.checks;
  return (
    <div
      className={`character-sheet-view ${active ? "sheet-visible" : ""}`}
      aria-hidden={!active}
    >
      <nav className="sheet-mobile-index" aria-label={translateUi("Sezioni della scheda")}>
        {[
          ["identity", "Identità"],
          ["abilities", "Caratteristiche"],
          ["combat", "Combattimento"],
          ["traits", "Tratti"],
          ["inventory", "Zaino"],
          ["spells", "Incantesimi"],
          ["notes", "Diario"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() =>
              document
                .getElementById(`sheet-${id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            {translateUi(label)}
          </button>
        ))}
      </nav>
      <div className="sheet-scroll">
        <article
          className="paper-sheet"
          aria-label={translateUi("Scheda classica D&D, stato attuale")}
        >
          <section className="paper-page">
            <header className="paper-header">
              <div className="paper-wordmark">{translateUi("D&D")}<span>{translateUi("SCHEDA DEL PERSONAGGIO")}</span>
              </div>
              <div className="paper-edition">{translateUi("5a edizione")}{" "}<br />
                <span>{translateUi("Fable · Scheda dimostrativa")}</span>
              </div>
            </header>
            <div className="paper-identity" id="sheet-identity">
              <Field label={translateUi("Nome del personaggio")}>
                <span className="sheet-name-inputs">
                  <SheetInput label={translateUi("Nome")} value={c.name} required maxLength={35} onChange={name => onChange({ name })} />
                  <SheetInput label={translateUi("Soprannome")} value={c.surname} maxLength={45} onChange={surname => onChange({ surname })} />
                </span>
              </Field>
              <div className="paper-identity-details">
                <Field label={translateUi("Classe e livello")}>
                  <span className="sheet-class-input"><SheetInput label={translateUi("Classe")} value={c.className} maxLength={80} onChange={className => onChange({ className })} /><span>{c.level}</span></span>
                </Field>
                <Field label={translateUi("Background")}><SheetInput label={translateUi("Background")} value={c.background || ""} maxLength={80} onChange={background => onChange({ background })} /></Field>
                <Field label={translateUi("Nome del giocatore")}><SheetInput label={translateUi("Nome del giocatore")} value={details.playerName || ""} maxLength={100} onChange={value => setDetail("playerName", value)} /></Field>
                <Field label={translateUi("Razza")}><SheetInput label={translateUi("Razza")} value={c.race} maxLength={80} onChange={race => onChange({ race })} /></Field>
                <Field label={translateUi("Allineamento")}><SheetInput label={translateUi("Allineamento")} value={details.alignment || ""} maxLength={100} onChange={value => setDetail("alignment", value)} /></Field>
                <Field label={translateUi("Punti esperienza")}>
                  <SheetInput label={translateUi("Punti esperienza")} value={c.xp} type="number" min={0} max={1000000} onChange={xp => onChange({ xp })} />
                </Field>
              </div>
            </div>
            <div className="paper-columns">
              <div className="paper-column">
                <div className="paper-left-stats">
                  <div className="paper-scores" id="sheet-abilities">
                    {abilities.map((a, i) => (
                      <div className="paper-score" key={a}>
                        <span>{translateUi(a)}</span>
                        <strong>{signed(modifier(c.stats[i]))}</strong>
                        <small>{translateUi(c.stats[i])}</small>
                      </div>
                    ))}
                  </div>
                  <div className="paper-checks">
                    <div className="paper-single">
                      <b>{c.inspiration ? "✓" : "—"}</b>
                      <span>{translateUi("Ispirazione")}</span>
                    </div>
                    <div className="paper-single">
                      <b>+{proficiency}</b>
                      <span>{translateUi("Bonus di competenza")}</span>
                    </div>
                    <Box title={translateUi("Tiri salvezza")}>
                      {abilities.map((a, i) => {
                        const trained = i === 0 || i === 1;
                        return (
                          <div className="paper-check" key={a}>
                            <i className={trained ? "filled" : ""} />
                            <b>
                              {signed(
                                modifier(c.stats[i]) +
                                  (trained ? proficiency : 0),
                              )}
                            </b>
                            <span>{translateUi(a)}</span>
                          </div>
                        );
                      })}
                    </Box>
                    <Box title={translateUi("Abilità")}>
                      {skills.map(([name, i, trained]) => (
                        <div className="paper-check" key={name}>
                          <i className={trained ? "filled" : ""} />
                          <b>
                            {signed(
                              modifier(c.stats[i]) +
                                (trained ? proficiency : 0) + values.checks,
                            )}
                          </b>
                          <span>
                            {translateUi(name)} <small>({translateUi(abilities[i].slice(0, 3))})</small>
                          </span>
                        </div>
                      ))}
                    </Box>
                  </div>
                </div>
                <div className="paper-single paper-passive">
                  <b>{translateUi(passive)}</b>
                  <span>{translateUi("Saggezza passiva · Percezione")}</span>
                </div>
                <Box title={translateUi("Altre competenze e linguaggi")}>
                  {editDetail('proficiencies', 'Altre competenze e linguaggi')}
                </Box>
              </div>
              <div className="paper-column" id="sheet-combat">
                <div className="paper-combat">
                  <Field label={translateUi("Classe armatura")}>{values.ac}</Field>
                  <Field label={translateUi("Iniziativa")}>{signed(values.initiative)}</Field>
                  <Field label={translateUi("Velocità")}>
                    {values.speed.toLocaleString(translateUi.locale)}{" "}{translateUi("m")}{" "}</Field>
                </div>
                <Box title={translateUi("Punti ferita attuali")} className="paper-hp">
                  <div className="paper-hp-max">{translateUi("Punti ferita massimi")}{" "}<b>{c.maxHp}</b>
                  </div>
                  <strong>{c.hp}</strong>
                </Box>
                <Box title={translateUi("Punti ferita temporanei")}>
                  <p className="paper-untracked">{translateUi("Non registrati")}</p>
                </Box>
                <div className="paper-two">
                  <Box title={translateUi("Dadi vita")}>
                    <div className="paper-dice">
                      {c.hitDice} / {values.maxHitDice}
                      <small>{translateUi("d10")}</small>
                    </div>
                  </Box>
                  <Box title={translateUi("Tiri salvezza contro morte")}>
                    <p className="paper-untracked">{translateUi("Non registrati")}</p>
                    <div className="paper-death-placeholder">{translateUi("Successi ○ ○ ○")}<br />{translateUi("Fallimenti ○ ○ ○")}{" "}</div>
                  </Box>
                </div>
                <Box title={translateUi("Attacchi e incantesimi")}>
                  <table className="paper-attacks">
                    <thead>
                      <tr>
                        <th>{translateUi("Nome")}</th>
                        <th>{translateUi("Bonus")}</th>
                        <th>{translateUi("Danni / Tipo")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{translateUi("Arco lungo")}</td>
                        <td>{signed(values.attack)}</td>
                        <td>{translateUi("1d8")}{" "}{signed(values.damage)}
                          <small>{translateUi("Perforanti")}</small>
                        </td>
                      </tr>
                      <tr>
                        <td>{translateUi("Spada corta")}</td>
                        <td>{signed(values.attack)}</td>
                        <td>{translateUi("1d6")}{" "}{signed(values.damage)}
                          <small>{translateUi("Perforanti")}</small>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p>{translateUi("Arco lungo: gittata 45 / 180 m.")}{" "}<br />{translateUi("Spada corta: portata 1,5 m, accurata.")}{" "}</p>
                  <div className="paper-spell-values">
                    <span>{translateUi("CD incantesimi")}{" "}<b>{values.spellDc}</b>
                    </span>
                    <span>{translateUi("Attacco magico")}{" "}<b>{signed(values.spellAttack)}</b>
                    </span>
                  </div>
                </Box>
                <Box title={translateUi("Risorse e turno attuale")}>
                  <div className="paper-resource">
                    <span>{translateUi("Slot di 1° livello")}</span>
                    <b>
                      {c.slots} / {maxSlots}
                    </b>
                  </div>
                  <div className="paper-resource">
                    <span>{translateUi("Ispirazione")}</span>
                    <b>{c.inspiration ? translateUi("Disponibile") : translateUi("Assente")}</b>
                  </div>
                  {["Azione", "Bonus", "Reazione"].map((t) => (
                    <div className="paper-resource" key={t}>
                      <span>{translateUi(t)}</span>
                      <b>{turn.includes(t) ? translateUi("Usata") : translateUi("Disponibile")}</b>
                    </div>
                  ))}
                </Box>
              </div>
              <div className="paper-column" id="sheet-traits">
                <Box title={translateUi("Tratti caratteriali")}>
                  {editDetail('personalityTraits', 'Tratti caratteriali')}
                </Box>
                <Box title={translateUi("Ideali")}>
                  {editDetail('ideals', 'Ideali')}
                </Box>
                <Box title={translateUi("Legami")}>
                  {editDetail('bonds', 'Legami')}
                </Box>
                <Box title={translateUi("Difetti")}>
                  {editDetail('flaws', 'Difetti')}
                </Box>
                <Box title={translateUi("Privilegi e tratti")}>
                  {editDetail('features', 'Privilegi e tratti')}
                </Box>
              </div>
            </div>
            <footer className="paper-footer">
              <span>
                {c.name}{" "}{translateUi("· Livello")}{" "}{c.level}{" "}{translateUi("· Stato attuale")}{" "}</span>
              <span>{translateUi("Fable · Scheda 1")}</span>
            </footer>
          </section>
          <section className="paper-page paper-details-page">
            <header className="paper-header">
              <div className="paper-wordmark paper-small-wordmark">
                {c.name}
                <span>{translateUi("EQUIPAGGIAMENTO, INCANTESIMI E DIARIO")}</span>
              </div>
              <div className="paper-edition">
                {translateUi(c.className)}{" "}{translateUi("· Livello")}{" "}{c.level}
                <br />
                {c.race}
              </div>
            </header>
            <Box title={translateUi("Equipaggiamento e tesoro")} id="sheet-inventory">
              <div className="paper-resource">
                <span>{translateUi("Monete d’oro")}</span>
                <b>{c.gold.toLocaleString(translateUi.locale)}{" "}{translateUi("MO")}</b>
                <span>{translateUi("Peso totale")}</span>
                <b>
                  {c.inventory
                    .reduce((sum, i) => sum + i.qty * i.weight, 0)
                    .toLocaleString(translateUi.locale)}{" "}{" "}{translateUi("kg")}{" "}</b>
              </div>
              <table className="paper-inventory">
                <thead>
                  <tr>
                    <th>{translateUi("Oggetto")}</th>
                    <th>{translateUi("Dettagli")}</th>
                    <th>{translateUi("Quantità")}</th>
                    <th>{translateUi("Peso totale")}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.inventory.map((i) => (
                    <tr key={i.name}>
                      <td data-label="Oggetto">
                        {i.name}
                        {i.equipped && <small>{translateUi("Equipaggiato")}</small>}
                      </td>
                      <td data-label="Dettagli">{i.detail}</td>
                      <td data-label="Quantità">{i.qty}</td>
                      <td data-label="Peso totale">
                        {(i.qty * i.weight).toLocaleString(translateUi.locale)}{" "}{translateUi("kg")}{" "}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!c.inventory.length && <p>{translateUi("Nessun oggetto nello zaino.")}</p>}
            </Box>
            <Box
              title={translateUi("Incantesimi di riferimento · 1° livello")}
              id="sheet-spells"
            >
              <div className="paper-resource">
                <span>{translateUi("Caratteristica")}</span>
                <b>{translateUi("Saggezza")}{" "}{signed(wisdom)}</b>
                <span>{translateUi("Slot disponibili")}</span>
                <b>
                  {c.slots} / {maxSlots}
                </b>
              </div>
              {c.level < 2 && (
                <p className="paper-untracked">{translateUi("Il ranger di livello 1 non dispone ancora di slot. Questi incantesimi sono un riferimento della demo.")}{" "}</p>
              )}
              {spells.map((s) => (
                <div className="paper-spell" key={s.name}>
                  <h4>
                    {translateUi(s.name)}{" "}
                    <span>
                      {translateUi(s.time)} · {translateUi(s.range)} · {translateUi(s.tag)}
                    </span>
                  </h4>
                  <p>{translateUi(s.desc)}</p>
                </div>
              ))}
            </Box>
            {(Object.keys(tableRules.overrides).length > 0 || tableRules.effects.length > 0 || tableRules.resources.length > 0) && <Box title={translateUi("Regole del tavolo ed effetti attivi")}>
              {Object.entries(values.details).filter(([,d]) => d.override || d.effects.length).map(([key,d]) => <p key={key}><strong>{translateUi(targets[key])}</strong> · {explainValue(d, translateUi)}</p>)}
              {tableRules.effects.map(e => <p key={e.id}>{e.name} · {translateUi(durations[e.duration])}</p>)}
              {tableRules.resources.map(r => <p key={r.id}><strong>{r.name}</strong> · {r.current}/{r.max} · {translateUi(recoveryLabels[r.recovery])}</p>)}
            </Box>}
            <Box title={translateUi("Diario e appunti")} id="sheet-notes">
              <SheetInput label={translateUi("Diario e appunti")} value={c.notes} onChange={notes => onChange({ notes })} multiline maxLength={50000} placeholder={translateUi("Scrivi qui…")} />
            </Box>
            <footer className="paper-footer">
              <span>{translateUi("Stampa dello stato attuale · Regole semplificate della demo")}{" "}</span>
              <span>{translateUi("Fable · Allegati")}</span>
            </footer>
          </section>
        </article>
      </div>
    </div>
  );
}
