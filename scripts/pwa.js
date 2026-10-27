import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
export const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-src https: http:; object-src 'none'; base-uri 'self'; form-action 'self'";
export function networkCsp(supabaseUrl) {
  if (!supabaseUrl) return csp;
  const url = new URL(supabaseUrl);
  if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid Supabase URL');
  const websocket = new URL(url.origin); websocket.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return csp.replace("connect-src 'self'", `connect-src 'self' ${url.origin} ${websocket.origin}`);
}
export function pwaPlugin({ supabaseUrl } = {}) {
  const policy = networkCsp(supabaseUrl);
  return {
    name: 'fable-offline', apply: 'build',
    transformIndexHtml(html) { return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${policy}" />`); },
    async writeBundle(options, bundle) {
      const files = [...new Set([...Object.keys(bundle).filter(name => !name.endsWith('.map')), 'index.html', 'manifest.webmanifest', 'icon.svg'])];
      const version = createHash('sha256').update(JSON.stringify(files) + (bundle['index.html']?.source || '')).digest('hex').slice(0, 16);
      await writeFile(path.join(options.dir || 'dist', 'sw.js'), `
const CACHE = 'fable-${version}';
const FILES = ${JSON.stringify(files)}.map(file => new URL(file, self.registration.scope).href);
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('fable-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('index.html', self.registration.scope))));
  } else if (FILES.includes(url.href)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});`);
    },
  };
}
