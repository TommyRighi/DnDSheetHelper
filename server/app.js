import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { csp } from '../scripts/pwa.js';

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
// Static hosting only: game data never arrives at this process.
export function createApp({ staticDir = path.resolve('dist') } = {}) {
  return createServer(async (request, response) => {
    const send = (status, message) => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(message); };
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!['GET', 'HEAD'].includes(request.method)) return send(405, 'Metodo non supportato.');
    try {
      const url = new URL(request.url, 'http://localhost');
      const file = path.resolve(staticDir, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
      const relative = path.relative(staticDir, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) return send(403, 'Percorso non valido.');
      let info; try { info = await stat(file); } catch { return send(404, 'Risorsa non trovata.'); }
      if (!info.isFile()) return send(404, 'Risorsa non trovata.');
      const body = await readFile(file);
      const policy = path.extname(file) === '.html' ? (body.toString().match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || csp) : csp;
      response.writeHead(200, {
        'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
        'Content-Security-Policy': policy,
        'Cache-Control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      if (!response.headersSent) send(400, 'Richiesta non valida.');
      else response.end();
    }
  });
}
