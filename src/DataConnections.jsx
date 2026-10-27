import { useTranslation } from './i18n.jsx';
import React, { useState } from 'react';
import { exportWorkspace, restoreWorkspace } from './workspace.js';
import { serializeBackup, parseBackup, backupSummary } from './backup-file.js';

const download = (workspace, format) => {
  const url = URL.createObjectURL(new Blob([serializeBackup(workspace, format)], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `fable-completo.${format}`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export default function DataConnections() {
  const translateUi = useTranslation();
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storageStatus, setStorageStatus] = useState('');
  const run = async fn => {
    setBusy(true); setError(''); setMessage('');
    try { await fn(); } catch (err) { setError(err.message || 'Operazione non riuscita.'); } finally { setBusy(false); }
  };
  const save = format => run(async () => {
    const workspace = exportWorkspace(localStorage);
    if (window.fableDesktop) { if (!await window.fableDesktop.saveBackup(workspace, format)) return; }
    else download(workspace, format);
    setMessage(translateUi("Backup completo {0} esportato.", format.toUpperCase()));
  });
  const preview = (workspace, source) => setPending({ workspace, source, summary: backupSummary(workspace) });
  return <div className="data-connections">
    <h2 id="modal-title">{translateUi("Salvataggi e backup")}</h2>
    <p>{window.fableDesktop ? translateUi('Fable desktop') : translateUi('Fable web')}{" "}{translateUi("· Salvataggio automatico su questo dispositivo.")}</p>
    <section>
      <h3>{translateUi("Dati locali")}</h3>
      <p>{translateUi("Per trasferire i dati tra web e desktop, usa un backup.")}</p>
      <p>{translateUi("Cancellare i dati del sito o usare la navigazione privata può far perdere i salvataggi. Esporta un backup.")}</p>
      {!window.fableDesktop && navigator.storage?.persist && <button className="button secondary" disabled={busy} onClick={() => run(async () => {
        const granted = await navigator.storage.persist();
        setStorageStatus(granted ? translateUi('Conservazione persistente attiva.') : translateUi('Conservazione persistente non concessa. Esporta un backup.'));
      })}>{translateUi("Proteggi dati locali")}</button>}
      {storageStatus && <p role="status">{translateUi(storageStatus)}</p>}
    </section>
    <section>
      <h3>{translateUi("Backup completo")}</h3>
      <p>{translateUi("Include personaggi, campagna, incontri, preferenze e note riservate del DM.")}</p>
      <div className="connection-actions">
        <button className="button primary" disabled={busy} onClick={() => save('json')}>{translateUi("Esporta backup JSON")}</button>
        <button className="button secondary" disabled={busy} onClick={() => save('csv')}>{translateUi("Esporta CSV")}</button>
        <label className="button secondary import-button">{translateUi("Importa JSON o CSV")}<input type="file" accept=".json,.csv,application/json,text/csv" disabled={busy} onChange={event => {
          const file = event.target.files?.[0]; event.target.value = '';
          if (!file) return;
          run(async () => {
            if (file.size > 10 * 1024 * 1024) throw new Error('File troppo grande. Limite 10 MB.');
            preview(parseBackup(await file.text()), file.name);
          });
        }} /></label>
        {localStorage.getItem('fable-workspace-before-restore') && <button className="button secondary" disabled={busy} onClick={() => run(async () => preview(parseBackup(localStorage.getItem('fable-workspace-before-restore')), 'copia locale precedente'))}>{translateUi("Recupera copia precedente")}</button>}
      </div>
      <p className="rules-help">{translateUi("Importa solo backup Fable, anche in formato CSV.")}</p>
    </section>
    {pending && <section className="restore-confirmation" role="region" aria-label={translateUi("Conferma ripristino")}>
      <h3>{translateUi("Controlla il backup")}</h3>
      <p>{pending.source} · {translateUi(pending.summary.characters)}{" "}{translateUi("personaggi ·")}{" "}{translateUi(pending.summary.encounters)}{" "}{translateUi("incontri")}</p>
      {pending.summary.campaign && <p>{translateUi("Campagna:")}{" "}{translateUi(pending.summary.campaign)}</p>}
      {pending.summary.hasDm && <p>{translateUi("Include gli appunti riservati del master.")}</p>}
      <p>{translateUi("Sostituirà i dati locali, conservando una copia recuperabile.")}</p>
      <button className="button primary" disabled={busy} onClick={() => run(async () => {
        restoreWorkspace(localStorage, pending.workspace);
        setPending(null); window.location.reload();
      })}>{translateUi("Ripristina backup")}</button>
      <button className="button secondary" disabled={busy} onClick={() => setPending(null)}>{translateUi("Annulla")}</button>
    </section>}
    {busy && <p role="status">{translateUi("Operazione in corso…")}</p>}
    {message && <p role="status">{translateUi(message)}</p>}
    {error && <p role="alert" className="session-error">{translateUi(error)}</p>}
  </div>;
}
