import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validateOwnedE2ERuntime } from '@mikaelcedergren/cx-framework/platform/e2e-runner';

const runtime = validateOwnedE2ERuntime({ productId: 'mikaelcedergren' });
const root = path.join(runtime.root, 'hmr-fixture');

test('template and TypeScript edits stay current across hot updates and reloads', async ({
  page,
  request,
}) => {
  const messages: string[] = [];
  page.on('console', (message) => messages.push(message.text()));
  await page.goto('/');
  await expect(page.getByRole('heading')).toHaveText('Initial original');
  await expect.poll(() => messages.includes('[vite] connected.')).toBe(true);
  await page.evaluate(() => {
    document.body.dataset['hmrSentinel'] = 'same page';
  });

  await writeFile(path.join(root, 'app.html'), '<h1>Template {{ label }}</h1>');
  await expect(page.getByRole('heading')).toHaveText('Template original');
  const templateUpdate = async () =>
    (await request.get('/@ng/component?c=campaign.ts%40Campaign')).text();
  expect(await templateUpdate()).toContain('Template');
  await expect(page.locator('body')).toHaveAttribute('data-hmr-sentinel', 'same page');

  // Cache correctness must not depend on a connected client invalidating metadata.
  await page.goto('about:blank');
  const mainBundle = await (await request.get('/main.js')).text();
  const source = await readFile(path.join(root, 'campaign.ts'), 'utf8');
  await writeFile(
    path.join(root, 'campaign.ts'),
    source.replace('./app.html', './next.html').replace("'original'", "'edited'"),
  );
  await expect.poll(async () => (await request.get('/main.js')).text()).not.toBe(mainBundle);
  expect((await templateUpdate()).length).toBe(0);
  await page.goto('/');
  await expect(page.getByRole('heading')).toHaveText('Current edited');
  await page.reload();
  await expect(page.getByRole('heading')).toHaveText('Current edited');

  await page.evaluate(() => {
    document.body.dataset['hmrSentinel'] = 'still hot';
  });
  await writeFile(path.join(root, 'next.html'), '<h1>Latest {{ label }}</h1>');
  await expect(page.getByRole('heading')).toHaveText('Latest edited');
  expect(await templateUpdate()).toContain('Latest');
  await writeFile(path.join(root, 'styles.css'), 'h1 { color: rgb(40, 50, 60); }');
  await expect(page.getByRole('heading')).toHaveCSS('color', 'rgb(40, 50, 60)');
  await expect(page.getByRole('heading')).toHaveText('Latest edited');
  expect(await templateUpdate()).toContain('Latest');
  await expect(page.locator('body')).toHaveAttribute('data-hmr-sentinel', 'still hot');
  await page.reload();
  await expect(page.getByRole('heading')).toHaveText('Latest edited');
});
