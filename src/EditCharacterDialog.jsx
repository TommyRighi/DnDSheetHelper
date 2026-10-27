import { useTranslation } from './i18n.jsx';
import React, { useState } from 'react';
import { RulesEditDialog } from './rules/RulesCharacter.jsx';
import { parseCharacterSave } from './storage.js';

export default function EditCharacterDialog({ character, onSave, onClose }) {
  const translateUi = useTranslation();
  const [draft, setDraft] = useState(() => structuredClone(character));
  const [error, setError] = useState('');
  const save = () => {
    try {
      parseCharacterSave(JSON.stringify(draft));
      onSave(draft);
      onClose();
    } catch {
      setError(translateUi('Inserisci un nome e valori validi prima di salvare.'));
    }
  };
  return <div className="draft-editor">
    {draft.rules ? <RulesEditDialog character={draft} onChange={setDraft} onClose={save} /> : <>
      <h2 id="modal-title">{translateUi("Il tuo personaggio")}</h2>
      {[['name', 'Nome'], ['surname', 'Soprannome']].map(([key, label]) => <label className="field" key={key}>{translateUi(label)}
        <input value={draft[key]} maxLength={key === 'name' ? 35 : 45} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
      </label>)}
      <div className="edit-stats">{['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'].map((label, i) => <label className="field" key={label}>{translateUi(label)}
        <input type="number" min="1" max="1000" value={draft.stats[i]} onChange={e => setDraft({ ...draft, stats: draft.stats.map((v, j) => j === i ? Number(e.target.value) : v) })} />
      </label>)}</div>
      <button className="button primary full" onClick={save}>{translateUi("Salva modifiche")}</button>
    </>}
    {error && <p role="alert" className="session-error">{translateUi(error)}</p>}
    <button className="button secondary full" onClick={onClose}>{translateUi("Annulla")}</button>
  </div>;
}
