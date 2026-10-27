import { parseBackup } from '../src/backup-file.js';
import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const userData = await mkdtemp(path.join(os.tmpdir(), 'fable-desktop-test-'));
const env = { ...process.env, FABLE_DESKTOP_USER_DATA: userData };
if (process.env.FABLE_DESKTOP_EXECUTABLE) env.ELECTRON_RUN_AS_NODE = '1';
else delete env.ELECTRON_RUN_AS_NODE;
const launchOptions = process.env.FABLE_DESKTOP_EXECUTABLE ? { executablePath: process.env.FABLE_DESKTOP_EXECUTABLE, args: [] } : { args: ['.'] };
let app;
try {
  app = await electron.launch({ ...launchOptions, env, chromiumSandbox: true });
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('.player-heading h1')).toHaveText('Thalion');
  expect(await page.evaluate(() => typeof window.require)).toBe('undefined');
  const security = await app.evaluate(({ BrowserWindow }) => {
    const preferences = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { sandbox: preferences.sandbox, contextIsolation: preferences.contextIsolation, nodeIntegration: preferences.nodeIntegration };
  });
  expect(security).toEqual({ sandbox: true, contextIsolation: true, nodeIntegration: false });
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide());
  await app.evaluate(({ app }) => app.emit('second-instance'));
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible())).toBe(true);
  await page.getByRole('button', { name: 'Personaggio', exact: true }).click();
  await page.getByRole('button', { name: 'Salvataggi e backup', exact: true }).click();
  await expect(page.getByText('Fable desktop', { exact: false })).toBeVisible();
  const backupPath = path.join(userData, 'backup.json');
  await app.evaluate(({ dialog }, filename) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: filename }); }, backupPath);
  await page.getByRole('button', { name: 'Esporta backup JSON' }).click();
  await expect(page.getByRole('status')).toContainText('Backup completo JSON esportato');
  const backup = parseBackup(await readFile(backupPath, 'utf8'));
  expect(backup.schemaVersion).toBe(1);
  expect(JSON.parse(backup.data['fable-character']).name).toBe('Thalion');
  const csvPath = path.join(userData, 'backup.csv');
  await app.evaluate(({ dialog }, filename) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: filename }); }, csvPath);
  await page.getByRole('button', { name: /^Esporta CSV(?: completo)?$/ }).click();
  await expect(page.getByRole('status')).toContainText('Backup completo CSV esportato');
  expect(parseBackup(await readFile(csvPath, 'utf8'))).toEqual(backup);
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  await page.getByRole('button', { name: 'Personaggio', exact: true }).click();
  await page.getByRole('button', { name: 'Modifica scheda', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Thalion desktop');
  await page.getByRole('button', { name: 'Salva modifiche' }).click();
  await app.close(); app = null;
  app = await electron.launch({ ...launchOptions, env, chromiumSandbox: true });
  const restored = await app.firstWindow();
  await expect(restored.locator('.player-heading h1')).toHaveText('Thalion desktop');
  await mkdir('test-results/desktop', { recursive: true });
  await restored.screenshot({ path: 'test-results/desktop/fable-desktop.png' });
  expect(errors).toEqual([]);
  console.log('Desktop verificato: avvio, isolamento, backup nativo e salvataggio dopo riapertura.');
} finally {
  await app?.close();
  await rm(userData, { recursive: true, force: true });
}
