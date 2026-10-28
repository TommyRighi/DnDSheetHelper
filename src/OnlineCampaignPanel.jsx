import React, { useState } from 'react';
import { Cloud, Copy, Users, RefreshCw, BookOpen, LogOut, Shield, UserPlus, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from './i18n.jsx';
import { EDITIONS } from './rules/catalog.js';
import { cloudResult } from './cloud-client.js';
import { inviteLink, inviteToken } from './cloud-config.js';
import { characterValues, rulesFor } from './table-rules.js';
import { derive } from './rules/engine.js';
import './online-campaign.css';

export function SharedCampaignRoster({ cloud, onInspect }) {
  const t = useTranslation();
  const [search, setSearch] = useState('');
  if (!cloud.campaign) return null;
  const rows = cloud.sheets.filter(s => `${s.data.name} ${cloud.members.find(m => m.user_id === s.owner_id)?.display_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="panel shared-roster" aria-label={t('Schede della campagna')}>
    <header className="shared-section-heading"><div><span className="eyebrow">{t('IL GRUPPO')}</span><h2>{t('Schede della campagna')}</h2></div><span className="pill"><Users size={14}/>{cloud.sheets.length}</span></header>
    <p>{cloud.isDm ? t('Le schede pubblicate dai giocatori si aggiornano qui. Puoi consultarle senza modificarle.') : t('Il master può consultare le schede che condividi in questa campagna.')}</p>
    <label className="field">{t('Cerca nel gruppo')}<input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Personaggio o giocatore…')} /></label>
    <div className="shared-roster-list">
      {rows.map(row => {
        const c = row.data;
        const d = c.rules ? derive(c) : null;
        const v = d?.tableValues || characterValues(c);
        return <article className="shared-character" key={`${row.owner_id}:${row.character_id}`}>
          <div className="shared-character-identity"><span className="shared-character-avatar">{c.name.slice(0, 1)}</span><div><h3>{c.name} {c.surname}</h3><small>{cloud.members.find(m => m.user_id === row.owner_id)?.display_name || t('Giocatore')} · {t(c.className)} · {t('Livello')} {c.level}</small></div></div>
          <dl className="shared-character-stats"><div><dt>{t('PF')}</dt><dd>{c.hp}<small>/{v.maxHp}</small></dd></div><div><dt>{t('CA')}</dt><dd>{v.ac}</dd></div><div><dt>{t('Iniziativa')}</dt><dd>{v.initiative >= 0 ? '+' : ''}{v.initiative}</dd></div><div><dt>{t('Velocità')}</dt><dd>{v.speed} m</dd></div></dl>
          <p className="shared-character-resources">{t('Dadi vita')}: {c.hitDice}/{v.maxHitDice} · {t('Slot')}: {c.slots}/{v.maxSlots}</p>
          {rulesFor(c).effects.length > 0 && <p className="shared-character-effects">{t('Effetti attivi')}: {rulesFor(c).effects.map(effect => effect.name).join(', ')}</p>}
          <footer>{row.owner_id === cloud.session?.user.id && <button className="button secondary" onClick={() => cloud.adopt(row).catch(() => {})}>{t('Usa su questo dispositivo')}</button>}<small>{t('Aggiornata')} {new Date(row.updated_at).toLocaleString(t.locale)}</small><button className="button secondary" onClick={() => onInspect(row)}><BookOpen size={15}/>{t('Apri scheda')}</button></footer>
        </article>;
      })}
    </div>
    {!rows.length && <p className="shared-empty">{t('Nessuna scheda condivisa. Ogni giocatore può pubblicare il proprio personaggio dalla campagna.')}</p>}
  </section>;
}

export default function OnlineCampaignPanel({ cloud, character, localCampaign, onInspect, onCreateCharacter }) {
  const t = useTranslation();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState(localCampaign?.name || '');
  const [description, setDescription] = useState(localCampaign?.description || '');
  const [edition, setEdition] = useState(localCampaign?.editionId || character.editionId || '5e-2014');
  const [invite, setInvite] = useState(() => {
    try { return new URLSearchParams(location.hash.slice(1)).get('fable-invite') || ''; } catch { return ''; }
  });
  const [message, setMessage] = useState('');
  const submit = action => { setMessage(''); return cloud.run(action).catch(() => {}); };
  const busy = cloud.loading || cloud.saving;
  const own = cloud.sheets.filter(s => s.owner_id === cloud.session?.user.id);
  const published = own.find(s => s.character_id === character.id);
  const copyInvite = () => submit(async () => {
    const base = import.meta.env.VITE_APP_URL || (location.protocol.startsWith('http') ? location.href : '');
    const text = base ? inviteLink(cloud.token, base) : cloud.token;
    await navigator.clipboard.writeText(text); setMessage(t('Invito copiato.'));
  });
  return <section className="online-campaign" aria-label={t('Campagna condivisa')}>
    <div className="panel online-account">
      <header className="shared-section-heading"><div><span className="eyebrow">{t('INSIEME AL TAVOLO')}</span><h2>{t('Campagna condivisa')}</h2></div><Cloud size={23}/></header>
      {!cloud.configured ? <p>{t('La condivisione online sarà disponibile quando il servizio verrà configurato. Puoi continuare a usare personaggi e campagne locali.')}</p> : !cloud.authReady ? <p role="status">{t('Accesso in corso…')}</p> : !cloud.session ? <>
        <p>{t('Accedi per condividere il personaggio con il master e ritrovare le schede sui tuoi dispositivi.')}</p>
        <form className="online-form" onSubmit={event => { event.preventDefault(); submit(async () => {
          const credentials = { email: email.trim(), password };
          const { data, error } = authMode === 'signup' ? await cloud.client.auth.signUp(credentials) : await cloud.client.auth.signInWithPassword(credentials);
          if (error) throw error;
          setPassword('');
          if (authMode === 'signup' && !data.session) setMessage(t('Controlla la tua email per confermare la registrazione, poi accedi.'));
        }); }}>
          <label className="field">Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="field">Password<input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
          <div className="online-actions"><button className="button primary" disabled={busy}>{authMode === 'signup' ? t('Registrati') : t('Accedi')}</button><button type="button" className="button secondary" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>{authMode === 'signup' ? t('Ho già un account') : t('Crea un account')}</button></div>
        </form>
      </> : <>
        <div className="online-account-summary"><span>{cloud.session.user.email}</span><button className="button secondary" disabled={busy} onClick={() => submit(async () => { const { error } = await cloud.client.auth.signOut({ scope: 'local' }); if (error) throw error; })}><LogOut size={15}/>{t('Esci')}</button></div>
        <label className="field">{t('Campagna online')}<select aria-label={t('Campagna online')} value={cloud.campaign?.id || ''} onChange={e => cloud.selectCampaign(e.target.value)}><option value="">{t('Scegli o crea una campagna')}</option>{cloud.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}{c.owner_id === cloud.session.user.id ? ` · ${t('Master')}` : ''}</option>)}</select></label>
        <details className="online-connect" open={!cloud.campaign || undefined}><summary>{t('Crea una campagna o partecipa')}</summary>
          <label className="field">{t('Nome al tavolo')}<input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={80} placeholder={t('Come ti chiamano gli altri giocatori')} /></label>
          <div className="online-connect-columns">
            <form className="online-form" onSubmit={event => { event.preventDefault(); submit(async () => {
              if (!displayName.trim()) throw new Error(t('Inserisci il tuo nome al tavolo.'));
              const id = await cloudResult(cloud.client.rpc('fable_join_campaign', { p_token: inviteToken(invite), p_display_name: displayName.trim() }));
              cloud.selectCampaign(id); setInvite('');
              if (location.hash.includes('fable-invite')) history.replaceState(null, '', location.pathname + location.search);
            }); }}><h3><UserPlus size={17}/>{t('Partecipa alla campagna')}</h3><label className="field">{t('Link o codice d’invito')}<input required value={invite} onChange={e => setInvite(e.target.value)} autoComplete="off" /></label><button className="button primary" disabled={busy}>{t('Partecipa')}</button></form>
            <form className="online-form" onSubmit={event => { event.preventDefault(); submit(async () => {
              if (!displayName.trim()) throw new Error(t('Inserisci il tuo nome al tavolo.'));
              const id = await cloudResult(cloud.client.rpc('fable_create_campaign', { p_name: name.trim(), p_description: description, p_edition: edition, p_display_name: displayName.trim() }));
              cloud.selectCampaign(id);
            }); }}><h3><Shield size={17}/>{t('Crea come master')}</h3><label className="field">{t('Nome della campagna')}<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label><label className="field">{t('Regolamento della campagna')}<select aria-label={t('Regolamento della campagna')} value={edition} onChange={e => setEdition(e.target.value)}>{Object.values(EDITIONS).map(e => <option key={e.id} value={e.id}>{t(e.label)}</option>)}</select></label><label className="field">{t('Descrizione della campagna')}<textarea aria-label={t('Descrizione della campagna')} maxLength={4000} value={description} onChange={e => setDescription(e.target.value)} /></label><button className="button primary" disabled={busy}>{t('Crea campagna condivisa')}</button></form>
          </div>
        </details>
      </>}
      <p><a href="https://tommyscave.top/privacy.html">{t('Privacy e dati personali')}</a> · <a href="https://tommyscave.top/legal.html">{t('Licenze e condizioni')}</a></p>
      {cloud.session && <details><summary>{t('Gestisci i dati del tuo account')}</summary>
        <p>{t('Esporta i dati cloud prima di eliminare l’account. I salvataggi locali restano su questo dispositivo.')}</p>
        <button className="button secondary" disabled={busy} onClick={() => submit(async () => {
          const data = await cloudResult(cloud.client.rpc('fable_export_account'));
          const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
          const link = document.createElement('a'); link.href = url; link.download = 'tommyscave-account.json'; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        })}>{t('Esporta dati cloud')}</button>
        <button className="button secondary" disabled={busy} onClick={() => {
          const email = window.prompt(t('Eliminazione definitiva da tutti i servizi: rimuove account, sorgenti, schede e campagne create da te, comprese le condivisioni degli altri giocatori. Per confermare scrivi la tua email.'));
          if (!email || email !== cloud.session.user.email) return;
          if (!window.confirm(t('Hai esportato i dati da conservare? Confermi la cancellazione definitiva dell’account?'))) return;
          submit(async () => {
            await cloudResult(cloud.client.rpc('fable_delete_account'));
            await cloud.client.auth.signOut({ scope: 'local' });
            cloud.disconnect(); setMessage(t('Account eliminato. I salvataggi locali restano sul dispositivo.'));
          });
        }}>{t('Elimina account e dati cloud')}</button>
      </details>}
      {message && <p role="status">{message}</p>}
      {cloud.error && <div role="alert" className="session-error"><p>{t(cloud.error)}</p>{cloud.session && <button className="button secondary" disabled={busy} onClick={() => cloud.retry().catch(() => {})}><RefreshCw size={14}/>{t('Riprova')}</button>}</div>}
    </div>
    {cloud.campaign && <>
      <div className="panel online-campaign-heading"><div><span className="eyebrow">{cloud.isDm ? t('MASTER') : t('GIOCATORE')}</span><h2>{cloud.campaign.name}</h2><p>{cloud.campaign.description}</p><small>{t(EDITIONS[cloud.campaign.edition_id].label)}</small></div><span className={`online-status ${cloud.connected && cloud.online ? 'is-connected' : ''}`} role="status">{!cloud.online ? t('Offline · condivisione sospesa') : cloud.saving ? t('Condivisione in corso…') : cloud.connected ? t('Aggiornamenti in diretta') : t('Collegamento in corso…')}</span></div>
      {cloud.isDm && <div className="panel online-invite"><h3><LinkIcon size={18}/>{t('Invita il gruppo')}</h3><p>{t('Il link permette di entrare come giocatore. Puoi sostituirlo per bloccare nuovi accessi con il vecchio invito.')}</p><label className="field">{t('Codice d’invito')}<input readOnly value={cloud.token} /></label><div className="online-actions"><button className="button primary" disabled={!cloud.token || busy} onClick={copyInvite}><Copy size={15}/>{t('Copia invito')}</button><button className="button secondary" disabled={busy} onClick={() => submit(async () => { await cloudResult(cloud.client.rpc('fable_rotate_invite', { p_campaign: cloud.campaign.id })); await cloud.refresh(); })}>{t('Sostituisci invito')}</button></div></div>}
      <div className="panel online-publish"><h3>{t('Il tuo personaggio')} · {character.name}</h3><p>{t('Condividi la scheda completa, inclusi inventario e diario, con il master. Le modifiche successive si aggiornano automaticamente.')}</p>{character.editionId !== cloud.campaign.edition_id ? <><p>{t('Serve una scheda dello stesso regolamento della campagna.')}</p><button className="button primary" onClick={onCreateCharacter}>{t('Crea personaggio per la campagna')}</button></> : <div className="online-actions"><button className="button primary" disabled={busy || !cloud.online || cloud.conflicts.some(s => s.character_id === character.id)} onClick={() => cloud.publish().catch(() => {})}>{published ? t('Condividi la versione di questo dispositivo') : t('Condividi scheda con il master')}</button>{published && <button className="button secondary" disabled={busy} onClick={() => cloud.unshare(published).catch(() => {})}>{t('Interrompi condivisione')}</button>}</div>}</div>
      {cloud.conflicts.map(row => <div className="panel online-conflict" role="alert" key={row.character_id}><h3>{t('Due versioni della scheda')} · {row.data.name}</h3><p>{t('Questo dispositivo e la scheda online contengono modifiche diverse. Scegli quale conservare prima di continuare la condivisione.')}</p><div className="online-actions"><button className="button secondary" disabled={busy} onClick={() => cloud.resolve(row, false).catch(() => {})}>{t('Usa versione online')}</button><button className="button primary" disabled={busy} onClick={() => cloud.resolve(row, true).catch(() => {})}>{t('Conserva versione locale')}</button></div></div>)}
      <SharedCampaignRoster cloud={cloud} onInspect={onInspect}/>
      {cloud.isDm && <section className="panel online-members"><h3>{t('Persone nella campagna')}</h3>{cloud.members.map(m => <div className="online-member" key={m.user_id}><span>{m.display_name}{m.user_id === cloud.campaign.owner_id ? ` · ${t('Master')}` : ''}</span>{m.user_id !== cloud.campaign.owner_id && <button className="button secondary" disabled={busy} onClick={() => submit(async () => { await cloudResult(cloud.client.rpc('fable_remove_member', { p_campaign: cloud.campaign.id, p_user: m.user_id })); await cloud.refresh(); })}>{t('Rimuovi dalla campagna')}</button>}</div>)}</section>}
      {cloud.isDm && <button className="button secondary" disabled={busy} onClick={() => {
        if (!window.confirm(t('Eliminare definitivamente questa campagna e tutte le schede condivise al suo interno? I salvataggi locali restano sui dispositivi.'))) return;
        submit(async () => { await cloudResult(cloud.client.rpc('fable_delete_campaign', { p_campaign: cloud.campaign.id })); cloud.disconnect(); });
      }}>{t('Elimina campagna')}</button>}
      <div className="online-actions"><button className="button secondary" onClick={cloud.disconnect}>{t('Torna alla campagna locale')}</button>{!cloud.isDm && <button className="button secondary" disabled={busy} onClick={() => submit(async () => { await cloudResult(cloud.client.rpc('fable_leave_campaign', { p_campaign: cloud.campaign.id })); cloud.disconnect(); })}>{t('Abbandona campagna')}</button>}</div>
    </>}
  </section>;
}
