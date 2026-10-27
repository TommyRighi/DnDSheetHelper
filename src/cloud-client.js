import { createClient } from '@supabase/supabase-js';
import { cloudConfig } from './cloud-config.js';
import { sharedCharacter } from './cloud-sync.js';

let client;
export function getCloudClient() {
  if (client) return client;
  const config = cloudConfig(import.meta.env);
  if (!config) return null;
  client = createClient(config.url, config.key, { db: { schema: import.meta.env.VITE_SUPABASE_DB_SCHEMA || 'public' }, auth: { storageKey: 'fable-supabase-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}
export async function cloudResult(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function saveSharedSheet(client, campaignId, character, expectedVersion = null) {
  const rows = await cloudResult(client.rpc('fable_save_sheet', { p_campaign: campaignId, p_data: sharedCharacter(character), p_expected_version: expectedVersion }));
  return rows[0];
}

export function cloudErrorMessage(error) {
  if (error.code === 'invalid_credentials') return 'Email o password non corretti.';
  if (error.code === 'email_not_confirmed') return 'Conferma la tua email prima di accedere.';
  if (error.code === 'user_already_exists') return 'Questo indirizzo email è già registrato.';
  if (['PGRST202', 'PGRST205', '42P01'].includes(error.code)) return 'Il servizio di condivisione non è ancora pronto.';
  if (error instanceof TypeError || error.message === 'Failed to fetch') return 'Connessione non disponibile. Le modifiche restano salvate su questo dispositivo.';
  return error.message;
}
