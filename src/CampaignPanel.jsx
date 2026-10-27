import { useTranslation } from './i18n.jsx';
import React, { useState } from 'react';
import { EDITIONS } from './rules/catalog.js';

export default function CampaignPanel({ campaign, character, onSave, onPage, onCreateCharacter, onSelectCharacter }) {
  const translateUi = useTranslation();
  const [editing, setEditing] = useState(!campaign);
  const [name, setName] = useState(campaign?.name || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [editionId, setEditionId] = useState(campaign?.editionId || character.editionId || '5e-2014');
  const [error, setError] = useState('');
  const save = async event => {
    event.preventDefault();
    try {
      onSave({ id: campaign?.id || crypto.randomUUID(), name, description, editionId, characterIds: campaign && editionId === campaign.editionId ? campaign.characterIds : [] });
      setEditing(false); setError('');
    } catch (err) { setError(err.message || 'Salvataggio della campagna non riuscito.'); }
  };
  const linked = campaign?.characterIds.includes(character.id);
  const compatible = campaign?.editionId === (character.editionId || '5e-2014');
  return <section className="campaign-workspace" aria-label={translateUi("La mia campagna")}>
    <div className="panel campaign-overview">
      <div className="eyebrow">{translateUi("CAMPAGNA LOCALE")}</div>
      <h2>{campaign?.name || (translateUi('Nuova campagna'))}</h2>
      <p>{translateUi("Dati locali. Inviti e gioco online sulla piattaforma collegata.")}</p>
      {editing ? <form className="campaign-form" onSubmit={save}>
        <label className="field">{translateUi("Nome della campagna")}<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="field">{translateUi("Regolamento della campagna")}<select aria-label={translateUi("Regolamento della campagna")} value={editionId} onChange={e => setEditionId(e.target.value)}>{Object.values(EDITIONS).map(e => <option key={e.id} value={e.id}>{translateUi(e.label)}</option>)}</select></label>
        <label className="field campaign-description">{translateUi("Descrizione della campagna")}<textarea maxLength={4000} value={description} onChange={e => setDescription(e.target.value)} placeholder={translateUi("Ambientazione, obiettivo del gruppo e accordi del tavolo…")} /></label>
        {campaign && editionId !== campaign.editionId && <p className="rules-help campaign-description">{translateUi("Cambiare regolamento scollega i personaggi. Schede e incontri restano salvati.")}</p>}
        <div className="modal-actions"><button className="button primary" type="submit">{campaign ? translateUi('Salva campagna') : translateUi('Crea campagna')}</button>{campaign && <button type="button" className="button secondary" onClick={() => setEditing(false)}>{translateUi("Annulla")}</button>}</div>
      </form> : <>
        <span className="pill">{translateUi(EDITIONS[campaign.editionId].label)}</span>
        {campaign.description && (<p className="rules-preformatted">{campaign.description}</p>)}
        <button className="button secondary" onClick={() => { setName(campaign.name); setDescription(campaign.description); setEditionId(campaign.editionId); setEditing(true); }}>{translateUi("Modifica campagna")}</button>
      </>}
      {error && <p role="alert" className="session-error">{translateUi(error)}</p>}
    </div>
    {campaign && <div className="campaign-next-steps">
      <section className="panel"><span className="eyebrow">{translateUi("MASTER")}</span><h3>{translateUi("Prepara e conduci")}</h3><p></p><button className="button primary" onClick={() => onPage('Schermo del DM')}>{translateUi("Apri schermo del DM")}</button></section>
      <section className="panel"><span className="eyebrow">{translateUi("GIOCATORE")}</span><h3>{character.name}</h3><p>{linked ? translateUi('Associato alla campagna.') : translateUi('Nessun personaggio associato.')}</p>
        <div className="campaign-character-actions">
          <button className="button secondary" onClick={onSelectCharacter}>{translateUi("Scegli personaggio")}</button>
          <button className="button secondary" onClick={onCreateCharacter}>{translateUi("Crea personaggio")}</button>
          {!linked && <button className="button primary" disabled={!compatible} onClick={() => { try { onSave({ ...campaign, characterIds: [...campaign.characterIds, character.id] }); setError(''); } catch (err) { setError(err.message); } }}>{translateUi("Associa")}{" "}{character.name}</button>}
          {linked && <button className="button primary" onClick={() => onPage('Panoramica')}>{translateUi("Gioca con")}{" "}{character.name}</button>}
        </div>
        {!compatible && <p className="rules-help">{translateUi("Serve una scheda")}{" "}{translateUi(EDITIONS[campaign.editionId].label)}.</p>}
        <button className="button secondary" onClick={() => onPage('Diario')}>{translateUi("Diario di")}{" "}{character.name}</button>
      </section>
    </div>}
  </section>;
}
