import { useTranslation } from './i18n.jsx';
import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Compass,
  ExternalLink,
  Flame,
  Globe,
  Heart,
  Link,
  Maximize2,
  Minimize2,
  Moon,
  Pencil,
  RotateCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  normalizeSessionUrl,
  isRoll20Url,
  readSession,
  SESSION_STORAGE_KEY,
} from "./session.js";
import "./session.css";

export default function SessionPanel({
  active,
  campaign,
  hp,
  maxHp,
  onManageHp,
  onShortRest,
  onLongRest,
}) {
  const translateUi = useTranslation();
  const [session, setSession] = useState(() => readSession(localStorage));
  const [editing, setEditing] = useState(!session);
  const [name, setName] = useState(session?.name || "La mia sessione");
  const [url, setUrl] = useState(session?.url || "");
  const [address, setAddress] = useState(session?.url || "");
  const [frameUrl, setFrameUrl] = useState("");
  const [error, setError] = useState("");
  const [browserError, setBrowserError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [reload, setReload] = useState(0);
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!active) setExpanded(false);
  }, [active]);
  useEffect(() => {
    if (!frameUrl) return;
    setWaiting(true);
    const timer = setTimeout(() => setWaiting(false), 10000);
    return () => clearTimeout(timer);
  }, [frameUrl, reload]);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", escape);
    };
  }, [expanded]);
  const roll20 = session && isRoll20Url(session.url);
  const openInside = () => {
    setFrameUrl(session.url);
    setAddress(session.url);
    setBrowserError("");
  };
  const navigate = (e) => {
    e.preventDefault();
    try {
      const next = normalizeSessionUrl(address);
      setFrameUrl(next);
      setAddress(next);
      setBrowserError("");
      setReload((n) => n + 1);
    } catch {
      setBrowserError(translateUi("Indirizzo non valido. Usa un link HTTP o HTTPS."));
    }
  };
  const save = (e) => {
    e.preventDefault();
    try {
      const next = {
        name: campaign?.name || name.trim() || "La mia sessione",
        url: normalizeSessionUrl(url),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      setUrl(next.url);
      setEditing(false);
      setError("");
      // Changing the saved destination closes the old session instead of navigating it unexpectedly.
      setFrameUrl("");
      setExpanded(false);
      setAddress(next.url);
    } catch (err) {
      setError(
        err instanceof TypeError ? translateUi("Indirizzo non valido. Controlla il link della sessione.") : err.message,
      );
    }
  };
  const remove = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      setError(translateUi("Non è stato possibile rimuovere il link dal browser."));
      return;
    }
    setSession(null);
    setFrameUrl("");
    setExpanded(false);
    setUrl("");
    setName("La mia sessione");
    setEditing(true);
    setError("");
  };
  return (
    <section
      className={`session-integration ${active ? "session-active" : ""} ${expanded ? "session-expanded" : ""}`}
      aria-label={translateUi("Piattaforma di gioco")}
    >
      <div className="panel session-link-panel">
        <div className="panel-heading">
          <h3>{campaign ? translateUi("Tavolo di {0}", campaign.name) : translateUi("Collega un tavolo online")}</h3>
          <span className="pill">
            <Link size={11} />{translateUi("Link della sessione")}{" "}</span>
        </div>
        {editing ? (
          <form className="session-form" onSubmit={save}>
            <p>{translateUi("Collega Roll20 o un’altra piattaforma.")}{" "}</p>
            <div className="session-fields">
              {!campaign && <label className="field">{translateUi("Nome della sessione")}{" "}<input
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={translateUi("La campagna del venerdì")}
                />
              </label>}
              <label className="field">{translateUi("Link alla sessione")}{" "}<input
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  maxLength={4096}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={translateUi("https://app.roll20.net/join/…")}
                />
              </label>
            </div>
            {error && (
              <p className="session-error" role="alert">
                {translateUi(error)}
              </p>
            )}
            <div className="session-form-actions">
              <span>{translateUi("Link salvato in locale.")}</span>
              {session && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setEditing(false);
                    setUrl(session.url);
                    setName(session.name);
                    setError("");
                  }}
                >{translateUi("Annulla")}{" "}</button>
              )}
              <button type="submit" className="button primary">
                <Save size={15} />{translateUi("Salva collegamento")}{" "}</button>
            </div>
          </form>
        ) : (
          <div className="saved-session">
            <span className="session-globe">
              <Globe size={23} />
            </span>
            <div>
              <h4>{campaign?.name || (session.name)}</h4>
              <a href={session.url} target="_blank" rel="noopener noreferrer">
                {session.url}
              </a>
              <small>
                <Check size={11} />{" "}
                {roll20 ? translateUi("Roll20 · Link salvato") : translateUi("Collegamento salvato")}
              </small>
            </div>
            <div className="saved-session-actions">
              <button
                className={`button ${roll20 ? "secondary" : "primary"}`}
                onClick={openInside}
              >
                <Compass size={15} />{" "}
                {roll20 ? translateUi("Prova vista incorporata") : translateUi("Apri nell’app")}
              </button>
              <a
                className={`button ${roll20 ? "primary" : "secondary"}`}
                href={session.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} />{" "}
                {roll20 ? translateUi("Apri Roll20") : translateUi("Apri nel browser")}
              </a>
              <button
                className="icon-button"
                aria-label={translateUi("Modifica collegamento")}
                onClick={() => setEditing(true)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={translateUi("Rimuovi collegamento")}
                onClick={remove}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
        {!editing && <p className="local-table-notice">{translateUi("PF, tiri e appunti non sono condivisi con il tavolo.")}</p>}
        {!editing && error && (
          <p className="session-error" role="alert">
            {translateUi(error)}
          </p>
        )}
      </div>
      {roll20 && (
        <div className="session-embed-notice">
          <p>{translateUi("La vista incorporata di Roll20 può essere bloccata. Usa “Apri Roll20”.")}{" "}</p>
          <a
            href="https://help.roll20.net/hc/en-us/articles/360039223834-Roll20-Crash-Course"
            target="_blank"
            rel="noopener noreferrer"
          >{translateUi("Guida Roll20")}{" "}<ExternalLink size={13} />
          </a>
        </div>
      )}
      {frameUrl && (
        <div className="session-browser">
          <div className="session-browser-header">
            <Globe size={17} />
            <h3>{session?.name || (translateUi("Browser della sessione"))}</h3>
            <span className="session-browser-status">
              {waiting ? translateUi("Apertura della pagina…") : translateUi("Vista incorporata")}
            </span>
            <button
              className="icon-button"
              aria-label={expanded ? translateUi("Riduci vista sessione") : translateUi("Espandi vista sessione")}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              className="icon-button"
              aria-label={translateUi("Chiudi browser interno")}
              onClick={() => {
                setFrameUrl("");
                setExpanded(false);
              }}
            >
              <X size={18} />
            </button>
          </div>
          <form className="session-address" onSubmit={navigate}>
            <button
              type="button"
              className="icon-button"
              aria-label={translateUi("Ricarica pagina della sessione")}
              onClick={() => setReload((n) => n + 1)}
            >
              <RotateCw size={16} />
            </button>
            <label>
              <span className="session-sr-only">{translateUi("Indirizzo nel browser interno")}{" "}</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="url"
                maxLength={4096}
              />
            </label>
            <button type="submit" className="button secondary">{translateUi("Vai")}{" "}<ArrowUpRight size={13} />
            </button>
            <a
              className="icon-button"
              aria-label={translateUi("Apri indirizzo corrente nel browser")}
              href={frameUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={17} />
            </a>
          </form>
          {browserError && (
            <p className="session-error" role="alert">
              {translateUi(browserError)}
            </p>
          )}
          <div className="session-quick-tools">
            <span>{translateUi("LA TUA SCHEDA")}</span>
            <button onClick={onManageHp}>
              <Heart size={14} />
              {hp} / {maxHp}{" "}{translateUi("PF")}{" "}</button>
            <button onClick={onShortRest}>
              <Flame size={14} />{translateUi("Riposo breve")}{" "}</button>
            <button onClick={onLongRest}>
              <Moon size={14} />{translateUi("Riposo lungo")}{" "}</button>
          </div>
          <div className="session-embed-notice">
            <p>{translateUi("Pagina vuota o problemi di accesso? Apri nel browser.")}{" "}</p>
            <a href={frameUrl} target="_blank" rel="noopener noreferrer">{translateUi("Apri nel browser")}{" "}<ExternalLink size={13} />
            </a>
          </div>
          <iframe
            key={`${frameUrl}-${reload}`}
            title={translateUi("Sessione di gioco: {0}", session?.name || "tavolo online")}
            src={frameUrl}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-presentation"
            allow="camera; microphone; fullscreen; autoplay; display-capture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setWaiting(false)}
            onError={() => {
              setWaiting(false);
              setBrowserError(
                translateUi("La pagina non si è aperta. Prova il collegamento nel browser."),
              );
            }}
          />
          <div className="session-browser-footer">{translateUi("La barra mostra l’indirizzo aperto da Fable. La navigazione interna della piattaforma non è visibile all’app.")}{" "}</div>
        </div>
      )}
    </section>
  );
}
