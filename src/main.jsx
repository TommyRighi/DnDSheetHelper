import { LanguageProvider, useLanguage, useTranslation } from './i18n.jsx';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Dice5,
  Feather,
  Flame,
  Heart,
  Leaf,
  Map,
  Minus,
  Moon,
  Plus,
  Palette,
  Printer,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sword,
  Target,
  Trash2,
  Users,
  Wind,
  X,
  Zap,
} from "lucide-react";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "./styles.css";
import CharacterSheet from "./CharacterSheet.jsx";
import SessionPanel from "./SessionPanel.jsx";
import { rollFormula } from "./dice.js";
import DungeonMaster from "./DungeonMaster.jsx";
import { loadCharacter, persistCharacter, recoverCharacter } from "./character-persistence.js";
import EditCharacterDialog from "./EditCharacterDialog.jsx";
import { parseCharacterSave } from "./storage.js";
import { readAppearance, themeVariables } from "./appearance.js";
import "./interface.css";
import CharacterCreator from "./rules/CharacterCreator.jsx";
import RulesCharacter, {
  RulesRestDialog,
  RulesLevelDialog,
} from "./rules/RulesCharacter.jsx";
import RulesPrint from "./rules/RulesPrint.jsx";
import { EDITIONS, LATEST_EDITION } from "./rules/catalog.js";
import { derive, adjustHP } from "./rules/engine.js";
import { readCharacters, saveCharacter } from "./rules/library.js";
import TableRules from "./TableRules.jsx";
import LanguageSelect from "./LanguageSelect.jsx";
import { saveLanguage } from "./language.js";
import {
  characterValues,
  rulesFor,
  explainValue,
  targets,
  durations,
  recoveryLabels,
  recordRuleChange,
  expiringEffects,
  applyRest,
} from "./table-rules.js";

import DataConnections from "./DataConnections.jsx";
import CampaignPanel from "./CampaignPanel.jsx";
import useOnlineCampaign from "./useOnlineCampaign.js";
import OnlineCampaignPanel, { SharedCampaignRoster } from "./OnlineCampaignPanel.jsx";
import { readCampaign, saveCampaign, readPage, NAVIGATION_KEY, characterChecklist } from "./campaign.js";
import "./player.css";

const initial = {
  id: crypto.randomUUID(),
  editionId: "5e-2014",
  schemaVersion: 2,
  rulesVersion: "legacy-demo",
  name: "Thalion",
  surname: "Foglia d’Argento",
  race: "Elfo dei boschi",
  className: "Ranger",
  level: 4,
  hp: 28,
  maxHp: 36,
  xp: 5400,
  inspiration: false,
  slots: 2,
  hitDice: 4,
  notes:
    "Abbiamo trovato un simbolo inciso sulla porta della cripta. Elara sembra averlo già visto.\n\nChiedere a Gundren della mappa prima di lasciare Phandalin.",
  inventory: [
    {
      name: "Arco lungo",
      detail: "Arma · 1d8 perforanti",
      weight: 1,
      qty: 1,
      equipped: true,
    },
    {
      name: "Spada corta",
      detail: "Arma · 1d6 perforanti",
      weight: 1,
      qty: 2,
      equipped: true,
    },
    {
      name: "Armatura di cuoio borchiato",
      detail: "Armatura leggera · CA 12 + DES",
      weight: 6,
      qty: 1,
      equipped: true,
    },
    {
      name: "Pozione di guarigione",
      detail: "Consumabile · Recupera 2d4 + 2 PF",
      weight: 0.2,
      qty: 3,
    },
    { name: "Frecce", detail: "Munizioni", weight: 0.05, qty: 20 },
    {
      name: "Corda di canapa",
      detail: "Equipaggiamento · 15 metri",
      weight: 5,
      qty: 1,
    },
  ],
  gold: 125,
  logs: [],
  conditions: [],
  stats: [12, 18, 14, 10, 16, 8],
};
const abilities = [
  "Forza",
  "Destrezza",
  "Costituzione",
  "Intelligenza",
  "Saggezza",
  "Carisma",
];
const skills = [
  ["Acrobazia", 1, false],
  ["Addestrare animali", 4, true],
  ["Arcano", 3, false],
  ["Atletica", 0, false],
  ["Furtività", 1, true],
  ["Indagare", 3, false],
  ["Intuizione", 4, false],
  ["Medicina", 4, false],
  ["Natura", 3, true],
  ["Percezione", 4, true],
  ["Persuasione", 5, false],
  ["Sopravvivenza", 4, true],
  ["Rapidità di mano", 1, false],
  ["Inganno", 5, false],
  ["Intimidire", 5, false],
  ["Intrattenere", 5, false],
  ["Religione", 3, false],
  ["Storia", 3, false],
];
const spells = [
  {
    name: "Marchio del cacciatore",
    type: "1° livello · Divinazione",
    time: "Azione bonus",
    range: "27 metri",
    desc: "Scegli una creatura visibile entro gittata. Ogni colpo con un’arma le infligge 1d6 danni extra. Hai vantaggio per trovarla con Percezione e Sopravvivenza.",
    tag: "Concentrazione",
    icon: Target,
  },
  {
    name: "Cura ferite",
    type: "1° livello · Invocazione",
    time: "Azione",
    range: "Contatto",
    desc: "La creatura toccata recupera 1d8 + il modificatore di Saggezza punti ferita. Non ha effetto su non morti e costrutti.",
    tag: "Guarigione",
    icon: Heart,
  },
  {
    name: "Bacche benefiche",
    type: "1° livello · Trasmutazione",
    time: "Azione",
    range: "Contatto",
    desc: "Crei dieci bacche magiche. Ogni bacca ripristina 1 punto ferita e fornisce nutrimento per un giorno. Le bacche durano 24 ore.",
    tag: "Esplorazione",
    icon: Leaf,
  },
];
const xpThresholds = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];
const slotCapacity = (level) =>
  level < 2 ? 0 : level < 3 ? 2 : level < 5 ? 3 : 4;
const mod = (n) => Math.floor((n - 10) / 2);
const signed = (n) => (n >= 0 ? `+${n}` : n);
const rollDie = (s) => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] % s) + 1;
};
function App() {
  const translateUi = useTranslation();
  const { language, setLanguage } = useLanguage();
  const settingsText = (it, en) => (language === "en" ? en : it);
  const changeLanguage = (next) => {
    setLanguage(next);
    try {
      saveLanguage(next);
    } catch {
      notify(
        next === "en" ? translateUi("Language changed for this session. Browser storage is unavailable.") : translateUi("Lingua cambiata per questa sessione. Salvataggio nel browser non disponibile."),
      );
    }
  };
  const [loaded] = useState(() => loadCharacter(localStorage, initial));
  const [char, setChar] = useState(loaded.character);
  const [recoveryBlocked, setRecoveryBlocked] = useState(loaded.blocked);
  const [characters, setCharacters] = useState(() =>
    readCharacters(localStorage),
  );
  const [characterSaveError, setCharacterSaveError] = useState("");
  const receiveSharedCharacter = useCallback((next, activate = false) => {
    const archive = saveCharacter(localStorage, next);
    setCharacters(archive);
    setChar(current => activate || current.id === next.id ? next : current);
  }, []);
  const cloud = useOnlineCampaign({ character: char, characters, onReceive: receiveSharedCharacter, enabled: !recoveryBlocked && !characterSaveError });
  const [inspected, setInspected] = useState(null);
  const inspectedSheet = cloud.sheets.find(s => s.owner_id === inspected?.ownerId && s.character_id === inspected?.characterId);
  const inspectSharedSheet = row => { setInspected({ ownerId: row.owner_id, characterId: row.character_id }); setModal("sharedSheet"); };
  const [creatorSeed, setCreatorSeed] = useState(null);
  const [campaign, setCampaign] = useState(() => readCampaign(localStorage));
  const [creatingForCampaign, setCreatingForCampaign] = useState(false);
  const activeCampaign = cloud.campaign ? {
    id: cloud.campaign.id, name: cloud.campaign.name, description: cloud.campaign.description,
    editionId: cloud.campaign.edition_id, characterIds: cloud.sheets.map(s => s.character_id),
  } : campaign;
  const updateCampaign = next => setCampaign(saveCampaign(localStorage, next));
  const changeRulesCharacter = (next) =>
    setChar((current) => ({
      ...next,
      logs: next.logs === char.logs ? current.logs : next.logs,
    }));
  const createNewCharacter = (next) => {
    try {
      saveCharacter(localStorage, char);
      setCharacters(saveCharacter(localStorage, next));
      if (creatingForCampaign && campaign) updateCampaign({ ...campaign, characterIds: [...campaign.characterIds, next.id] });
      setCreatingForCampaign(false);
      setChar(next);
      setPage("Panoramica");
      setModal(null);
      setTurn([]);
    } catch {
      notify(
        translateUi("Archivio non disponibile. Esporta il personaggio attuale prima di sostituirlo."),
      );
    }
  };
  useEffect(() => {
    if (recoveryBlocked) return;
    try {
      setCharacters(persistCharacter(localStorage, char));
      setCharacterSaveError("");
    } catch {
      setCharacterSaveError(
        translateUi("Salvataggio archivio non riuscito. Esporta una copia dalle impostazioni."),
      );
    }
  }, [char, recoveryBlocked]);
  const [appearance, setAppearance] = useState(readAppearance);
  const [diceCount, setDiceCount] = useState(1);
  const [diceBonus, setDiceBonus] = useState(0);
  const [diceFormula, setDiceFormula] = useState("2d6+1d8+3");
  const [diceError, setDiceError] = useState("");
  const recordRoll = (result) => {
    const entry = { ...result, id: Date.now() };
    setRoll(entry);
    setChar((c) => ({ ...c, logs: [entry, ...c.logs].slice(0, 15) }));
    return entry;
  };
  const rollMixedDice = () => {
    try {
      const result = rollFormula(diceFormula, rollDie);
      recordRoll({ ...result, label: `Tiro libero ${result.expression}` });
      setDiceError("");
    } catch (e) {
      setDiceError(e.message);
    }
  };
  const copyRollCommand = async (secret) => {
    try {
      const parsed = rollFormula(diceFormula, () => 1);
      await navigator.clipboard.writeText(
        `${secret ? "/gmroll" : "/roll"} ${parsed.expression}`,
      );
      notify(
        translateUi("Comando copiato. Incollalo nella chat di Roll20: eseguirà un nuovo tiro."),
      );
    } catch (e) {
      setDiceError(e.message || "Copia non disponibile nel browser.");
    }
  };
  const [restDice, setRestDice] = useState(1);
  const [restOptions, setRestOptions] = useState({
    expire: true,
    hp: true,
    slots: true,
    hitDice: true,
    resources: true,
  });
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = appearance.mode;
    for (const [name, value] of Object.entries(themeVariables(appearance)))
      root.style.setProperty(name, value);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        appearance.mode === "light" ? "#f5f2ed" : "#19191d",
      );
    localStorage.setItem("fable-appearance", JSON.stringify(appearance));
  }, [appearance]);
  const [page, setPage] = useState(() => new URLSearchParams(location.hash.slice(1)).has("fable-invite") ? "Campagna" : readPage(localStorage)),
    [tab, setTab] = useState("Azioni"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [damage, setDamage] = useState(5),
    [roll, setRoll] = useState(null),
    [dice, setDice] = useState(20),
    [wizard, setWizard] = useState(0),
    [draft, setDraft] = useState({
      name: "",
      race: "Elfo dei boschi",
      className: "Ranger",
    }),
    [itemName, setItemName] = useState(""),
    [levelHp, setLevelHp] = useState(6);
  useEffect(() => {
    if (modal === "shortRest" || modal === "longRest") {
      setRestOptions({
        expire: true,
        hp: true,
        slots: true,
        hitDice: true,
        resources: true,
      });
      setRestDice(0);
    }
  }, [modal]);
  useEffect(() => { try { localStorage.setItem(NAVIGATION_KEY, page); } catch { /* Navigation remains usable without storage. */ } }, [page]);
  const toastTimer = useRef();
  const closeRef = useRef();
  const [turn, setTurn] = useState([]);
  useEffect(() => {
    if (modal) {
      const previous = document.activeElement;
      closeRef.current?.focus();
      const esc = (e) => {
        if (e.key === "Escape") setModal(null);
      };
      document.addEventListener("keydown", esc);
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", esc);
        document.body.style.overflow = old;
        previous?.focus();
      };
    }
  }, [modal]);
  const update = (p) => setChar((c) => ({ ...c, ...p }));
  const notify = (t) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };
  const values = char.rules ? derive(char).tableValues : characterValues(char);
  const rules = rulesFor(char);
  const proficiency = values.proficiency;
  const maxSlots = values.maxSlots;
  const effectiveMaxHp = values.maxHp;
  const restPreview = char.rules
    ? char
    : applyRest(char, {
        ...restOptions,
        long: modal === "longRest",
      });
  const previewValues = characterValues(restPreview);
  const manualUpdate = (changes, message) =>
    setChar((c) => recordRuleChange(c, changes, message));
  const nextXp = xpThresholds[char.level] ?? 355000;
  const performRoll = (label, sides = 20, bonus = 0, count = 1) => {
    const values = Array.from({ length: count }, () => rollDie(sides));
    const result = {
      label,
      values,
      sides,
      bonus,
      total: values.reduce((a, b) => a + b, 0) + bonus,
      id: Date.now(),
    };
    setRoll(result);
    setChar((c) => ({ ...c, logs: [result, ...c.logs].slice(0, 15) }));
    return result.total;
  };
  const rest = (long) => {
    const rolls = long
      ? []
      : Array.from({ length: Math.min(restDice, char.hitDice) }, () =>
          rollDie(10),
        );
    const next = applyRest(char, { ...restOptions, long, rolls });
    setChar(next);
    if (long) setTurn([]);
    notify(
      translateUi("{0} completato. Recuperati {1} PF. Dettagli nel registro del tavolo.", translateUi(long ? "Riposo lungo" : "Riposo breve"), next.hp - char.hp),
    );
    setModal(null);
  };
  const openWizard = () => {
    setCreatingForCampaign(false);
    setCreatorSeed(null);
    setModal("rulesCreate");
  };
  const nav = [
    ["Panoramica", Compass],
    ["Schermo del DM", Shield],
    ["Scheda personaggio", ScrollText],
    ["Incantesimi", Sparkles],
    ["Inventario", Backpack],
    ["Diario", BookOpen],
  ];
  const filtered = skills.filter(([n]) =>
    translateUi(n).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className={`app-shell player-shell ${page === "Panoramica" ? "is-playing" : ""} ${page === "Schermo del DM" ? "is-dm" : ""} ${page === "Campagna" ? "is-campaign" : ""}`}>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Panoramica");
          }}
        >
          <span className="brand-mark">
            <Dice5 size={27} />
          </span>
          <span>{translateUi("fable")}<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="brand-caption">{translateUi("OGNI EROE HA UNA STORIA")}</div>
        <div className="workspace-label">{translateUi("IL TUO SPAZIO")}</div>
        <nav>
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              aria-label={translateUi(label)}
              aria-current={page === label ? "page" : undefined}
              title={translateUi(label)}
              className={`nav-item ${page === label ? "active" : ""}`}
              onClick={() => {
                setPage(label);
                setQuery("");
              }}
            >
              <Icon size={19} />
              <span>
                {label === "Incantesimi" && char.editionId === "4e" ? translateUi("Poteri") : label === "Panoramica" ? translateUi("Gioca") : translateUi(label)}
              </span>
              {page === label && (<span className="nav-dot" />)}
              {label === "Incantesimi" && (
                <span className="nav-count">
                  {char.rules ? char.rules.abilities.length : 3}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-rule" />
        <div className="workspace-label">{translateUi("AL TAVOLO")}</div>
        <button
          className="nav-item"
          aria-label={translateUi("La mia campagna")}
          title={translateUi("La mia campagna")}
          onClick={() => setPage("Campagna")}
        >
          <Map size={19} />
          <span>{translateUi("La mia campagna")}</span>
        </button>
        <button
          className="nav-item"
          aria-label={translateUi("Tira i dadi")}
          title={translateUi("Tira i dadi")}
          onClick={() => setModal("dice")}
        >
          <Dice5 size={19} />
          <span>{translateUi("Tira i dadi")}</span>
          <span className="shortcut">{translateUi("D20")}</span>
        </button>
        <div className="sidebar-bottom">
          <div className="adventure-note">
            <Feather size={23} />
            <button onClick={openWizard}>{translateUi("Crea un personaggio")}{" "}<Plus size={15} />
            </button>
          </div>
          <button className="help-button" onClick={() => setModal("help")}>
            <CircleHelp size={17} />{translateUi("Guida rapida")}{" "}
            <ArrowUpRight size={15} />
          </button>
          <div className="profile">
            <div className="profile-avatar">{translateUi("A")}</div>
            <div>
              <strong>{translateUi("Avventuriero")}</strong>
              <small>{translateUi("Il tuo spazio personale")}</small>
            </div>
            <button
              className="icon-button"
              aria-label={translateUi("Impostazioni")}
              onClick={() => setModal("settings")}
            >
              <Settings size={17} />
            </button>
          </div>
        </div>
      </aside>
      <nav className="player-mobile-nav" aria-label={translateUi("Navigazione giocatore")}>
        {[["Panoramica", "Gioca", Sword], ["Scheda personaggio", "Scheda", ScrollText], ["Inventario", "Zaino", Backpack], ["Diario", "Diario", BookOpen]].map(([target, label, Icon]) =>
          <button key={target} aria-label={translateUi(target)} aria-current={page === target ? "page" : undefined} onClick={() => { setPage(target); window.scrollTo(0, 0); }}><Icon size={20} /><span>{translateUi(label)}</span></button>
        )}
      </nav>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">{translateUi("Il mio grimorio")}{" "}<ChevronRight size={14} />
            <span>{page === "Panoramica" ? translateUi("Gioca") : translateUi(page)}</span>
          </div>
          <div className="topbar-right">
            <LanguageSelect language={language} onChange={changeLanguage} />
            <button
              className="button secondary appearance-trigger"
              onClick={() => setModal("appearance")}
              aria-label={translateUi("Personalizza aspetto")}
            >
              <Palette size={17} />
              <span>{translateUi("Aspetto")}</span>
            </button>
            <span className="save-state">
              <span /> {recoveryBlocked ? translateUi("Recupero necessario") : characterSaveError ? translateUi("Non salvato") : translateUi("Salvato in locale")}
            </span>
            <span className="edition">
              {translateUi(EDITIONS[char.editionId || "5e-2014"].label)}
            </span>
            <button
              className="icon-button"
              aria-label={translateUi("Aiuto")}
              onClick={() => setModal("help")}
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </header>
        <main>
          <div className="player-controls">
          <div className="player-heading">
            <div><span className="eyebrow">{page === "Panoramica" ? translateUi("AL TAVOLO") : translateUi(page)}</span>
              <h1>{page === "Schermo del DM" ? activeCampaign?.name || (translateUi("Schermo del DM")) : page === "Panoramica" ? char.name : translateUi(page)}</h1>
              <small>{page === "Schermo del DM" || page === "Campagna" ? translateUi(cloud.campaign ? "Campagna condivisa · {0}" : "Campagna locale · {0}", EDITIONS[activeCampaign?.editionId || char.editionId || "5e-2014"].label) : translateUi("Livello {0} · {1}", char.level, EDITIONS[char.editionId || "5e-2014"].label)}</small>
            </div>
            <button className="button secondary" onClick={() => page === "Schermo del DM" ? setPage("Campagna") : page === "Campagna" ? setPage("Panoramica") : setModal("characterMenu")}><Settings size={16} /> {page === "Schermo del DM" ? translateUi("Campagna") : page === "Campagna" ? translateUi("Gioca") : translateUi("Personaggio")}</button>
          </div>
          {recoveryBlocked && <div className="recovery-notice" role="alert">
            <p>{translateUi("Salvataggio illeggibile. Mostriamo una copia valida o il personaggio di esempio. Originale conservato.")}</p>
            <button className="button primary" onClick={() => {
              try { setCharacters(recoverCharacter(localStorage, char)); setRecoveryBlocked(false); }
              catch { setCharacterSaveError(translateUi("Recupero non riuscito. Lo spazio di salvataggio potrebbe essere esaurito.")); }
            }}>{translateUi("Usa questa copia e conserva l'originale")}</button>
          </div>}
          {characterSaveError && <p role="alert" className="session-error">{translateUi(characterSaveError)}</p>}
          <details className="character-management"><summary>{translateUi("Archivio e regolamento")}</summary>
          <section
            className="rules-library-bar"
            aria-label={translateUi("Personaggi e regolamenti")}
          >
            <label>{translateUi("Personaggio attivo")}{" "}<select
                aria-label={translateUi("Cambia personaggio")}
                value={char.id}
                onChange={(e) => {
                  const next = characters.find((c) => c.id === e.target.value);
                  if (next) {
                    setChar(next);
                    setTurn([]);
                    setModal(null);
                  }
                }}
              >
                {[char, ...characters.filter((c) => c.id !== char.id)].map(
                  (c) => (
                    <option value={c.id} key={c.id}>
                      {c.name} · {translateUi(EDITIONS[c.editionId || "5e-2014"].label)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <span className="pill">
              {translateUi(EDITIONS[char.editionId || "5e-2014"].label)}
            </span>
            <button
              className="button secondary"
              onClick={() => {
                setCreatorSeed({ name: char.name, editionId: LATEST_EDITION });
                setModal("rulesCreate");
              }}
            >{translateUi("Ricrea in un’altra edizione")}{" "}</button>
            <p>{translateUi("Ricreare aggiunge una scheda con un altro regolamento. L’originale resta salvato.")}{" "}</p>
            {characterSaveError && (
              <p className="session-error" role="alert">
                {translateUi(characterSaveError)}
              </p>
            )}
          </section>
          </details>
          <section className="play-toolbar" aria-label={translateUi("Comandi di gioco")}>
            <button className="button secondary" onClick={() => setPage("Incantesimi")}><Sparkles size={17} /><span>{char.editionId === "4e" ? translateUi("Poteri") : translateUi("Incantesimi")}</span></button>
            <div className="play-toolbar-title">
              <span className="toolbar-indicator" />
              <div>
                <strong>{translateUi("Al tavolo")}</strong>
                <small>
                  {char.hp}/{effectiveMaxHp}{" "}{translateUi("PF ·")}{" "}
                  {char.rules ? char.editionId === "4e" ? translateUi("{0} impulsi", char.rules.surges) : char.editionId === "3.5" ? translateUi("Recupero naturale") : translateUi("{0}/{1} dadi vita", char.hitDice, values.maxHitDice) : translateUi("{0}/{1} dadi vita", char.hitDice, values.maxHitDice)}
                </small>
              </div>
            </div>
            <button className="button primary" onClick={() => setModal("dice")}>
              <Dice5 size={18} />
              <span>{translateUi("Tira i dadi")}</span>
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setRestDice(1);
                setModal("shortRest");
              }}
            >
              <Flame size={17} />
              <span>{translateUi("Riposo breve")}</span>
            </button>
            <button
              className="button secondary"
              onClick={() => setModal("longRest")}
            >
              <Moon size={17} />
              <span>{translateUi("Riposo lungo")}</span>
            </button>
          </section>
          <details className="table-management"><summary>{translateUi("Effetti e regole del tavolo ·")}{" "}{rules.effects.length}{" "}{translateUi("effetti ·")}{" "}{rules.resources.length}{" "}{translateUi("risorse")}</summary>
          <section
            className="table-rules-strip"
            aria-label={translateUi("Riepilogo regole del tavolo")}
          >
            <div>
              <strong>{translateUi("Il tuo tavolo, le tue regole")}</strong>
              <small>
                {Object.keys(rules.overrides).length}{" "}{translateUi("valori manuali ·")}{" "}
                {rules.effects.length}{" "}{translateUi("effetti attivi ·")}{" "}{rules.resources.length}{" "}{" "}{translateUi("risorse extra")}{" "}</small>
            </div>
            <button
              className="button secondary"
              onClick={() => setModal("tableRules")}
            >
              <Settings size={16} />{translateUi("Regole del tavolo")}{" "}</button>
            {rules.effects.length > 0 && (
              <div className="table-effects">
                {rules.effects.map((e) => (
                  <span
                    className="table-effect"
                    key={e.id}
                    title={translateUi(durations[e.duration])}
                  >
                    {e.name} · {translateUi(targets[e.target])} {signed(e.amount)}
                  </span>
                ))}
              </div>
            )}
            {rules.resources.length > 0 && (
              <div className="table-resources">
                {rules.resources.map((r) => (
                  <div className="table-resource" key={r.id}>
                    <div>
                      <strong>
                        {r.name} · {r.current}/{r.max}
                      </strong>
                      <small>{translateUi(recoveryLabels[r.recovery])}</small>
                    </div>
                    <button
                      className="button secondary"
                      disabled={r.current < 1}
                      aria-label={translateUi("Usa {0}", r.name)}
                      onClick={() =>
                        manualUpdate(
                          {
                            tableRules: {
                              ...rules,
                              resources: rules.resources.map((x) =>
                                x.id === r.id
                                  ? { ...x, current: x.current - 1 }
                                  : x,
                              ),
                            },
                          },
                          `Usata risorsa ${r.name}: ${r.current} → ${r.current - 1}.`,
                        )
                      }
                    >{translateUi("Usa 1")}{" "}</button>
                    <button
                      className="button secondary"
                      aria-label={translateUi("Recupera {0}", r.name)}
                      onClick={() =>
                        manualUpdate(
                          {
                            tableRules: {
                              ...rules,
                              resources: rules.resources.map((x) =>
                                x.id === r.id
                                  ? { ...x, current: x.current + 1 }
                                  : x,
                              ),
                            },
                          },
                          `Recupero manuale ${r.name}: ${r.current} → ${r.current + 1}.`,
                        )
                      }
                    >
                      +1
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          </details>
          </div>
          {page === "Panoramica" && !char.rules && (
            <>
              <section className="character-banner">
                <div className="forest-art" />
                <div className="banner-grain" />
                <div className="character-info">
                  <span className="character-label">
                    <span />{translateUi("PERSONAGGIO ATTIVO")}{" "}</span>
                  <h2>
                    {char.name} <span>{char.surname}</span>
                  </h2>
                  <p>
                    {char.race}
                    <span className="separator">/</span>
                    {translateUi(char.className)}{" "}{translateUi("· Cacciatore")}{" "}<span className="separator">/</span>{translateUi("Caotico buono")}{" "}</p>
                  <div className="character-tags">
                    <span>
                      <Leaf size={13} />{translateUi("Vagabondo")}{" "}</span>
                    <span>
                      <Map size={13} />{translateUi("Le miniere perdute di Phandelver")}{" "}</span>
                  </div>
                  <div className="xp-row">
                    <span>{translateUi("Livello")}{" "}<strong>{char.level}</strong>
                    </span>
                    <div className="xp-track">
                      <i
                        style={{
                          width: `${Math.min(100, (char.xp / nextXp) * 100)}%`,
                        }}
                      />
                    </div>
                    <small>
                      {char.xp.toLocaleString(translateUi.locale)} /{" "}
                      {nextXp.toLocaleString(translateUi.locale)}{" "}{translateUi("PE")}{" "}</small>
                    <button
                      onClick={() => setModal("level")}
                      title={translateUi("Apri avanzamento di livello")}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="banner-side">
                  <div className="level-seal">
                    <span>{translateUi("LIVELLO")}</span>
                    <strong>{char.level}</strong>
                    <Leaf size={19} />
                  </div>
                  <button
                    className="banner-edit"
                    onClick={() => setModal("edit")}
                  >
                    <Feather size={14} />{translateUi("Modifica personaggio")}{" "}</button>
                </div>
              </section>
              <div className="vital-grid">
                <section className="vital-card hp-card">
                  <div className="vital-label">
                    <Heart size={17} />
                    <span>{translateUi("PUNTI FERITA")}</span>
                    <button
                      aria-label={translateUi("Gestisci punti ferita")}
                      onClick={() => setModal("hp")}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="vital-value">
                    <strong>{char.hp}</strong>
                    <span>/ {effectiveMaxHp}</span>
                    <span className="status-tag">
                      {char.hp === 0 ? translateUi("A terra") : char.hp < effectiveMaxHp / 2 ? translateUi("Ferito") : translateUi("In salute")}
                    </span>
                  </div>
                  <div className="hp-track">
                    <i
                      style={{
                        width: `${Math.min(100, (char.hp / effectiveMaxHp) * 100)}%`,
                      }}
                    />
                  </div>
                </section>
                <section className="vital-card">
                  <div className="vital-label">
                    <Shield size={17} />
                    <span>{translateUi("CLASSE ARMATURA")}</span>
                  </div>
                  <div className="vital-value">
                    <strong>{values.ac}</strong>
                    <small>{translateUi("Cuoio borchiato")}</small>
                  </div>
                  <div className="vital-foot">
                    {explainValue(values.details.ac, translateUi)}
                  </div>
                </section>
                <button
                  className="vital-card clickable"
                  onClick={() =>
                    performRoll("Iniziativa", 20, values.initiative)
                  }
                >
                  <div className="vital-label">
                    <Zap size={17} />
                    <span>{translateUi("INIZIATIVA")}</span>
                    <ArrowUpRight size={14} />
                  </div>
                  <div className="vital-value">
                    <strong>{signed(values.initiative)}</strong>
                    <small>{translateUi("Destrezza")}</small>
                  </div>
                </button>
                <section className="vital-card">
                  <div className="vital-label">
                    <Wind size={17} />
                    <span>{translateUi("VELOCITÀ")}</span>
                  </div>
                  <div className="vital-value">
                    <strong>{values.speed.toLocaleString(translateUi.locale)}</strong>
                    <span>{translateUi("m")}</span>
                  </div>
                </section>
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <section className="panel ability-panel">
                    <div className="panel-heading">
                      <h3>{translateUi("Caratteristiche")}</h3>
                    </div>
                    <div className="ability-grid">
                      {char.stats.map((n, i) => (
                        <button
                          className="ability"
                          aria-label={translateUi("Tira {0}, d20 {1}", translateUi(abilities[i]), signed(mod(n) + values.checks))}
                          title={translateUi("Tira {0}", translateUi(abilities[i]))}
                          key={i}
                          onClick={() =>
                            performRoll(
                              abilities[i],
                              20,
                              mod(n) + values.checks,
                            )
                          }
                        >
                          <span>{translateUi(abilities[i].slice(0, 3).toUpperCase())}</span>
                          <strong>{signed(mod(n) + values.checks)}</strong>
                          <small>{n}</small>
                        </button>
                      ))}
                    </div>
                    <div className="ability-bottom">
                      <span>
                        <span className="tiny-diamond" />{translateUi("Bonus di competenza")}{" "}
                        <strong>+{proficiency}</strong>
                      </span>
                      <button
                        className={char.inspiration ? "inspired" : ""}
                        onClick={() => {
                          update({ inspiration: !char.inspiration });
                          notify(
                            char.inspiration ? translateUi("Ispirazione utilizzata.") : translateUi("Ispirazione assegnata."),
                          );
                        }}
                      >
                        <Sparkles size={14} />{translateUi("Ispirazione")}{" "}
                        <span className="inspiration-box">
                          {char.inspiration && (<Check size={12} />)}
                        </span>
                      </button>
                    </div>
                  </section>
                  <section className="panel action-panel">
                    <div className="tabs">
                      {["Azioni", "Abilità", "Tratti e talenti"].map((t) => (
                        <button
                          className={tab === t ? "selected" : ""}
                          key={t}
                          onClick={() => setTab(t)}
                        >
                          {translateUi(t)}
                        </button>
                      ))}
                      <span className="tabs-end">
                        <Sword size={17} />
                      </span>
                    </div>
                    {tab === "Azioni" ? (
                      <>
                        <div className="turn-tracker">
                          <span>{translateUi("IL TUO TURNO")}</span>
                          <div>
                            {["Azione", "Bonus", "Reazione"].map((t) => (
                              <button
                                key={t}
                                className={turn.includes(t) ? "used" : ""}
                                onClick={() =>
                                  setTurn(
                                    turn.includes(t)
                                      ? turn.filter((x) => x !== t)
                                      : [...turn, t],
                                  )
                                }
                              >
                                <span>
                                  {turn.includes(t) && (<Check size={8} />)}
                                </span>
                                {translateUi(t)}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setTurn([]);
                              notify(translateUi("Nuovo turno. Azioni disponibili."));
                            }}
                            title={translateUi("Ripristina le azioni")}
                          >{translateUi("Nuovo turno")}{" "}<ArrowRight size={11} />
                          </button>
                        </div>
                        <div className="attack-head">
                          <span>{translateUi("ATTACCO")}</span>
                          <span>{translateUi("TIRO PER COLPIRE")}</span>
                          <span>{translateUi("DANNI")}</span>
                        </div>
                        {[
                          [
                            "Arco lungo",
                            "Gittata 45 / 180 m",
                            Target,
                            values.attack,
                            8,
                          ],
                          [
                            "Spada corta",
                            "Portata 1,5 m · Accurata",
                            Sword,
                            values.attack,
                            6,
                          ],
                        ].map(([name, desc, Icon, bonus, sides]) => (
                          <div className="attack-row" key={name}>
                            <div className="attack-name">
                              <span className="attack-icon">
                                <Icon size={20} />
                              </span>
                              <div>
                                <strong>{translateUi(name)}</strong>
                                <small>{translateUi(desc)}</small>
                              </div>
                            </div>
                            <button
                              className="roll-badge"
                              aria-label={translateUi("Tira per colpire con {0}, {1}", name, signed(bonus))}
                              onClick={() => performRoll(name, 20, bonus)}
                            >
                              <Dice5 size={14} />{translateUi("Colpisci")}{" "}{signed(bonus)}
                            </button>
                            <button
                              className="damage-badge"
                              aria-label={translateUi("Tira danni con {0}, 1d{1} {2}", name, sides, signed(values.damage))}
                              onClick={() =>
                                performRoll(
                                  `Danni · ${translateUi(name)}`,
                                  sides,
                                  values.damage,
                                )
                              }
                            >{translateUi("1d")}{translateUi(sides)} {signed(values.damage)}
                              <ArrowUpRight size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="action-footer">
                          <button onClick={() => setModal("actions")}>
                            <Plus size={14} />{translateUi("Tutte le azioni")}{" "}</button>
                        </div>
                      </>
                    ) : tab === "Abilità" ? (
                      <div className="skills-list">
                        <label className="search-field">
                          <Search size={15} />
                          <input
                            aria-label={translateUi("Cerca abilità")}
                            placeholder={translateUi("Cerca un’abilità…")}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                        </label>
                        {filtered.map(([name, i, prof]) => (
                          <button
                            className="skill-row"
                            key={name}
                            onClick={() =>
                              performRoll(
                                name,
                                20,
                                mod(char.stats[i]) +
                                  (prof ? proficiency : 0) +
                                  values.checks,
                              )
                            }
                          >
                            <span>
                              <i className={prof ? "trained" : ""} />
                              {translateUi(name)}
                              <small>
                                {translateUi(abilities[i].slice(0, 3).toUpperCase())}
                              </small>
                            </span>
                            <b>
                              {signed(
                                mod(char.stats[i]) +
                                  (prof ? proficiency : 0) +
                                  values.checks,
                              )}
                            </b>
                          </button>
                        ))}
                        {!filtered.length && (
                          <p className="empty">{translateUi("Nessuna abilità trovata.")}</p>
                        )}
                      </div>
                    ) : (
                      <div className="traits">
                        {[
                          [
                            "Nemico prescelto",
                            "Hai esperienza nel seguire le tracce dei tuoi nemici e ricordare informazioni su di loro.",
                          ],
                          [
                            "Esploratore nato",
                            "Le foreste sono il tuo terreno favorito. Sai orientarti, trovare cibo e seguire le tracce.",
                          ],
                          [
                            "Scurovisione",
                            "Puoi vedere in luce fioca entro 18 metri come se fosse luce intensa.",
                          ],
                        ].map(([a, b]) => (
                          <article key={a}>
                            <Leaf size={17} />
                            <div>
                              <h4>{translateUi(a)}</h4>
                              <p>{translateUi(b)}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
                <div className="dashboard-right">
                  <section className="panel ready-panel">
                    <div className="panel-heading">
                      <h3>{translateUi("Risorse e recupero")}</h3>
                      <span className="live-dot" />
                    </div>
                    <div className="rest-buttons">
                      <button
                        className="button secondary"
                        onClick={() => {
                          setRestDice(1);
                          setModal("shortRest");
                        }}
                      >
                        <Flame size={16} />{translateUi("Riposo breve")}{" "}</button>
                      <button
                        className="button secondary"
                        onClick={() => setModal("longRest")}
                      >
                        <Moon size={16} />{translateUi("Riposo lungo")}{" "}</button>
                    </div>
                    <div className="resources">
                      <span>{translateUi("Slot incantesimo")}{" "}
                        <small>{translateUi("1° livello ·")}{" "}{char.slots}/{maxSlots}
                        </small>
                      </span>
                      <div>
                        {Array.from(
                          { length: Math.min(20, maxSlots) },
                          (_, i) => (
                            <button
                              key={i}
                              aria-label={translateUi("Slot {0}, {1}", i + 1, translateUi(i < char.slots ? "disponibile" : "usato"))}
                              className={`slot ${i < char.slots ? "available" : ""}`}
                              onClick={() =>
                                manualUpdate(
                                  { slots: i < char.slots ? i : i + 1 },
                                  `Slot impostati manualmente a ${i < char.slots ? i : i + 1}.`,
                                )
                              }
                            />
                          ),
                        )}
                      </div>
                    </div>
                    <div className="resources">
                      <span>{translateUi("Dadi vita")}{" "}<small>{translateUi("d10")}</small>
                      </span>
                      <strong>
                        {char.hitDice} <small>/ {values.maxHitDice}</small>
                      </strong>
                    </div>
                  </section>
                  <section className="level-card">
                    <div className="level-icon">
                      <Sparkles size={21} />
                    </div>
                    <h3>{translateUi("Livello")}{" "}{char.level + 1}</h3>
                    <button onClick={() => setModal("level")}>{translateUi("Avanza di livello")}{" "}<ArrowRight size={16} />
                    </button>
                  </section>
                </div>
              </div>
              <section className="session-strip">
                <span className="session-icon">
                  <BookOpen size={20} />
                </span>
                <div>
                  <small>{translateUi("DIARIO")}</small>
                </div>
                <button onClick={() => setPage("Diario")}>{translateUi("Apri il diario")}{" "}<ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {page === "Incantesimi" && !char.rules && (
            <>
              <section className="panel spell-summary">
                <Sparkles />
                <div>
                  <h3>{translateUi("La tua magia")}</h3>
                  <p>{translateUi("Caratteristica da incantatore: Saggezza · CD")}{" "}
                    {values.spellDc}{" "}{translateUi("· Attacco")}{" "}{signed(values.spellAttack)}
                  </p>
                </div>
                <span className="pill">{char.slots}{" "}{translateUi("slot disponibili")}</span>
              </section>
              <div className="spell-grid">
                {spells.map((s) => (
                  <section className="panel spell-card" key={s.name}>
                    <s.icon size={27} />
                    <span className="eyebrow">{translateUi(s.type)}</span>
                    <h2>{translateUi(s.name)}</h2>
                    <div className="spell-meta">
                      <span>{translateUi(s.time)}</span>
                      <span>{translateUi(s.range)}</span>
                    </div>
                    <p>{translateUi(s.desc)}</p>
                    <span className="pill">{translateUi(s.tag)}</span>
                    <button
                      className="button primary"

                      onClick={() => {
                        manualUpdate(
                          { slots: Math.max(0, char.slots - 1) },
                          `${s.name}: ${char.slots > 0 ? "consumato uno slot" : "lanciato senza slot, eccezione del tavolo"}.`,
                        );
                        if (s.name === "Cura ferite") {
                          const amount = performRoll(
                            "Cura ferite",
                            8,
                            mod(char.stats[4]),
                          );
                          update({
                            hp: Math.max(
                              char.hp,
                              Math.min(effectiveMaxHp, char.hp + amount),
                            ),
                            slots: Math.max(0, char.slots - 1),
                          });
                        }
                        notify(
                          translateUi("{0} lanciato. {1}", translateUi(s.name), translateUi(char.slots > 0 ? "Uno slot utilizzato." : "Eccezione senza slot registrata.")),
                        );
                      }}
                    >
                      <Sparkles size={16} />{" "}
                      {char.slots > 0 ? translateUi("Lancia incantesimo") : translateUi("Lancia senza slot · eccezione")}
                    </button>
                  </section>
                ))}
              </div>
              <p className="demo-note">{translateUi("Selezione dimostrativa di incantesimi. Gli effetti diversi dalla guarigione si gestiscono al tavolo.")}{" "}</p>
            </>
          )}
          {page === "Inventario" && !char.rules && (
            <section className="panel inventory">
              <div className="panel-heading">
                <h3>{translateUi("Il tuo equipaggiamento")}</h3>
                <span className="gold">◈ {char.gold}{" "}{translateUi("MO")}</span>
                <button
                  className="button secondary"
                  onClick={() => setModal("item")}
                >
                  <Plus size={15} />{translateUi("Aggiungi oggetto")}{" "}</button>
              </div>
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label={translateUi("Cerca oggetto")}
                  placeholder={translateUi("Cerca nello zaino…")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {char.inventory
                .filter((i) =>
                  i.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((item) => (
                  <div className="inventory-row" key={item.name}>
                    <span className="attack-icon">
                      <Backpack size={21} />
                    </span>
                    <div className="item-description">
                      <strong>{item.name}</strong>
                      <small>{item.detail}</small>
                    </div>
                    {item.equipped && (
                      <span className="pill">{translateUi("Equipaggiato")}</span>
                    )}
                    <span className="item-weight">
                      {(item.weight * item.qty).toLocaleString(translateUi.locale)}{" "}{translateUi("kg")}{" "}</span>
                    <div className="quantity">
                      <button
                        aria-label={translateUi("Riduci {0}", item.name)}
                        onClick={() =>
                          update({
                            inventory: char.inventory.map((i) =>
                              i.name === item.name
                                ? { ...i, qty: Math.max(0, i.qty - 1) }
                                : i,
                            ),
                          })
                        }
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.qty}</span>
                      <button
                        aria-label={translateUi("Aumenta {0}", item.name)}
                        onClick={() =>
                          update({
                            inventory: char.inventory.map((i) =>
                              i.name === item.name
                                ? { ...i, qty: i.qty + 1 }
                                : i,
                            ),
                          })
                        }
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    {item.name === "Pozione di guarigione" ? (
                      <button
                        className="button secondary"
                        disabled={!item.qty}
                        onClick={() => {
                          const n = performRoll(
                            "Pozione di guarigione",
                            4,
                            2,
                            2,
                          );
                          update({
                            hp: Math.max(
                              char.hp,
                              Math.min(effectiveMaxHp, char.hp + n),
                            ),
                            inventory: char.inventory.map((i) =>
                              i.name === item.name
                                ? { ...i, qty: i.qty - 1 }
                                : i,
                            ),
                          });
                          notify(translateUi("Recuperi {0} punti ferita.", n));
                        }}
                      >{translateUi("Usa")}{" "}</button>
                    ) : (
                      <button
                        className="icon-button"
                        aria-label={translateUi("Rimuovi {0}", item.name)}
                        onClick={() =>
                          update({
                            inventory: char.inventory.filter(
                              (i) => i.name !== item.name,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              <div className="inventory-total">{translateUi("Peso totale")}{" "}
                <strong>
                  {char.inventory
                    .reduce((a, i) => a + i.qty * i.weight, 0)
                    .toLocaleString(translateUi.locale)}{" "}{" "}{translateUi("kg")}{" "}</strong>
              </div>
            </section>
          )}
          {page === "Diario" && !char.rules && (
            <div className="journal-grid">
              <section className="panel journal">
                <span className="eyebrow">{translateUi("LE MINIERE PERDUTE DI PHANDELVER")}{" "}</span>
                <h2>{translateUi("Appunti di un viaggio")}</h2>
                <textarea
                  aria-label={translateUi("Appunti di avventura")}
                  value={char.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                  placeholder={translateUi("Oggi la nostra compagnia…")}
                />
                <div className="journal-footer">
                  <Check size={14} />{translateUi("Le tue parole vengono salvate automaticamente.")}{" "}</div>
              </section>
              <section className="panel roll-history">
                <h3>{translateUi("La fortuna, finora")}</h3>
                {char.logs.length ? (
                  char.logs.map((l) => (
                    <div className="history-row" key={l.id}>
                      <Dice5 size={18} />
                      <div>
                        <strong>{translateUi(l.label)}</strong>
                        <small>
                          {translateUi(l.values.join(" + "))}{" "}
                          {l.bonus ? `${signed(l.bonus)}` : ""} ·{" "}
                          {l.expression || (translateUi("d{0}", l.sides))}
                        </small>
                      </div>
                      <b>{l.total}</b>
                    </div>
                  ))
                ) : (
                  <div className="empty">{translateUi("La storia aspetta il tuo primo tiro.")}{" "}</div>
                )}
              </section>
            </div>
          )}
          {page === "Campagna" && <OnlineCampaignPanel cloud={cloud} character={char} localCampaign={campaign} onInspect={inspectSharedSheet}
            onCreateCharacter={() => { setCreatingForCampaign(false); setCreatorSeed({ editionId: cloud.campaign.edition_id }); setModal("rulesCreate"); }} />}
          {page === "Campagna" && !cloud.campaign && (<CampaignPanel campaign={campaign} character={char} onSave={updateCampaign} onPage={setPage}
            onSelectCharacter={() => setModal("chooseCharacter")}
            onCreateCharacter={() => { setCreatingForCampaign(true); setCreatorSeed({ editionId: campaign.editionId }); setModal("rulesCreate"); }} />)}
          {char.rules && (<RulesCharacter
              character={char}
              onChange={changeRulesCharacter}
              page={page}
              onRoll={performRoll}
              onFormula={(formula, label) => recordRoll({ ...rollFormula(formula, rollDie), label })}
              onModal={setModal}
            />)}
          {char.rules && page === "Panoramica" && characterChecklist(char).some(item => !item.done) && <details className="character-preparation">
            <summary>{translateUi("Da completare prima di giocare ·")}{" "}{characterChecklist(char).filter(item => !item.done).length}{" "}{translateUi("sezioni")}</summary>
            {characterChecklist(char).map(item => <button className="button secondary" key={item.label} onClick={() => item.target === "edit" ? setModal("edit") : (setPage(item.target), item.target === "Panoramica" && setTimeout(() => document.querySelector(`[aria-label="${translateUi('Filtra abilità')}"]`)?.focus(), 0))}>{item.done ? "✓ " : ""}{translateUi(item.label)}</button>)}
          </details>}
          {page === "Schermo del DM" && cloud.campaign && <SharedCampaignRoster cloud={cloud} onInspect={inspectSharedSheet} />}
          {page === "Schermo del DM" && (<DungeonMaster
              character={char}
              campaign={activeCampaign}
              onDice={() => setModal("dice")}
              onSession={() =>
                document
                  .querySelector(".session-integration")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            />)}
          <SessionPanel
            campaign={activeCampaign}
            active={page === "Campagna" || page === "Schermo del DM"}
            hp={char.hp}
            maxHp={effectiveMaxHp}
            onManageHp={() => setModal("hp")}
            onShortRest={() => {
              setRestDice(1);
              setModal("shortRest");
            }}
            onLongRest={() => setModal("longRest")}
          />
          {page === "Scheda personaggio" && (
            <div className="sheet-toolbar">
              <div>
                <ScrollText size={18} />
                <span>{translateUi("Scheda")}{" "}{translateUi(EDITIONS[char.editionId || "5e-2014"].label)}{" "}{translateUi("adattata")}{" "}
                  <small>{translateUi("Sincronizzata con il personaggio attivo")}</small>
                </span>
              </div>
              <button
                className="button secondary"
                onClick={() => setModal("edit")}
              >
                <Feather size={14} />{translateUi("Modifica valori")}{" "}</button>
              <button className="button primary" onClick={() => window.print()}>
                <Printer size={15} />{translateUi("Stampa / Salva PDF")}{" "}</button>
              <p>{translateUi("Scrivi direttamente nei campi della scheda. Le modifiche vengono salvate automaticamente.")}{" "}</p>
            </div>
          )}
          {page === "Scheda personaggio" && (
            <div className="official-sheet-links">
              <span>{translateUi("Modelli originali vuoti, dal sito ufficiale")}</span>
              <a
                href="https://media.wizards.com/2016/dnd/downloads/5E_CharacterSheet_Fillable.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >{translateUi("D&D 5e 2014")}{" "}<ArrowUpRight size={13} />
              </a>
              <a
                href="https://media.dndbeyond.com/compendium-images/phb/downloads/DnD_2024_Character-Sheet.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >{translateUi("D&D 2024 / 5.5e")}{" "}<ArrowUpRight size={13} />
              </a>
            </div>
          )}
          {!char.rules && (<CharacterSheet
              key={char.id}
              onChange={update}
              character={{ ...char, maxHp: effectiveMaxHp }}
              values={values}
              tableRules={rules}
              abilities={abilities}
              skills={skills}
              spells={spells}
              proficiency={proficiency}
              maxSlots={maxSlots}
              turn={turn}
              active={page === "Scheda personaggio"}
            />)}
          {char.rules && (<RulesPrint
              key={char.id}
              onChange={update}
              character={char}
              active={page === "Scheda personaggio"}
            />)}
          <footer className="page-footer">
            <span>{translateUi("Fable · Demo interattiva")}</span>
          </footer>
        </main>
      </div>
      {roll && modal !== "dice" && (
        <div className="roll-result" role="status" key={roll.id}>
          <span className="dice-symbol">
            <Dice5 size={27} />
          </span>
          <div>
            <small>{translateUi(roll.label)}</small>
            <strong>
              {roll.total}
              <span>
                {translateUi(roll.values.join(" + "))}{" "}
                {roll.bonus ? `${signed(roll.bonus)}` : ""}
              </span>
            </strong>
            {roll.sides === 20 &&
              roll.values.length === 1 &&
              roll.values[0] === 20 && (
                <small className="critical">{translateUi("20 naturale!")}</small>
              )}
          </div>
          <button
            aria-label={translateUi("Chiudi risultato")}
            className="icon-button"
            onClick={() => setRoll(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {translateUi(toast)}
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            className={`modal${modal === "sharedSheet" ? " shared-sheet-dialog" : ""}${modal === "tableRules" || modal === "settings" ? " settings-modal" : ""}`}
            lang={
              language
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const els = [
                  ...e.currentTarget.querySelectorAll(
                    "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary",
                  ),
                ].filter(
                  (element) =>
                    element.tabIndex >= 0 &&
                    (element.checkVisibility
                      ? element.checkVisibility()
                      : element.getClientRects().length > 0),
                );
                const first = els[0],
                  last = els.at(-1);
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <button
              ref={closeRef}
              className="modal-close icon-button"
              aria-label={language === "en" ? translateUi("Close dialog") : translateUi("Chiudi finestra")}
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "sharedSheet" && <>
              <h2 id="modal-title">{translateUi("Scheda condivisa · sola lettura")}</h2>
              {inspectedSheet ? <fieldset disabled aria-label={translateUi("Scheda condivisa · sola lettura")}>
                {inspectedSheet.data.rules ? <RulesPrint character={inspectedSheet.data} active onChange={() => {}} /> : <CharacterSheet
                  character={{ ...inspectedSheet.data, maxHp: characterValues(inspectedSheet.data).maxHp }} active onChange={() => {}} abilities={abilities} skills={skills} spells={spells}
                  values={characterValues(inspectedSheet.data)} tableRules={rulesFor(inspectedSheet.data)}
                  proficiency={characterValues(inspectedSheet.data).proficiency} maxSlots={characterValues(inspectedSheet.data).maxSlots} turn={[]} />}
              </fieldset> : <p>{translateUi("La scheda non è più disponibile.")}</p>}
            </>}
            {modal === "dataConnections" && (<DataConnections />)}
            {modal === "tableRules" && (<TableRules
                character={char}
                values={values}
                onChange={setChar}
              />)}
            {modal === "rulesCreate" && (<CharacterCreator
                seed={creatorSeed}
                onCreate={createNewCharacter}
              />)}
            {char.rules && (modal === "shortRest" || modal === "longRest") && (<RulesRestDialog
                character={char}
                onChange={changeRulesCharacter}
                onClose={() => setModal(null)}
                long={modal === "longRest"}
              />)}
            {char.rules && modal === "level" && (<RulesLevelDialog
                character={char}
                onChange={changeRulesCharacter}
                onClose={() => setModal(null)}
              />)}
            {modal === "chooseCharacter" && <>
              <h2 id="modal-title">{translateUi("Scegli un personaggio")}</h2>
              <div className="character-menu-actions">{characters.filter(c => !campaign || c.editionId === campaign.editionId).map(c => <button className="button secondary" key={c.id} onClick={() => { setChar(c); setTurn([]); setModal(null); }}>{c.name} · {translateUi(EDITIONS[c.editionId].label)}</button>)}</div>
              {!characters.some(c => !campaign || c.editionId === campaign.editionId) && <p>{translateUi("Nessuna scheda per questo regolamento.")}</p>}
            </>}
            {modal === "edit" && (<EditCharacterDialog character={char} onSave={setChar} onClose={() => setModal(null)} />)}
            {modal === "preparation" && <>
              <h2 id="modal-title">{translateUi("Prepara")}{" "}{char.name}</h2>
              <p>{translateUi("Dati da completare dal manuale.")}</p>
              <div className="character-menu-actions">{characterChecklist(char).map(item => <button className="button secondary" key={item.label} onClick={() => {
                setModal(item.target === "edit" ? "edit" : null);
                if (item.target !== "edit") { setPage(item.target); if (item.target === "Panoramica") setTimeout(() => document.querySelector(`[aria-label="${translateUi('Filtra abilità')}"]`)?.focus(), 0); }
              }}>{item.done ? "✓ " : ""}{translateUi(item.label)}</button>)}</div>
            </>}
            {modal === "characterMenu" && <>
              <h2 id="modal-title">{translateUi("Il tuo personaggio")}</h2>
              <div className="character-menu-actions">
                {char.rules && <button className="button secondary" onClick={() => setModal("preparation")}>{translateUi("Completa preparazione ·")}{" "}{characterChecklist(char).filter(item => !item.done).length}{" "}{translateUi("sezioni")}</button>}
                <button className="button primary" onClick={() => setModal("edit")}>{translateUi("Modifica scheda")}</button>
                <button className="button secondary" onClick={() => setModal("level")}>{translateUi("Passa di livello")}</button>
                <button className="button secondary" onClick={openWizard}>{translateUi("Nuovo personaggio")}</button>
                <button className="button secondary" onClick={() => window.print()}>{translateUi("Stampa scheda")}</button>
                <button className="button secondary" onClick={() => { setModal(null); setPage("Campagna"); }}>{translateUi("La mia campagna")}</button>
                <button className="button secondary" onClick={() => { setModal(null); setPage("Schermo del DM"); }}>{translateUi("Schermo del DM")}</button>
                <button className="button secondary" onClick={() => setModal("dataConnections")}>{translateUi("Salvataggi e backup")}</button>
                <button className="button secondary" onClick={() => setModal("settings")}>{translateUi("Importa, esporta e impostazioni")}</button>
              </div>
            </>}
            {modal === "hp" && (
              <>
                <Heart className="modal-emblem" />
                <div className="eyebrow">{translateUi("PRENDITI CURA DEL TUO EROE")}</div>
                <h2 id="modal-title">{translateUi("Punti ferita")}</h2>
                <div className="big-number">
                  {char.hp}
                  <small>/ {effectiveMaxHp}</small>
                </div>
                {char.rules?.tempHp > 0 && <p>{char.rules.tempHp}{" "}{translateUi("PF temporanei")}</p>}
                <button
                  className="button secondary full"
                  onClick={() => setModal("tableRules")}
                >{translateUi("Imposta PF o risorse oltre il massimo")}{" "}</button>
                <label className="field">{translateUi("Quantità")}{" "}<input
                    type="number"
                    min="1"
                    max="999"
                    value={damage}
                    onChange={(e) =>
                      setDamage(
                        Math.max(1, Math.trunc(Number(e.target.value)) || 1),
                      )
                    }
                  />
                </label>
                <div className="modal-actions">
                  <button
                    className="button danger"
                    onClick={() => {
                      if (char.rules) setChar(c => adjustHP(c, -damage));
                      else manualUpdate(
                        { hp: Math.max(0, char.hp - damage) },
                        `Danni manuali: ${damage} PF.`,
                      );
                      notify(translateUi("{0} danni subiti.", damage));
                    }}
                  >
                    <Minus size={16} />{translateUi("Subisci danni")}{" "}</button>
                  <button
                    className="button primary"
                    onClick={() => {
                      if (char.rules) setChar(c => adjustHP(c, damage));
                      else manualUpdate(
                        {
                          hp: Math.max(
                            char.hp,
                            Math.min(effectiveMaxHp, char.hp + damage),
                          ),
                        },
                        `Guarigione manuale: ${damage} PF richiesti.`,
                      );
                      notify(translateUi("{0} punti di guarigione applicati.", damage));
                    }}
                  >
                    <Heart size={16} />{translateUi("Guarisci")}{" "}</button>
                </div>
              </>
            )}
            {!char.rules && (modal === "shortRest" || modal === "longRest") && (
              <>
                <Moon className="modal-emblem" />
                <div className="eyebrow">{translateUi("RECUPERO AL TAVOLO")}</div>
                <h2 id="modal-title">
                  {modal === "longRest" ? translateUi("Riposo lungo") : translateUi("Riposo breve")}
                </h2>
                <p>{translateUi("Le risorse sopra il massimo restano disponibili.")}{" "}</p>
                <div className="rest-options">
                  {modal === "longRest" &&
                    [
                      ["hp", "Recupera punti ferita"],
                      ["slots", "Recupera slot"],
                      ["hitDice", "Recupera dadi vita"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={restOptions[key]}
                          onChange={(e) =>
                            setRestOptions({
                              ...restOptions,
                              [key]: e.target.checked,
                            })
                          }
                        />
                        {translateUi(label)}
                      </label>
                    ))}
                  <label>
                    <input
                      type="checkbox"
                      checked={restOptions.resources}
                      onChange={(e) =>
                        setRestOptions({
                          ...restOptions,
                          resources: e.target.checked,
                        })
                      }
                    />{translateUi("Recupera risorse personalizzate previste per questo riposo")}{" "}</label>
                  <label>
                    <input
                      type="checkbox"
                      checked={restOptions.expire}
                      onChange={(e) =>
                        setRestOptions({
                          ...restOptions,
                          expire: e.target.checked,
                        })
                      }
                    />{translateUi("Rimuovi gli effetti in scadenza")}{" "}</label>
                </div>
                <div className="rest-effects">
                  <strong>{translateUi("Effetti in scadenza")}</strong>
                  <p>
                    {expiringEffects(char, modal === "longRest")
                      .map((e) => e.name)
                      .join(", ") || (translateUi("Nessuno."))}
                  </p>
                  {!restOptions.expire && <p>{translateUi("Gli effetti resteranno attivi.")}</p>}
                </div>
                <div className="rest-preview">
                  <div>
                    <span>{translateUi("Punti ferita")}</span>
                    <strong>
                      {char.hp} → {restPreview.hp} / {previewValues.maxHp}
                    </strong>
                  </div>
                  <div>
                    <span>{translateUi("Dadi vita")}</span>
                    <strong>
                      {char.hitDice} →{" "}
                      {modal === "shortRest" ? char.hitDice - restDice : restPreview.hitDice}{" "}
                      / {previewValues.maxHitDice}
                    </strong>
                  </div>
                  <div>
                    <span>{translateUi("Slot di 1° livello")}</span>
                    <strong>
                      {char.slots} → {restPreview.slots} /{" "}
                      {previewValues.maxSlots}
                    </strong>
                  </div>
                  {restPreview.tableRules.resources.map((r) => (
                    <div key={r.id}>
                      <span>{r.name}</span>
                      <strong>
                        {translateUi(rules.resources.find((x) => x.id === r.id)?.current)} →{" "}
                        {r.current} / {r.max}
                      </strong>
                    </div>
                  ))}
                </div>
                {modal === "shortRest" && (
                  <label className="field">{translateUi("Dadi vita da spendere")}{" "}<select
                      value={restDice}
                      onChange={(e) => setRestDice(Number(e.target.value))}
                    >
                      <option value="0">{translateUi("Nessuno · completa il riposo senza guarigione")}{" "}</option>
                      {Array.from(
                        { length: Math.min(100, Math.floor(char.hitDice)) },
                        (_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}{" "}{translateUi("d10 · Costituzione")}{" "}
                            {signed(mod(char.stats[2]))}{" "}{translateUi("per dado")}{" "}</option>
                        ),
                      )}
                    </select>
                  </label>
                )}
                {modal === "shortRest" && (
                  <p className="rules-hint">
                    {char.hp >= effectiveMaxHp ? translateUi("PF già al massimo.") : translateUi("Recupero PF al tiro dei dadi vita.")}
                  </p>
                )}
                <button
                  className="button primary full"
                  onClick={() => rest(modal === "longRest")}
                >
                  {modal === "longRest" ? translateUi("Completa riposo lungo") : translateUi("Completa riposo breve")}
                  <Check size={16} />
                </button>
              </>
            )}
            {modal === "level" && !char.rules && (
              <>
                <Sparkles className="modal-emblem" />
                <div className="eyebrow">{translateUi("OGNI PASSO TI CAMBIA")}</div>
                <h2 id="modal-title">{translateUi("Verso il livello")}{" "}{char.level + 1}.</h2>
                <p>{translateUi("Avanzamento per milestone, deciso dal master.")}{" "}</p>
                <div className="level-benefits">
                  <span>
                    <Heart size={18} />{translateUi("Punti ferita aggiuntivi")}{" "}
                    <strong>
                      +{Math.max(1, levelHp + mod(char.stats[2]))}
                    </strong>
                  </span>
                  <span>
                    <Shield size={18} />{translateUi("Bonus di competenza")}{" "}
                    <strong>+{2 + Math.floor(char.level / 4)}</strong>
                  </span>
                  <span>
                    <Sparkles size={18} />{translateUi("Slot di 1° livello")}{" "}
                    <strong>{translateUi(slotCapacity(char.level + 1))}</strong>
                  </span>
                </div>
                <label className="field">{translateUi("Risultato del dado vita d10")}{" "}<input
                    type="number"
                    min="1"
                    max="10"
                    value={levelHp}
                    onChange={(e) =>
                      setLevelHp(
                        Math.min(
                          10,
                          Math.max(1, Math.trunc(Number(e.target.value)) || 1),
                        ),
                      )
                    }
                  />
                </label>
                <p className="demo-note">{translateUi("Aggiorna PF, competenza e risorse. Registra manualmente le nuove capacità.")}{" "}</p>
                <button
                  className="button primary full"
                  disabled={char.level >= 20}
                  onClick={() => {
                    const hp = Math.max(1, levelHp + mod(char.stats[2]));
                    update({
                      level: char.level + 1,
                      maxHp: char.maxHp + hp,
                      hp: char.hp + hp,
                      hitDice: char.hitDice + 1,
                      slots: Math.max(char.slots, slotCapacity(char.level + 1)),
                    });
                    notify(translateUi("Benvenuto al livello {0}!", char.level + 1));
                    setModal(null);
                  }}
                >{translateUi("Conferma livello")}{" "}{char.level + 1} <ArrowUpRight size={16} />
                </button>
              </>
            )}
            {modal === "dice" && (
              <>
                <Dice5 className="modal-emblem" />
                <div className="eyebrow">{translateUi("DADI LIBERI")}</div>
                <h2 id="modal-title">{translateUi("Tira i dadi")}</h2>
                <div className="dice-options">
                  {[4, 6, 8, 10, 12, 20, 100].map((n) => (
                    <button
                      className={dice === n ? "selected" : ""}
                      aria-pressed={dice === n}
                      key={n}
                      onClick={() => setDice(n)}
                    >{translateUi("d")}{n}
                    </button>
                  ))}
                </div>
                <div className="dice-fields">
                  <label className="field">{translateUi("Numero di dadi")}{" "}<input
                      type="number"
                      min="1"
                      max="20"
                      value={diceCount}
                      onChange={(e) =>
                        setDiceCount(
                          Math.min(
                            20,
                            Math.max(
                              1,
                              Math.trunc(Number(e.target.value)) || 1,
                            ),
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">{translateUi("Modificatore")}{" "}<input
                      type="number"
                      min="-99"
                      max="99"
                      value={diceBonus}
                      onChange={(e) =>
                        setDiceBonus(
                          Math.min(
                            99,
                            Math.max(
                              -99,
                              Math.trunc(Number(e.target.value)) || 0,
                            ),
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <div className="dice-formula">
                  {diceCount}{translateUi("d")}{translateUi(dice)} {diceBonus !== 0 && (signed(diceBonus))}
                  <small>{translateUi("Il totale include il modificatore.")}</small>
                </div>
                {roll && (
                  <div className="inline-roll" role="status" key={roll.id}>
                    <span>{translateUi(roll.label)}</span>
                    <strong>{roll.total}</strong>
                    <small>
                      {translateUi(roll.values.join(" + "))}
                      {roll.bonus !== 0 && (` ${signed(roll.bonus)}`)} ={" "}
                      {roll.total}
                    </small>
                  </div>
                )}
                <button
                  className="button primary full"
                  onClick={() =>
                    performRoll(
                      `Tiro libero ${diceCount}d${dice}`,
                      dice,
                      diceBonus,
                      diceCount,
                    )
                  }
                >
                  <Dice5 size={18} />{translateUi("Tira")}{" "}{diceCount}{translateUi("d")}{translateUi(dice)}{" "}
                  {diceBonus !== 0 && (signed(diceBonus))}
                </button>
                <div className="mixed-dice">
                  <label className="field">{translateUi("Formula con dadi diversi")}{" "}<input
                      value={diceFormula}
                      maxLength={120}
                      onChange={(e) => {
                        setDiceFormula(e.target.value);
                        setDiceError("");
                      }}
                      placeholder={translateUi("2d6+1d8+3")}
                    />
                  </label>
                  <p>{translateUi("Massimo 100 dadi.")}</p>
                  {diceError && (
                    <p role="alert" className="session-error">
                      {translateUi(diceError)}
                    </p>
                  )}
                  <button
                    className="button primary full"
                    onClick={rollMixedDice}
                  >{translateUi("Lancia la formula")}{" "}</button>
                  <div className="dice-copy-actions">
                    <button
                      className="button secondary"
                      onClick={() => copyRollCommand(false)}
                    >{translateUi("Copia /roll")}{" "}</button>
                    <button
                      className="button secondary"
                      onClick={() => copyRollCommand(true)}
                    >{translateUi("Copia /gmroll")}{" "}</button>
                  </div>
                  <small>{translateUi("Incollare il comando in Roll20 genera un nuovo tiro. Il risultato locale non viene trasferito.")}{" "}</small>
                </div>
              </>
            )}
            {modal === "create" && (
              <>
                <Feather className="modal-emblem" />
                <div className="eyebrow">{translateUi("UN NUOVO INIZIO · PASSO")}{" "}{wizard + 1}{" "}{translateUi("DI 3")}{" "}</div>
                <h2 id="modal-title">
                  {wizard === 0 ? translateUi("Come ti chiameranno?") : wizard === 1 ? translateUi("Trova la tua strada.") : translateUi("Il tuo eroe prende vita.")}
                </h2>
                <div className="wizard-progress">
                  {[0, 1, 2].map((n) => (
                    <i className={n <= wizard ? "done" : ""} key={n} />
                  ))}
                </div>
                {wizard === 0 ? (
                  <>
                    <label className="field">{translateUi("Nome del personaggio")}{" "}<input
                        maxLength="35"
                        placeholder={translateUi("Es. Aelin, Borin, Lyra…")}
                        value={draft.name}
                        onChange={(e) =>
                          setDraft({ ...draft, name: e.target.value })
                        }
                      />
                    </label>
                  </>
                ) : wizard === 1 ? (
                  <>
                    <label className="field">{translateUi("Origine")}{" "}<select
                        value={draft.race}
                        onChange={(e) =>
                          setDraft({ ...draft, race: e.target.value })
                        }
                      >
                        {["Elfo dei boschi", "Umano", "Nano", "Halfling"].map(
                          (n) => (
                            <option key={n}>{n}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label className="field">{translateUi("Classe")}{" "}<select
                        value={draft.className}
                        onChange={(e) =>
                          setDraft({ ...draft, className: e.target.value })
                        }
                      >
                        {["Ranger", "Guerriero", "Mago", "Ladro"].map((n) => (
                          <option key={n} disabled={n !== "Ranger"}>
                            {n}
                            {n !== "Ranger" ? translateUi(" · prossimamente") : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="demo-note">{translateUi("Demo: solo ranger.")}{" "}</p>
                  </>
                ) : (
                  <>
                    <div className="creation-summary">
                      <Leaf size={30} />
                      <h3>{draft.name}</h3>
                      <p>
                        {draft.race} · {translateUi(draft.className)}{" "}{translateUi("· Livello 1")}{" "}</p>
                      <span>{translateUi("Caratteristiche preimpostate · Equipaggiamento iniziale")}{" "}</span>
                    </div>
                    <p className="demo-note">{translateUi("Sostituirà il personaggio attivo. Esportalo prima per conservarlo.")}{" "}</p>
                  </>
                )}
                <div className="modal-actions">
                  {wizard > 0 && (
                    <button
                      className="button secondary"
                      onClick={() => setWizard(wizard - 1)}
                    >
                      <ArrowLeft size={15} />{translateUi("Indietro")}{" "}</button>
                  )}
                  <button
                    className="button primary"
                    disabled={!draft.name.trim()}
                    onClick={() => {
                      if (wizard < 2) setWizard(wizard + 1);
                      else {
                        const maxHp = 12;
                        setChar({
                          ...initial,
                          ...draft,
                          name: draft.name.trim(),
                          surname: "",
                          level: 1,
                          hp: maxHp,
                          maxHp,
                          xp: 0,
                          slots: 0,
                          hitDice: 1,
                          stats: [12, 16, 14, 10, 15, 8],
                          notes: "",
                          logs: [],
                        });
                        setPage("Panoramica");
                        setModal(null);
                        notify(translateUi("La tua avventura ha inizio."));
                      }
                    }}
                  >
                    {wizard === 2 ? translateUi("Inizia l’avventura") : translateUi("Continua")}{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            {modal === "item" && (
              <>
                <Backpack className="modal-emblem" />
                <h2 id="modal-title">{translateUi("Qualcosa per il viaggio.")}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!itemName.trim()) return;
                    if (
                      char.inventory.some(
                        (i) =>
                          i.name.toLowerCase() ===
                          itemName.trim().toLowerCase(),
                      )
                    ) {
                      notify(
                        translateUi("Oggetto già presente. Aumenta la quantità nello zaino."),
                      );
                      return;
                    }
                    update({
                      inventory: [
                        ...char.inventory,
                        {
                          name: itemName.trim(),
                          detail: "Oggetto personale",
                          qty: 1,
                          weight: 0,
                        },
                      ],
                    });
                    setItemName("");
                    setModal(null);
                    notify(translateUi("Oggetto aggiunto allo zaino."));
                  }}
                >
                  <label className="field">{translateUi("Nome dell’oggetto")}{" "}<input
                      required
                      maxLength="60"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder={translateUi("Una mappa, un ricordo, un tesoro…")}
                    />
                  </label>
                  <button className="button primary full" type="submit">
                    <Plus size={16} />{translateUi("Aggiungi allo zaino")}{" "}</button>
                </form>
              </>
            )}
            {modal === "actions" && (
              <>
                <Sword className="modal-emblem" />
                <h2 id="modal-title">{translateUi("Cosa puoi fare nel tuo turno")}</h2>
                <div className="traits">
                  {[
                    [
                      "Attaccare",
                      "Effettua un attacco con un’arma. Tira dalla scheda e comunica il risultato al master.",
                    ],
                    [
                      "Scattare",
                      "Ottieni movimento extra pari alla tua velocità per questo turno.",
                    ],
                    [
                      "Disimpegnarsi",
                      "Il tuo movimento non provoca attacchi di opportunità per il resto del turno.",
                    ],
                    [
                      "Schivare",
                      "Gli attacchi che vedi contro di te hanno svantaggio, fino al tuo prossimo turno.",
                    ],
                    [
                      "Aiutare o nascondersi",
                      "Aiuta un compagno in una prova oppure tenta una prova di Furtività.",
                    ],
                  ].map(([a, b]) => (
                    <article key={a}>
                      <ChevronRight size={18} />
                      <div>
                        <h4>{translateUi(a)}</h4>
                        <p>{translateUi(b)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
            {modal === "help" && (
              <>
                <BookOpen className="modal-emblem" />
                <h2 id="modal-title">{translateUi("Guida rapida")}</h2>
                <div className="traits">
                  {[
                    [
                      "Esplora la scheda",
                      "Tocca un valore per tirare.",
                    ],
                    [
                      "Tieni traccia delle risorse",
                      "PF dal pulsante +. Recupera le risorse con i riposi.",
                    ],
                    [
                      "Fai crescere la storia",
                      "Diario per gli appunti, avanzamento su indicazione del master.",
                    ],
                  ].map(([a, b]) => (
                    <article key={a}>
                      <Check size={17} />
                      <div>
                        <h4>{translateUi(a)}</h4>
                        <p>{translateUi(b)}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="demo-note">{translateUi("Demo D&D 5e con regole semplificate. Non ufficiale.")}{" "}</p>
              </>
            )}
            {modal === "appearance" && (
              <>
                <Palette className="modal-emblem" />
                <div className="eyebrow">{translateUi("IL TUO TAVOLO, IL TUO STILE")}</div>
                <h2 id="modal-title">{translateUi("Aspetto")}</h2>
                <fieldset className="appearance-group">
                  <legend>{translateUi("Aspetto")}</legend>
                  <div className="theme-options">
                    {[
                      ["dark", "Scuro"],
                      ["light", "Chiaro"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        className={appearance.mode === value ? "selected" : ""}
                        aria-pressed={appearance.mode === value}
                        onClick={() =>
                          setAppearance({ ...appearance, mode: value })
                        }
                      >
                        {value === "dark" ? <Moon size={17} /> : <Sparkles size={17} />}
                        {translateUi(label)}
                        {appearance.mode === value && (<Check size={15} />)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="appearance-group">
                  <legend>{translateUi("Colore d'accento")}</legend>
                  <div className="color-swatches">
                    {[
                      ["#d99a68", "Rame"],
                      ["#81a9e8", "Inchiostro"],
                      ["#df8a9b", "Bordeaux"],
                      ["#bc9fea", "Ametista"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        style={{ "--swatch": value }}
                        className={
                          appearance.accent === value ? "selected" : ""
                        }
                        aria-label={translateUi(label)}
                        aria-pressed={appearance.accent === value}
                        onClick={() =>
                          setAppearance({ ...appearance, accent: value })
                        }
                      >
                        <span />
                        {translateUi(label)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="custom-color">{translateUi("Colore personalizzato")}{" "}<div>
                    <input
                      type="color"
                      aria-label={translateUi("Colore personalizzato")}
                      value={appearance.accent}
                      onChange={(e) =>
                        setAppearance({ ...appearance, accent: e.target.value })
                      }
                    />
                    <span>{translateUi(appearance.accent.toUpperCase())}</span>
                  </div>
                </label>
                <div className="appearance-preview">
                  <Dice5 size={23} />
                  <div>
                    <strong>{translateUi("Un assaggio della tua avventura")}</strong>
                    <small>{translateUi("Pulsanti, tiri e dettagli seguono il tuo colore.")}{" "}</small>
                  </div>
                  <Check size={18} />
                </div>
                <button
                  className="button secondary full"
                  onClick={() =>
                    setAppearance({ mode: "dark", accent: "#d99a68" })
                  }
                >{translateUi("Ripristina aspetto predefinito")}{" "}</button>
              </>
            )}
            {modal === "settings" && (
              <>
                <div className="rules-title">
                  <Settings size={18} />
                  <h2 id="modal-title">
                    {settingsText("Impostazioni", "Settings")}
                  </h2>
                </div>
                <button
                  className="button secondary full"
                  onClick={() => setModal("appearance")}
                >
                  <Palette size={17} />{" "}
                  {settingsText("Colori e aspetto", "Colors and appearance")}
                </button>
                <button className="button secondary full" onClick={() => setModal("dataConnections")}>{translateUi("Salvataggi e backup")}</button>
                <p>
                  {settingsText(
                    "Salvataggio locale. Usa un backup per trasferire i dati.",
                    "Saved locally. Use a backup to transfer your data.",
                  )}
                </p>
                <button
                  className="button primary full"
                  onClick={() => {
                    const a = document.createElement("a");
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(char, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    a.href = url;
                    a.download = `fable-${char.name}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    notify(
                      settingsText(
                        "Personaggio esportato.",
                        "Character exported.",
                      ),
                    );
                  }}
                >
                  <ArrowDown size={16} />{" "}
                  {settingsText("Esporta personaggio", "Export character")}
                </button>
                <label className="button secondary full import-button">
                  {settingsText("Importa personaggio", "Import character")}
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      try {
                        const data = parseCharacterSave(
                          await e.target.files[0].text(),
                        );
                        setChar({ ...initial, ...data });
                        setModal(null);
                        notify(
                          settingsText(
                            "Personaggio importato.",
                            "Character imported.",
                          ),
                        );
                      } catch {
                        notify(
                          settingsText(
                            "File non valido. Usa un’esportazione di Fable.",
                            "Invalid file. Use a Fable character export.",
                          ),
                        );
                      }
                    }}
                  />
                </label>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<LanguageProvider><App /></LanguageProvider>);

if (!window.fableDesktop && import.meta.env.PROD && 'serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: './' }).catch(() => {}));
}
