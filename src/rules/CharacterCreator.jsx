import { useTranslation } from '../i18n.jsx';
import React, { useState } from "react";
import { ArrowRight, Check, Shield } from "lucide-react";
import { ABILITIES, CLASSES, EDITIONS, LATEST_EDITION } from "./catalog.js";
import { priorityAbilities, suggestScores } from "./creation-guidance.js";
import { createCharacter } from "./engine.js";
import "./rules.css";
export default function CharacterCreator({ onCreate, seed }) {
  const translateUi = useTranslation();
  const [edition, setEdition] = useState(
    seed?.editionId ||
      localStorage.getItem("fable-default-edition") ||
      LATEST_EDITION,
  );
  const actualEdition = EDITIONS[edition] ? edition : LATEST_EDITION;
  const [name, setName] = useState(seed?.name || ""),
    [classId, setClassId] = useState("fighter"),
    [stats, setStats] = useState([15, 14, 13, 12, 10, 8]),
    [race, setRace] = useState(""),
    [background, setBackground] = useState(""),
    [originNotes, setOriginNotes] = useState(""),
    [error, setError] = useState("");
  const [phase, setPhase] = useState(0);
  const [preferred, setPreferred] = useState(
    localStorage.getItem("fable-default-edition") || LATEST_EDITION,
  );
  const changeEdition = (id) => {
    setEdition(id);
    setClassId("fighter");
    setError("");
  };
  return (
    <div className="rules-creator">
      <Shield className="modal-emblem" />
      <div className="eyebrow">{translateUi("UN PERSONAGGIO, IL SUO REGOLAMENTO")}</div>
      <h2 id="modal-title">
        {phase === 0 ? translateUi("Scegli la tua edizione.") : translateUi("Dai forma al personaggio.")}
      </h2>
      <div className="wizard-progress">
        {[0, 1].map((n) => (
          <i key={n} className={n <= phase ? "done" : ""} />
        ))}
      </div>
      {phase === 0 ? (
        <>
          <label className="field">{translateUi("Edizione")}{" "}<select
              aria-label={translateUi("Edizione")}
              value={actualEdition}
              onChange={(e) => changeEdition(e.target.value)}
            >
              {Object.values(EDITIONS).map((e) => (
                <option key={e.id} value={e.id}>
                  {translateUi(e.label)}
                  {e.id === LATEST_EDITION ? translateUi(" · ultima") : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="rules-scope">
            <strong>{translateUi("Regole supportate")}</strong>
            <p>{translateUi(EDITIONS[actualEdition].limitations)}</p>
          </div>
          <label className="field">{translateUi("Nome")}{" "}<input
              required
              maxLength={35}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translateUi("Nome del personaggio")}
            />
          </label>
          <label className="field">{translateUi("Classe base")}{" "}<select
              aria-label={translateUi("Classe base")}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {CLASSES[actualEdition].map((k) => (
                <option key={k.id} value={k.id}>
                  {translateUi(k.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="rules-check">
            <input
              type="checkbox"
              checked={preferred === actualEdition}
              onChange={(e) => {
                if (e.target.checked)
                  localStorage.setItem("fable-default-edition", actualEdition);
                else localStorage.removeItem("fable-default-edition");
                setPreferred(e.target.checked ? actualEdition : LATEST_EDITION);
              }}
            />{translateUi("Usa questa edizione per i prossimi personaggi")}{" "}</label>
          <button
            className="button primary full"
            disabled={!name.trim()}
            onClick={() => setPhase(1)}
          >{translateUi("Continua")}{" "}<ArrowRight size={15} />
          </button>
        </>
      ) : (
        <>
          <div className="pill">
            {translateUi(EDITIONS[actualEdition].label)}{" "}{translateUi("· Livello 1")}{" "}</div>
          <p className="rules-help">{translateUi("Punteggi finali, inclusi i bonus di origine e background.")}{" "}</p>
          <div className="creation-guidance">
            <p>{translateUi("Priorità per")}{" "}{translateUi(CLASSES[actualEdition].find(c => c.id === classId)?.name)}: {priorityAbilities(actualEdition, classId).map(i => translateUi(ABILITIES[i])).join(", ")}.</p>
            <button className="button secondary" onClick={() => setStats(suggestScores(stats, actualEdition, classId))}>{translateUi("Assegna per classe")}</button>
            <small>{translateUi("Riordina i punteggi senza cambiarli.")}</small>
          </div>
          <div className="rules-stats-inputs">
            {ABILITIES.map((a, i) => (
              <label className="field" key={a}>
                {translateUi(a)}
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={stats[i]}
                  onChange={(e) =>
                    setStats(
                      stats.map((n, j) =>
                        j === i
                          ? Math.min(
                              30,
                              Math.max(
                                1,
                                Math.trunc(Number(e.target.value) || 1),
                              ),
                            )
                          : n,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <label className="field">
            {actualEdition === "5.5-2024" ? translateUi("Specie") : translateUi("Razza")}
            <input
              maxLength={80}
              value={race}
              onChange={(e) => setRace(e.target.value)}
              placeholder={translateUi("Dal manuale della tua edizione")}
            />
          </label>
          <label className="field">{translateUi("Background / origine")}{" "}<input
              maxLength={80}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            />
          </label>
          <label className="field">{translateUi("Tratti e bonus d’origine da tenere presenti")}{" "}<textarea
              value={originNotes}
              onChange={(e) => setOriginNotes(e.target.value)}
              placeholder={translateUi("Linguaggi, competenze, talenti…")}
            />
          </label>
          <p className="rules-help">
            {stats[priorityAbilities(actualEdition, classId)[0]] < 13 && <strong>{translateUi("Caratteristica principale sotto 13.")}{" "}</strong>}{" "}{translateUi("Monoclasse, senza equipaggiamento. Aggiungi armi, armatura e capacità dalla scheda.")}{" "}</p>
          {error && (
            <p role="alert" className="session-error">
              {translateUi(error)}
            </p>
          )}
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setPhase(0)}>{translateUi("Indietro")}{" "}</button>
            <button
              className="button primary"
              onClick={() => {
                try {
                  onCreate(
                    createCharacter({
                      name,
                      editionId: actualEdition,
                      classId,
                      stats,
                      race,
                      background,
                      originNotes,
                    }),
                  );
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              <Check size={15} />{translateUi("Crea personaggio")}{" "}</button>
          </div>
        </>
      )}
    </div>
  );
}
