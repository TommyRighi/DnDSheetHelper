import { test, expect } from '@playwright/test';
import { parseCharacterSave } from '../src/storage.js';

const languageSelect = page => page.getByRole('combobox', { name: /^(Lingua|Language)$/ });

test('one language preference updates all screens and dialogs and survives reload', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const original = await page.evaluate(() => localStorage.getItem('fable-character'));
  await languageSelect(page).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Roll dice', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Language', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Skills', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search skills', exact: true }).fill('Stealth');
  await expect(page.locator('.skill-row')).toHaveCount(1);
  await expect(page.locator('.skill-row')).toContainText('Stealth');
  await page.getByRole('button', { name: 'My campaign', exact: true }).click();
  await expect(page.getByLabel('Campaign name', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'DM screen', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Encounter', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Character sheet', exact: true }).first().click();
  await expect(page.locator('.paper-sheet')).toContainText('CHARACTER SHEET');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.paper-sheet')).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Roll dice', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Number of dice');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.reload();
  await expect(languageSelect(page)).toHaveValue('en');
  await languageSelect(page).selectOption('it');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.getByRole('button', { name: 'La mia campagna', exact: true })).toBeVisible();
  expect(parseCharacterSave(await page.evaluate(() => localStorage.getItem('fable-character')))).toEqual(parseCharacterSave(original));
  expect(errors).toEqual([]);
});

test('language changes preserve campaign drafts and user content that matches a translation key', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'La mia campagna', exact: true }).click();
  await page.getByLabel('Nome della campagna', { exact: true }).fill('Forza');
  await page.getByLabel('Descrizione della campagna', { exact: true }).fill('Diario');
  await languageSelect(page).selectOption('en');
  await expect(page.getByLabel('Campaign name', { exact: true })).toHaveValue('Forza');
  await expect(page.getByRole('textbox', { name: 'Campaign description', exact: true })).toHaveValue('Diario');
  await page.getByRole('button', { name: 'Create campaign', exact: true }).click();
  await expect(page.locator('.campaign-overview h2')).toHaveText('Forza');
  await expect(page.locator('.campaign-overview .rules-preformatted')).toHaveText('Diario');
  await languageSelect(page).selectOption('it');
  await expect(page.locator('.campaign-overview h2')).toHaveText('Forza');
});

test('global selector remains accessible on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(languageSelect(page)).toBeInViewport();
  await languageSelect(page).selectOption('en');
  await expect(page.getByRole('button', { name: 'Inventory', exact: true })).toBeVisible();
  const bounds = await languageSelect(page).boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: test.info().outputPath('language-mobile.png') });
});

test('character creation, edition rules and table rules use the same global language', async ({ page }) => {
  await page.goto('/');
  await languageSelect(page).selectOption('en');
  await page.getByRole('button', { name: 'Create a character', exact: true }).click();
  const creator = page.locator('.rules-creator');
  await creator.getByLabel('Name', { exact: true }).fill('Forza');
  await expect(creator.getByRole('option', { name: 'Fighter', exact: true })).toHaveAttribute('value', 'fighter');
  await creator.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(creator.getByLabel('Strength', { exact: true })).toBeVisible();
  await creator.getByRole('button', { name: 'Create character', exact: true }).click();
  await expect(page.locator('.rules-identity h2')).toHaveText('Forza');
  await expect(page.getByRole('button', { name: /^Melee / })).toBeVisible();
  await page.locator('.table-management summary').click();
  await page.getByRole('button', { name: 'Table rules', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Table rules');
  await expect(page.getByRole('combobox', { name: 'Language', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await languageSelect(page).selectOption('it');
  await expect(page.getByRole('button', { name: /^Mischia / })).toBeVisible();
  await expect(page.locator('.rules-identity h2')).toHaveText('Forza');
});
