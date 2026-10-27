import { test, expect } from '@playwright/test';

async function sheet(page) {
  await page.getByRole('button', { name: 'Scheda personaggio', exact: true }).first().click();
  return page.locator('.paper-sheet');
}

test('write directly on the classic sheet and preserve text through reload, language changes and print', async ({ page }) => {
  await page.goto('/');
  const paper = await sheet(page);
  await paper.getByRole('textbox', { name: 'Nome del giocatore', exact: true }).fill('Tommaso');
  await paper.getByRole('textbox', { name: 'Background', exact: true }).fill('Esploratore');
  await paper.getByRole('textbox', { name: 'Allineamento', exact: true }).fill('Caotico buono');
  await paper.getByRole('textbox', { name: 'Tratti caratteriali', exact: true }).fill('Forza\nMi fido del gruppo.');
  await paper.getByRole('textbox', { name: 'Ideali', exact: true }).fill('Libertà');
  await paper.getByRole('textbox', { name: 'Legami', exact: true }).fill('La mia famiglia');
  await paper.getByRole('textbox', { name: 'Difetti', exact: true }).fill('Sono testardo.');
  await paper.getByRole('textbox', { name: 'Altre competenze e linguaggi', exact: true }).fill('Elfico, Comune');
  await paper.getByRole('textbox', { name: 'Privilegi e tratti', exact: true }).fill('Un tratto dal manuale');
  await paper.getByRole('textbox', { name: 'Diario e appunti', exact: true }).fill('Una nuova pista.');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fable-character')));
  expect(saved.sheetDetails.bonds).toBe('La mia famiglia');
  expect(saved.notes).toBe('Una nuova pista.');
  await page.reload();
  await expect(paper.getByRole('textbox', { name: 'Tratti caratteriali', exact: true })).toHaveValue('Forza\nMi fido del gruppo.');
  await page.getByRole('combobox', { name: 'Lingua', exact: true }).selectOption('en');
  await expect(paper.getByRole('textbox', { name: 'Personality traits', exact: true })).toHaveValue('Forza\nMi fido del gruppo.');
  await paper.locator('.paper-page').first().screenshot({ path: test.info().outputPath('editable-sheet-desktop.png') });
  await page.emulateMedia({ media: 'print' });
  await expect(paper.locator('.sheet-input').first()).toBeHidden();
  await expect(paper.locator('.sheet-print-value').filter({ hasText: 'Forza' })).toBeVisible();
  await expect(paper.locator('.sheet-print-value').filter({ hasText: 'Una nuova pista.' })).toBeVisible();
  await paper.locator('.paper-page').first().screenshot({ path: test.info().outputPath('editable-sheet-print.png') });
});

test('required identity fields reject blank saves and long text stays visible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const paper = await sheet(page);
  const original = await page.evaluate(() => JSON.parse(localStorage.getItem('fable-character')).name);
  const name = paper.getByRole('textbox', { name: 'Nome', exact: true });
  await name.fill('');
  await name.blur();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fable-character')).name)).toBe(original);
  await name.fill('Lyra');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  const traits = paper.getByRole('textbox', { name: 'Tratti caratteriali', exact: true });
  const text = 'Una riga di testo che deve restare leggibile.\n'.repeat(15);
  await traits.fill(text);
  expect(await traits.evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await traits.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('editable-sheet-mobile.png') });
  await page.reload();
  await expect(name).toHaveValue('Lyra');
  await expect(traits).toHaveValue(text);
});

test('edition sheet fields update the same character and persist with its rules', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crea un personaggio', exact: true }).click();
  const creator = page.locator('.rules-creator');
  await creator.getByRole('textbox', { name: 'Nome', exact: true }).fill('Aelin');
  await creator.getByRole('button', { name: 'Continua', exact: true }).click();
  await creator.getByRole('button', { name: 'Crea personaggio', exact: true }).click();
  const paper = await sheet(page);
  await paper.getByRole('textbox', { name: 'Tratti caratteriali', exact: true }).fill('Curiosa');
  await paper.getByRole('textbox', { name: 'Tratti di origine', exact: true }).fill('Origine scritta sulla scheda');
  await paper.getByRole('textbox', { name: 'Capacità, talenti e modificatori', exact: true }).fill('Talento scelto');
  await paper.getByRole('textbox', { name: 'Diario', exact: true }).fill('Appunti personali');
  await page.reload();
  await expect(paper.getByRole('textbox', { name: 'Tratti caratteriali', exact: true })).toHaveValue('Curiosa');
  await expect(paper.getByRole('textbox', { name: 'Tratti di origine', exact: true })).toHaveValue('Origine scritta sulla scheda');
  await page.getByRole('button', { name: 'Panoramica', exact: true }).click();
  await expect(page.locator('.rules-workbench')).toContainText('Talento scelto');
});
