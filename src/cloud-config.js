export function cloudConfig(env = {}) {
  if (!env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_PUBLISHABLE_KEY && !env.VITE_SUPABASE_ANON_KEY) return null;
  const url = new URL(env.VITE_SUPABASE_URL);
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname) ||
      !(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
    throw new Error('Configurazione Supabase non valida.');
  }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (typeof key !== 'string' || !key.trim()) throw new Error('Chiave pubblica Supabase mancante.');
  if (!key.startsWith('sb_publishable_')) {
    let payload;
    try { payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { /* Reject non-public keys. */ }
    if (payload?.role !== 'anon') throw new Error('Usa soltanto la chiave pubblica Supabase.');
  }
  return { url: url.origin, key };
}

export function inviteToken(value) {
  const text = String(value || '').trim();
  const token = /^[a-f0-9]{48}$/.test(text) ? text : (() => {
    try { return new URLSearchParams(new URL(text).hash.slice(1)).get('fable-invite'); } catch { return null; }
  })();
  if (!/^[a-f0-9]{48}$/.test(token || '')) throw new Error('Invito non valido.');
  return token;
}

export function inviteLink(token, base) {
  const url = new URL(base);
  url.hash = new URLSearchParams({ 'fable-invite': inviteToken(token) }).toString();
  return url.href;
}
