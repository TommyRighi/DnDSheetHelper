import { useLanguage } from './i18n.jsx';
import React, { useState } from 'react';
import { Plus, Trash2, SlidersHorizontal, Check } from 'lucide-react';
import { targets, durations, recoveryLabels, rulesFor, characterValues, recordRuleChange } from './table-rules.js';
import './table-rules.css';

const number = value => value.trim() !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 1e6;
const englishTargets = {
  ac: 'Armor class', initiative: 'Initiative', speed: 'Speed in meters',
  proficiency: 'Proficiency bonus', attack: 'Weapon attack bonus', damage: 'Weapon damage bonus',
  spellDc: 'Spell save DC', spellAttack: 'Spell attack bonus', checks: 'Ability and skill check bonus',
  maxHp: 'Maximum HP', maxSlots: 'Maximum 1st-level spell slots', maxHitDice: 'Maximum Hit Dice',
};
const englishDurations = { manual: 'Until removed', shortRest: 'Until the next short or long rest', longRest: 'Until the next long rest' };
const englishRecovery = { manual: 'Manual recovery', shortRest: 'Short or long rest', longRest: 'Long rest' };

export default function TableRules({ character, values: suppliedValues, onChange }) {
  const { language } = useLanguage();
  const t = (it, en) => language === 'en' ? en : it;
  const labels = language === 'en' ? englishTargets : targets;
  const durationLabels = language === 'en' ? englishDurations : durations;
  const recovery = language === 'en' ? englishRecovery : recoveryLabels;
  const [tab, setTab] = useState('values');
  const [target, setTarget] = useState('ac');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState(() => rulesFor(character).overrides.ac?.reason ?? '');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('2');
  const [duration, setDuration] = useState('manual');
  const [resourceName, setResourceName] = useState('');
  const [current, setCurrent] = useState('1');
  const [maximum, setMaximum] = useState('1');
  const [resourceRecovery, setResourceRecovery] = useState('manual');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const rules = rulesFor(character), values = suppliedValues ?? characterValues(character);
  const tabs = [['values', t('Valori', 'Values')], ['effects', t('Effetti', 'Effects')], ['resources', t('Risorse', 'Resources')], ['history', t('Registro', 'History')]];
  const dirty = () => { setSaved(false); setError(''); };
  const commit = (changes, message) => {
    onChange(c => recordRuleChange(c, changes, message));
    setError('');
    setSaved(true);
  };
  const changeRules = (changes, message) => commit({ tableRules: { ...rules, ...changes } }, message);
  const describe = detail => {
    const parts = [detail.override ? `${detail.override.value} ${t('manuale', 'manual')}` : `${detail.base} ${t('base', 'base')}`];
    for (const effect of detail.effects) parts.push(`${effect.amount >= 0 ? '+' : ''}${effect.amount} ${effect.name}`);
    return parts.join(' ') + (detail.override ? ` · ${t('Base', 'Base')}: ${detail.base}${detail.override.reason ? ` · ${detail.override.reason}` : ''}` : '');
  };
  const selectTarget = (
    <label className="field">{t('Valore da modificare', 'Value to edit')}
      <select value={target} onChange={e => { setTarget(e.target.value); setValue(''); setReason(rules.overrides[e.target.value]?.reason ?? ''); dirty(); }}>
        {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
  );
  const removeButton = (label, action) => <button type="button" className="icon-button" aria-label={label} title={label} onClick={action}><Trash2 size={16}/></button>;
  const submitOverride = event => {
    event.preventDefault();
    if (!number(value) || (['ac', 'speed', 'maxSlots', 'maxHitDice'].includes(target) && Number(value) < 0) || (target === 'maxHp' && Number(value) < 1) || (['maxSlots', 'maxHitDice'].includes(target) && !Number.isInteger(Number(value)))) {
      return setError(t('Inserisci un numero valido. PF massimi almeno 1; slot e dadi vita interi e non negativi.', 'Enter a valid number. Maximum HP must be at least 1; slots and Hit Dice must be nonnegative integers.'));
    }
    changeRules({ overrides: { ...rules.overrides, [target]: { value: Number(value), reason: reason.trim() } } }, `${labels[target]}: ${Number(value)}.${reason.trim() ? ` ${reason.trim()}` : ''}`);
  };

  return <div className="rules-settings" lang={language}>
    <header className="rules-settings-header">
      <div className="rules-title"><SlidersHorizontal size={18}/><h2 id="modal-title">{t('Regole del tavolo', 'Table rules')}</h2></div>
    </header>
    <div className="rules-tabs" role="tablist" aria-label={t('Regole del tavolo', 'Table rules')}>
      {tabs.map(([id, label], index) => <button type="button" role="tab" tabIndex={tab === id ? 0 : -1} aria-selected={tab === id} aria-controls={`rules-content-${id}`} id={`rules-tab-${id}`} key={id}
        onClick={() => { setTab(id); dirty(); }} onKeyDown={event => {
          let next;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = tabs.length - 1;
          if (next !== undefined) { event.preventDefault(); setTab(tabs[next][0]); dirty(); event.currentTarget.parentElement.children[next].focus(); }
        }}>{label}</button>)}
    </div>
    <div id={`rules-content-${tab}`} role="tabpanel" aria-labelledby={`rules-tab-${tab}`} className="rules-settings-body">
      {tab === 'values' && <>
        <form onSubmit={submitOverride} onChange={dirty}>
          {selectTarget}
          <div className="rules-current"><div><span>{t('Valore attuale', 'Current value')}</span><small>{describe(values.details[target])}</small></div><output aria-label={t('Valore attuale', 'Current value')}>{values[target]}</output></div>
          <div className="rules-edit-row">
            <label className="field">{t('Nuovo valore base', 'New base value')}<input type="number" step="any" value={value} placeholder={String(values.details[target].override?.value ?? values.details[target].base)} onChange={e => setValue(e.target.value)} required /></label>
            <button className="button primary" type="submit">{t('Salva', 'Save')}</button>
          </div>
          <label className="field rules-note">{t('Nota', 'Note')} <span>{t('facoltativa', 'optional')}</span><input value={reason} onChange={e => setReason(e.target.value)} maxLength={200} placeholder={t('Es. nuova armatura', 'E.g. new armor')} /></label>
        </form>
        <details className="rules-details"><summary>{t('Valori modificati', 'Edited values')} <span>{Object.keys(rules.overrides).length}</span></summary>
          {Object.entries(rules.overrides).map(([key]) => <article className="rules-entry" key={key}><div><strong>{labels[key]} · {values[key]}</strong><small>{describe(values.details[key])}</small></div>{removeButton(`${t('Ripristina', 'Reset')} ${labels[key]}`, () => { const next = { ...rules.overrides }; delete next[key]; changeRules({ overrides: next }, `${t('Ripristinato', 'Reset')}: ${labels[key]}.`); })}</article>)}
          {!Object.keys(rules.overrides).length && <p className="rules-empty">{t('Nessuna modifica ai valori di base.', 'No changes to base values.')}</p>}
        </details>
      </>}
      {tab === 'effects' && <>
        <form onChange={dirty} onSubmit={event => {
          event.preventDefault();
          if (!name.trim() || !number(amount)) return setError(t('Inserisci un nome e un bonus o una penalità.', 'Enter a name and a numeric bonus or penalty.'));
          if (rules.effects.length >= 100) return setError(t('Rimuovi un effetto prima di aggiungerne un altro.', 'Remove an effect before adding another.'));
          changeRules({ effects: [...rules.effects, { id: crypto.randomUUID(), name: name.trim(), target, amount: Number(amount), duration }] }, `${t('Effetto aggiunto', 'Effect added')}: ${name.trim()} · ${labels[target]} ${Number(amount) >= 0 ? '+' : ''}${Number(amount)} · ${durationLabels[duration]}.`);
          setName('');
        }}>
          <label className="field">{t('Nome dell’effetto', 'Effect name')}<input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder={t('Es. Benedizione', 'E.g. Blessing')} required /></label>
          {selectTarget}
          <div className="rules-resource-fields"><label className="field">{t('Bonus o penalità', 'Bonus or penalty')}<input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
            <label className="field">{t('Durata', 'Duration')}<select value={duration} onChange={e => setDuration(e.target.value)}>{Object.entries(durationLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
          <button className="button primary" type="submit"><Plus size={15}/>{t('Aggiungi effetto', 'Add effect')}</button>
        </form>
        <h3 className="rules-subtitle">{t('Effetti attivi', 'Active effects')} · {rules.effects.length}</h3>
        {rules.effects.map(effect => <article className="rules-entry" key={effect.id}><div><strong>{effect.name}</strong><small>{labels[effect.target]} {effect.amount >= 0 ? '+' : ''}{effect.amount} · {durationLabels[effect.duration]}</small></div>{removeButton(`${t('Rimuovi', 'Remove')} ${effect.name}`, () => changeRules({ effects: rules.effects.filter(e => e.id !== effect.id) }, `${t('Effetto rimosso', 'Effect removed')}: ${effect.name}.`))}</article>)}
        {!rules.effects.length && <p className="rules-empty">{t('Nessun effetto attivo.', 'No active effects.')}</p>}
      </>}
      {tab === 'resources' && <>
        <form onChange={dirty} key={`${character.hp}-${character.slots}-${character.hitDice}`} onSubmit={event => {
          event.preventDefault();
          const fields = Object.fromEntries(new FormData(event.currentTarget));
          const nums = Object.fromEntries(['hp', 'slots', 'hitDice'].map(key => [key, Number(fields[key])]));
          if (Object.values(nums).some(n => !Number.isInteger(n) || n < 0 || n > 1e6)) return setError(t('Usa numeri interi non negativi.', 'Use nonnegative whole numbers.'));
          if (character.rules) nums.rules = { ...character.rules, slotUsed: { ...character.rules.slotUsed, 1: values.maxSlots - nums.slots } };
          commit(nums, `${t('Risorse salvate', 'Resources saved')}: ${t('PF', 'HP')} ${nums.hp}, ${t('slot', 'slots')} ${nums.slots}, ${t('dadi vita', 'Hit Dice')} ${nums.hitDice}.${fields.note ? ` ${fields.note}` : ''}`);
        }}>
          <p className="rules-hint">{t('Consentiti valori oltre il massimo.', 'Values above the maximum allowed.')}</p>
          <div className="rules-resource-fields">{[['hp', t('PF attuali', 'Current HP')], ['slots', t('Slot attuali', 'Current slots')], ['hitDice', t('Dadi vita attuali', 'Current Hit Dice')]].map(([key, label]) => <label className="field" key={key}>{label}<input name={key} type="number" min="0" max="1000000" step="1" defaultValue={key === "slots" && character.rules ? Math.max(0, values.maxSlots - (character.rules.slotUsed[1] || 0)) : character[key]} required /></label>)}</div>
          <label className="field">{t('Nota facoltativa', 'Optional note')}<input name="note" maxLength={200} placeholder={t('Es. slot extra', 'E.g. extra slots')} /></label>
          <button className="button primary" type="submit">{t('Salva risorse', 'Save resources')}</button>
        </form>
        <details className="rules-details"><summary>{t('Risorse personalizzate', 'Custom resources')} <span>{rules.resources.length}</span></summary>
          {rules.resources.map(resource => <article className="rules-entry" key={resource.id}><div><strong>{resource.name} · {resource.current} / {resource.max}</strong><small>{recovery[resource.recovery]}</small></div>{removeButton(`${t('Rimuovi', 'Remove')} ${resource.name}`, () => changeRules({ resources: rules.resources.filter(r => r.id !== resource.id) }, `${t('Risorsa rimossa', 'Resource removed')}: ${resource.name}.`))}</article>)}
          <form onChange={dirty} onSubmit={event => {
            event.preventDefault();
            if (!resourceName.trim() || !number(current) || !number(maximum) || Number(current) < 0 || Number(maximum) < 0) return setError(t('Inserisci un nome e quantità non negative.', 'Enter a name and nonnegative amounts.'));
            if (rules.resources.length >= 100) return setError(t('Rimuovi una risorsa prima di aggiungerne un’altra.', 'Remove a resource before adding another.'));
            changeRules({ resources: [...rules.resources, { id: crypto.randomUUID(), name: resourceName.trim(), current: Number(current), max: Number(maximum), recovery: resourceRecovery }] }, `${t('Risorsa aggiunta', 'Resource added')}: ${resourceName.trim()} · ${current}/${maximum} · ${recovery[resourceRecovery]}.`);
            setResourceName('');
          }}>
            <label className="field">{t('Nome della risorsa', 'Resource name')}<input value={resourceName} maxLength={80} onChange={e => setResourceName(e.target.value)} placeholder={t('Es. Cariche della reliquia', 'E.g. Relic charges')} required /></label>
            <div className="rules-resource-fields"><label className="field">{t('Disponibili', 'Available')}<input type="number" min="0" step="any" value={current} onChange={e => setCurrent(e.target.value)} required /></label><label className="field">{t('Massimo', 'Maximum')}<input type="number" min="0" step="any" value={maximum} onChange={e => setMaximum(e.target.value)} required /></label></div>
            <label className="field">{t('Recupero', 'Recovery')}<select value={resourceRecovery} onChange={e => setResourceRecovery(e.target.value)}>{Object.entries(recovery).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <button className="button secondary" type="submit"><Plus size={15}/>{t('Aggiungi risorsa', 'Add resource')}</button>
          </form>
        </details>
      </>}
      {tab === 'history' && <>
        {rules.history.map((entry, index) => <article className="rules-entry" key={`${entry.at}-${index}`}><div><small>{new Date(entry.at).toLocaleString(language === 'en' ? 'en-GB' : 'it-IT')}</small><p>{entry.text}</p></div></article>)}
        {!rules.history.length && <p className="rules-empty">{t('Nessuna modifica.', 'No changes yet.')}</p>}
      </>}
    </div>
    <footer className="rules-settings-footer">
      {error ? <p className="rules-error" role="alert">{error}</p> : saved && <p className="rules-feedback" role="status"><Check size={14}/>{t('Salvato', 'Saved')}</p>}
    </footer>
  </div>;
}
