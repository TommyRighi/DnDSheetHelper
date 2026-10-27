import { test, expect } from "@playwright/test";
const saved = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("fable-character")));
async function create(
  page,
  { editionId, name = "Nuovo eroe", classId = "fighter" } = {},
) {
  await page.getByRole("button", { name: "Personaggio", exact: true }).click();
  await page
    .getByRole("button", { name: "Nuovo personaggio", exact: true })
    .click();
  const creator = page.locator(".rules-creator");
  if (editionId)
    await creator
      .getByRole("combobox", { name: "Edizione", exact: true })
      .selectOption(editionId);
  await creator.getByLabel("Nome", { exact: true }).fill(name);
  await creator
    .getByRole("combobox", { name: "Classe base", exact: true })
    .selectOption(classId);
  await creator.getByRole("button", { name: "Continua", exact: true }).click();
  await creator
    .getByRole("button", { name: "Crea personaggio", exact: true })
    .click();
  await expect(page.locator(".rules-identity h2")).toContainText(name);
}
test("latest default, archive, changing active character and reload preserve each edition", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const original = await saved(page);
  expect(original.editionId).toBe("5e-2014");
  await create(page, { name: "Ranger moderno", classId: "ranger" });
  const latest = await saved(page);
  expect(latest.editionId).toBe("5.5-2024");
  await page.locator(".play-toolbar").getByRole("button", { name: "Incantesimi", exact: true }).click();
  await expect(page.locator(".rules-section").first()).toContainText("2 / 2");
  await page.reload();
  await page.locator(".character-management > summary").click();
  await page
    .getByLabel("Cambia personaggio", { exact: true })
    .selectOption(original.id);
  await expect(page.locator(".player-heading h1")).toContainText("Incantesimi");
  expect((await saved(page)).editionId).toBe("5e-2014");
  await page
    .getByLabel("Cambia personaggio", { exact: true })
    .selectOption(latest.id);
  await expect(page.locator(".rules-identity")).toContainText("Ranger moderno");
  await page.screenshot({ path: test.info().outputPath("latest-desktop.png") });
  expect(errors).toEqual([]);
});
test("3.5 has three saves and BAB, persists negative HP, and prints the active edition", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await create(page, {
    editionId: "3.5",
    name: "Ranger antico",
    classId: "ranger",
  });
  expect((await saved(page)).maxHp).toBe(9);
  await expect(page.locator(".rules-saves>div")).toHaveCount(3);
  await expect(page.locator(".rules-vitals")).toContainText("ATTACCO BASE");
  await page
    .getByLabel("Quantità danni o guarigione", { exact: true })
    .fill("10");
  await page
    .getByRole("button", { name: "Subisci danni", exact: true })
    .click();
  await expect.poll(async () => (await saved(page)).hp).toBe(-1);
  await page.reload();
  expect((await saved(page)).hp).toBe(-1);
  await page
    .getByRole("button", { name: "Scheda personaggio", exact: true })
    .click();
  await expect(page.locator(".rules-print")).toContainText("D&D 3.5");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".rules-print")).toBeVisible();
  const pdf = await page.pdf({
    path: test.info().outputPath("3.5-sheet.pdf"),
    preferCSSPageSize: true,
  });
  expect(pdf.length).toBeGreaterThan(10000);
});
test("4e uses surges, short rest and fixed HP advancement", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await create(page, {
    editionId: "4e",
    name: "Difensore",
    classId: "fighter",
  });
  expect((await saved(page)).maxHp).toBe(28);
  expect((await saved(page)).rules.surges).toBe(10);
  await page
    .getByLabel("Quantità danni o guarigione", { exact: true })
    .fill("15");
  await page
    .getByRole("button", { name: "Subisci danni", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Riposo breve", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Impulsi curativi da spendere", { exact: false })
    .fill("1");
  await page
    .getByRole("button", { name: "Conferma riposo", exact: true })
    .click();
  await expect.poll(async () => (await saved(page)).hp).toBe(20);
  expect((await saved(page)).rules.surges).toBe(9);
  await page.getByRole("button", { name: "Personaggio", exact: true }).click();
  await page
    .getByRole("button", { name: "Passa di livello", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Conferma avanzamento", exact: false })
    .click();
  await expect.poll(async () => (await saved(page)).maxHp).toBe(34);
  expect((await saved(page)).level).toBe(2);
});
test("both classic and edition sheets remain readable on narrow mobile screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("button", { name: "Scheda personaggio", exact: true })
    .click();
  await expect(page.locator(".sheet-mobile-index")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".paper-check")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(13);
  await page.locator(".paper-sheet").scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("classic-mobile.png") });
  await create(page, { editionId: "4e", name: "Eroe mobile" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Scheda personaggio", exact: true })
    .click();
  await expect(page.locator(".rules-print")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".rules-print .paper-header")
    .first()
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("edition-mobile.png") });
});

test('draft editing never replaces a saved character until a valid confirmation', async ({ page }) => {
  await page.goto('/');
  const original = await saved(page);
  await page.getByRole('button', { name: 'Personaggio', exact: true }).click();
  await page.getByRole('button', { name: 'Modifica scheda', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('');
  await page.getByRole('button', { name: 'Salva modifiche' }).click();
  await expect(page.locator('.draft-editor [role=alert]')).toBeVisible();
  expect((await saved(page)).name).toBe(original.name);
  await page.reload();
  expect((await saved(page)).name).toBe(original.name);
  await page.getByRole('button', { name: 'Personaggio', exact: true }).click();
  await page.getByRole('button', { name: 'Modifica scheda', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Nome corretto');
  await page.getByRole('button', { name: 'Salva modifiche' }).click();
  await expect.poll(async () => (await saved(page)).name).toBe('Nome corretto');
  await page.reload();
  await expect(page.locator('.player-heading h1')).toHaveText('Nome corretto');
});

test('corrupt active save stays untouched until explicit recovery', async ({ page }) => {
  await page.goto('/');
  const original = await saved(page);
  await page.evaluate(() => localStorage.setItem('fable-character', '{broken'));
  await page.reload();
  await expect(page.locator('.recovery-notice')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('fable-character'))).toBe('{broken');
  await page.getByRole('button', { name: 'Usa questa copia e conserva l\'originale' }).click();
  await expect(page.locator('.recovery-notice')).toBeHidden();
  expect((await saved(page)).id).toBe(original.id);
  expect(await page.evaluate(() => localStorage.getItem('fable-character-unreadable'))).toBe('{broken');
});

test('mobile player sees hit points and a roll without scrolling in both character models', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const visibleAboveNavigation = async locator => {
    const bounds = await locator.boundingBox();
    const nav = await page.locator('.player-mobile-nav').boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThan(nav.y);
  };
  await visibleAboveNavigation(page.getByRole('button', { name: 'Gestisci punti ferita' }));
  await visibleAboveNavigation(page.getByRole('button', { name: 'Tira per colpire con Arco lungo, +6' }));
  await page.screenshot({ path: test.info().outputPath('play-mobile-demo.png') });
  await create(page, { name: 'Lyra', editionId: '5.5-2024' });
  await visibleAboveNavigation(page.getByRole('button', { name: 'Subisci danni' }));
  await visibleAboveNavigation(page.locator('.quick-attacks button').first());
  await page.screenshot({ path: test.info().outputPath('play-mobile-2024.png') });
});

for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
  test(`desktop ${viewport.width} keeps actions, checks and resources side by side`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const panels = await Promise.all(['.action-panel', '.ability-panel', '.ready-panel'].map(s => page.locator(s).boundingBox()));
    for (const panel of panels) {
      expect(panel.y).toBe(panels[0].y);
      expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(panels[0].x + panels[0].width).toBeLessThan(panels[1].x);
    expect(panels[1].x + panels[1].width).toBeLessThan(panels[2].x);
    await page.screenshot({ path: test.info().outputPath('desktop-demo.png') });
    await create(page, { name: 'Lyra', editionId: '5.5-2024' });
    const attack = await page.locator('.quick-attacks').boundingBox();
    const checks = await page.locator('.checks-panel').boundingBox();
    const resources = await page.locator('.resource-panel').boundingBox();
    expect(attack.y).toBe(checks.y);
    expect(checks.y).toBe(resources.y);
    expect(attack.x + attack.width).toBeLessThan(checks.x);
    expect(checks.x + checks.width).toBeLessThan(resources.x);
    expect(attack.y + attack.height).toBeLessThan(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    await page.screenshot({ path: test.info().outputPath('desktop-2024.png') });
  });
}
