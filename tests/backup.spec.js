import { test, expect } from '@playwright/test';
async function backupPanel(page) {
  await page.getByRole('button', { name: 'Personaggio', exact: true }).click();
  await page.getByRole('button', { name: 'Salvataggi e backup', exact: true }).click();
}
for (const format of ['JSON', 'CSV']) test(`complete ${format} backup restores the character, campaign, DM notes and preferences through the UI`, async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'La mia campagna', exact: true }).click();
  await page.getByLabel('Nome della campagna', { exact: true }).fill('La cripta del corvo');
  await page.getByRole('button', { name: 'Crea campagna', exact: true }).click();
  await page.getByRole('button', { name: 'Apri schermo del DM' }).click();
  await page.getByLabel('Segreti, motivazioni e conseguenze').fill('Il corvo conosce "Mira".\nLa porta, invece, mente.');
  await page.getByRole('button', { name: 'Campagna', exact: true }).click();
  await page.getByRole('button', { name: 'Gioca', exact: true }).click();
  await backupPanel(page);
  await expect(page.getByText('Database opzionale', { exact: true })).toHaveCount(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: format === 'JSON' ? 'Esporta backup JSON' : 'Esporta CSV', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`fable-completo.${format.toLowerCase()}`);
  const filename = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(filename);
  await page.getByRole('button', { name: 'Chiudi finestra', exact: true }).click();
  await page.getByRole('button', { name: 'Personaggio', exact: true }).click();
  await page.getByRole('button', { name: 'Modifica scheda', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Nome modificato');
  await page.getByRole('button', { name: 'Salva modifiche', exact: true }).click();
  await backupPanel(page);
  await page.locator('.data-connections input[type=file]').setInputFiles(filename);
  await expect(page.getByRole('region', { name: 'Conferma ripristino' })).toContainText('La cripta del corvo');
  await expect(page.getByRole('region', { name: 'Conferma ripristino' })).toContainText('appunti riservati del master');
  await page.getByRole('button', { name: 'Ripristina backup' }).click();
  await expect(page.locator('.player-heading h1')).toHaveText('Thalion');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fable-campaign')).name)).toBe('La cripta del corvo');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fable-dm')).secrets)).toContain('Il corvo conosce "Mira".');
  const previous = await page.evaluate(() => JSON.parse(localStorage.getItem('fable-workspace-before-restore')));
  expect(JSON.parse(previous.data['fable-character']).name).toBe('Nome modificato');
});
test('invalid configuration files are rejected before they can change the current game', async ({ page }) => {
  await page.goto('/');
  await backupPanel(page);
  await page.locator('.data-connections input[type=file]').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('name,level\nMira,4') });
  await expect(page.locator('.data-connections [role=alert]')).toContainText('CSV completo esportato da Fable');
  await expect(page.getByRole('region', { name: 'Conferma ripristino' })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fable-character')).name)).toBe('Thalion');
});
