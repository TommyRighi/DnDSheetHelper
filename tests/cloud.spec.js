import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.use({ actionTimeout: 10000 });
const url = process.env.FABLE_TEST_SUPABASE_URL;
const key = process.env.FABLE_TEST_SUPABASE_KEY;
test.skip(!url || !key, 'Run npm run test:cloud with local Supabase running.');
const account = async label => {
  const client = createClient(url, key, { db: { schema: process.env.VITE_SUPABASE_DB_SCHEMA || 'public' }, auth: { persistSession: false, autoRefreshToken: false } });
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const password = 'Fable-test-password-2026';
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return { client, email, password, user: data.user };
};
const rpc = async (client, name, args) => {
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data;
};
const login = async (page, user, invite = '') => {
  await page.goto(invite ? `/#fable-invite=${invite}` : '/');
  await page.getByRole('button', { name: 'La mia campagna', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Campagna condivisa', exact: true });
  await panel.getByLabel('Email', { exact: true }).fill(user.email);
  await panel.getByLabel('Password', { exact: true }).fill(user.password);
  await panel.getByRole('button', { name: 'Accedi', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Esci', exact: true })).toBeVisible();
  return panel;
};

test('master sees live player edits, reads full sheets, and players cannot access others through the API', async ({ browser }) => {
  test.setTimeout(60000);
  const dm = await account('dm');
  const player = await account('player');
  const outsider = await account('outsider');
  const dmContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const dmPage = await dmContext.newPage();
  const playerPage = await playerContext.newPage();
  try {
    const dmPanel = await login(dmPage, dm);
    await dmPanel.getByLabel('Nome al tavolo', { exact: true }).fill('Master');
    await dmPanel.getByLabel('Nome della campagna', { exact: true }).fill('La cripta condivisa');
    await dmPanel.getByLabel('Regolamento della campagna', { exact: true }).selectOption('5e-2014');
    await dmPanel.getByRole('button', { name: 'Crea campagna condivisa', exact: true }).click();
    const code = dmPanel.getByLabel('Codice d’invito', { exact: true });
    await expect(code).toHaveValue(/^[a-f0-9]{48}$/);
    const token = await code.inputValue();
    const [{ id: campaignId }] = (await dm.client.from('fable_campaigns').select('id')).data;
    const playerPanel = await login(playerPage, player, token);
    await playerPanel.getByLabel('Nome al tavolo', { exact: true }).fill('Giocatrice');
    await expect(playerPanel.getByLabel('Link o codice d’invito', { exact: true })).toHaveValue(token);
    await playerPanel.getByRole('button', { name: 'Partecipa', exact: true }).click();
    await playerPanel.getByRole('button', { name: 'Condividi scheda con il master', exact: true }).click();
    await expect(dmPanel.locator('.shared-character')).toHaveCount(1, { timeout: 10000 });
    await playerPage.getByRole('button', { name: 'Scheda personaggio', exact: true }).first().click();
    const paper = playerPage.locator('.paper-sheet');
    await paper.getByRole('textbox', { name: 'Nome', exact: true }).fill('Lyra condivisa');
    await paper.getByRole('textbox', { name: 'Tratti caratteriali', exact: true }).fill('Una modifica in diretta');
    await expect(dmPanel.locator('.shared-character')).toContainText('Lyra condivisa', { timeout: 10000 });
    await dmPanel.getByRole('button', { name: 'Apri scheda', exact: true }).click();
    const dialog = dmPage.getByRole('dialog');
    await expect(dialog).toContainText('Una modifica in diretta', { timeout: 10000 });
    await expect(dialog.getByRole('textbox', { name: 'Tratti caratteriali', exact: true })).toBeHidden();
    await dmPage.getByRole('button', { name: 'Chiudi finestra', exact: true }).click();
    const own = (await player.client.from('fable_sheets').select('*')).data;
    expect(own).toHaveLength(1);
    expect((await outsider.client.from('fable_sheets').select('*')).data).toEqual([]);
    expect((await outsider.client.from('fable_campaigns').select('*')).data).toEqual([]);
    expect((await player.client.from('fable_invites').select('*')).data).toEqual([]);
    expect((await player.client.from('fable_sheets').update({ owner_id: outsider.user.id }).eq('campaign_id', campaignId)).error?.code).toBe('42501');
    const stale = await player.client.rpc('fable_save_sheet', { p_campaign: campaignId, p_data: own[0].data, p_expected_version: 1 });
    expect(stale.error?.code).toBe('PT409');
    await dmPanel.getByRole('button', { name: 'Sostituisci invito', exact: true }).click();
    await expect(code).not.toHaveValue(token);
    expect((await outsider.client.rpc('fable_join_campaign', { p_token: token, p_display_name: 'Intruso' })).error).toBeTruthy();
    await dmPage.screenshot({ path: test.info().outputPath('shared-campaign-desktop.png'), fullPage: true });
    await dmPanel.getByRole('button', { name: 'Rimuovi dalla campagna', exact: true }).click();
    await expect(dmPanel.locator('.shared-character')).toHaveCount(0, { timeout: 10000 });
    expect((await player.client.from('fable_sheets').select('*')).data).toEqual([]);
    expect((await player.client.rpc('fable_save_sheet', { p_campaign: campaignId, p_data: own[0].data, p_expected_version: null })).error?.code).toBe('42501');
  } finally { await dmContext.close(); await playerContext.close(); }
});

test('new devices adopt their own shared character and stale offline changes require a decision', async ({ browser }) => {
  test.setTimeout(60000);
  const dm = await account('conflict-dm');
  const player = await account('conflict-player');
  const campaignId = await rpc(dm.client, 'fable_create_campaign', { p_name: 'Versioni', p_description: '', p_edition: '5e-2014', p_display_name: 'Master' });
  const token = (await dm.client.from('fable_invites').select('token').eq('campaign_id', campaignId).single()).data.token;
  await rpc(player.client, 'fable_join_campaign', { p_token: token, p_display_name: 'Giocatore' });
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const a = await firstContext.newPage();
  const b = await secondContext.newPage();
  try {
    const panelA = await login(a, player);
    await panelA.getByLabel('Campagna online', { exact: true }).selectOption(campaignId);
    await panelA.getByRole('button', { name: 'Condividi scheda con il master', exact: true }).click();
    await expect(panelA.locator('.shared-character')).toHaveCount(1);
    const panelB = await login(b, player);
    await panelB.getByLabel('Campagna online', { exact: true }).selectOption(campaignId);
    await panelB.getByRole('button', { name: 'Usa su questo dispositivo', exact: true }).click();
    await secondContext.setOffline(true);
    await b.getByRole('button', { name: 'Scheda personaggio', exact: true }).first().click();
    await b.locator('.paper-sheet').getByRole('textbox', { name: 'Nome', exact: true }).fill('Versione offline');
    await a.getByRole('button', { name: 'Scheda personaggio', exact: true }).first().click();
    await a.locator('.paper-sheet').getByRole('textbox', { name: 'Nome', exact: true }).fill('Versione online');
    await expect.poll(async () => (await player.client.from('fable_sheets').select('data').single()).data?.data.name).toBe('Versione online');
    await secondContext.setOffline(false);
    await b.getByRole('button', { name: 'La mia campagna', exact: true }).click();
    await expect(panelB.locator('.online-conflict')).toBeVisible({ timeout: 20000 });
    await panelB.getByRole('button', { name: 'Usa versione online', exact: true }).click();
    await expect(panelB.locator('.online-conflict')).toHaveCount(0);
    expect(await b.evaluate(() => JSON.parse(localStorage.getItem('fable-character')).name)).toBe('Versione online');
    await b.setViewportSize({ width: 390, height: 844 });
    expect(await b.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await b.screenshot({ path: test.info().outputPath('shared-campaign-mobile.png'), fullPage: true });
  } finally { await firstContext.close(); await secondContext.close(); }
});
