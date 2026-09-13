import { test, expect } from '@playwright/test';
import { createResumeDocument } from '../../scripts/resume-document.mjs';
import path from 'node:path';

test('render the complete resume as a typeset PDF', async ({ page }) => {
  await page.goto('/resume/');
  await expect(page.locator('mc-resume')).toContainText('Work Experience');
  const before = await page.locator('mc-resume section').evaluateAll((sections) =>
    sections
      .map((section) => {
        const copy = section.cloneNode(true) as HTMLElement;
        copy.querySelectorAll('q').forEach((quote) => quote.remove());
        return copy.textContent!.replace(/\s+/g, ' ').trim();
      })
      .sort(),
  );
  await page.evaluate(createResumeDocument);
  await page.addStyleTag({ path: path.resolve('src/app/pages/resume/resume-print.css') });
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await expect(page.locator('.cv-document')).toBeVisible();
  await expect(page.locator('.cv-document section')).toHaveCount(before.length + 1);
  const after = await page
    .locator('.cv-document section[data-section]')
    .evaluateAll((sections) =>
      sections.map((section) => section.textContent!.replace(/\s+/g, ' ').trim()).sort(),
    );
  expect(after).toEqual(before);
  await expect(page.locator('q, nav, button')).toHaveCount(0);
  const footerStyle = await page.evaluate(() => {
    const tokens = getComputedStyle(document.documentElement);
    return `font-family:${tokens.getPropertyValue('--font-family-base')};font-size:${tokens.getPropertyValue('--font-size-body-xs')};color:${tokens.getPropertyValue('--opacity-high')};width:100%;text-align:center;`;
  });
  const output = process.env['MC_PDF_OUTPUT'];
  if (!output) throw new Error('MC_PDF_OUTPUT must be supplied by the PDF builder.');
  const pdf = await page.pdf({
    path: output,
    format: 'A4',
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="${footerStyle.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">Mikael Cedergren · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
  });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(20_000);
});
