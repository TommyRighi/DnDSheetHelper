import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';

test('static web hosting serves the app but cannot receive or expose game data', async t => {
  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal((await fetch(`${url}/api/workspace`)).status, 404);
  assert.equal((await fetch(url, { method: 'POST', body: 'private campaign' })).status, 405);
  assert.equal((await fetch(`${url}/%2e%2e%2fpackage.json`)).status, 403);
});
