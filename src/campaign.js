import { EDITIONS } from './rules/catalog.js';
import { readSession } from './session.js';

export const CAMPAIGN_KEY = 'fable-campaign';
export const NAVIGATION_KEY = 'fable-navigation';
const pages = ['Panoramica', 'Schermo del DM', 'Scheda personaggio', 'Incantesimi', 'Inventario', 'Diario', 'Campagna'];
export function validateCampaign(value) {
  if (!value || typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100 || !Object.hasOwn(EDITIONS, value.editionId) || typeof value.description !== 'string' || value.description.length > 4000 || !Array.isArray(value.characterIds) || !value.characterIds.every(id => typeof id === 'string')) throw new Error('Inserisci un nome e un regolamento validi.');
  return { id: value.id, name: value.name.trim(), editionId: value.editionId, description: value.description, characterIds: [...new Set(value.characterIds)] };
}
export function readCampaign(storage) {
  try {
    const raw = storage.getItem(CAMPAIGN_KEY);
    if (raw) return validateCampaign(JSON.parse(raw));
    const old = readSession(storage);
    if (!old) return null;
    return { id: 'legacy-local-campaign', name: old.name || 'La mia campagna', editionId: '5e-2014', description: '', characterIds: [] };
  } catch { return null; }
}
export function saveCampaign(storage, value) {
  const campaign = validateCampaign(value);
  storage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
  return campaign;
}
export function readPage(storage) {
  try { const page = storage.getItem(NAVIGATION_KEY); return pages.includes(page) ? page : 'Panoramica'; }
  catch { return 'Panoramica'; }
}
export function characterChecklist(c) {
  if (!c.rules) return [];
  return [
    { label: 'Registra specie e background', done: !!(c.race.trim() && c.background?.trim()), target: 'edit' },
    { label: 'Aggiungi equipaggiamento', done: c.inventory.length > 0, target: 'Inventario' },
    { label: 'Registra competenze', done: Object.values(c.rules.skills).some(s => s.trained || s.rank > 0), target: 'Panoramica' },
    { label: 'Registra capacità e incantesimi', done: c.rules.abilities.length > 0 || !!c.rules.features.trim(), target: 'Incantesimi' },
  ];
}
