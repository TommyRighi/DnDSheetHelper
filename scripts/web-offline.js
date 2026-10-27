import { chromium, expect } from '@playwright/test';
import { createApp } from '../server/app.js';

const server = createApp();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const external = [];
  page.on('request', request => { if (!request.url().startsWith(origin)) external.push(request.url()); });
  await page.goto(origin);
  await expect(page.locator('.player-heading h1')).toHaveText('Thalion');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.player-heading h1')).toHaveText('Thalion');
  await page.getByRole('button', { name: 'Personaggio', exact: true }).click();
  await page.getByRole('button', { name: 'Modifica scheda', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Thalion offline');
  await page.getByRole('button', { name: 'Salva modifiche', exact: true }).click();
  await page.reload();
  await expect(page.locator('.player-heading h1')).toHaveText('Thalion offline');
  expect(external).toEqual([]);
  console.log('Webapp verificata: avvio, cache offline, salvataggi e riapertura senza rete o servizi esterni.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
