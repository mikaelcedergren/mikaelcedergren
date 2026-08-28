import { expect, test } from '@playwright/test';

const OWNED_ORIGIN = requiredEnvironment('CX_E2E_BASE_URL');
const OWNED_E2E_PORT = Number(new URL(OWNED_ORIGIN).port);
const OTHER_E2E_ORIGIN = `http://127.0.0.1:${OWNED_E2E_PORT === 49_152 ? 49_153 : 49_152}`;
const BLOCKED_BROWSER_TARGETS = [
  'http://127.0.0.1:3050/healthz',
  `${OTHER_E2E_ORIGIN}/healthz`,
  'https://cx-e2e-network-isolation.invalid/probe',
] as const;
const BLOCKED_PROXY_TARGETS = [
  'http://127.0.0.1:3050/healthz',
  `${OTHER_E2E_ORIGIN}/healthz`,
  'http://cx-e2e-network-isolation.invalid/probe',
] as const;
const unexpectedExternalRequests = new WeakMap<object, string[]>();

test.beforeEach(async ({ context }) => {
  const unexpected: string[] = [];
  unexpectedExternalRequests.set(context, unexpected);
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === OWNED_ORIGIN) {
      await route.continue();
      return;
    }

    unexpected.push(`${request.method()} ${url.href}`);
    await route.abort('blockedbyclient');
  });
});

test.afterEach(async ({ context }) => {
  expect(unexpectedExternalRequests.get(context) ?? []).toEqual([]);
});

test('the browser rejects production, another E2E origin, and the public network', async ({
  context,
  page,
}) => {
  const recorded = unexpectedExternalRequests.get(context);
  for (const target of BLOCKED_BROWSER_TARGETS) {
    const failedRequest = page.waitForEvent('requestfailed', (request) => request.url() === target);
    await page.goto(target).catch(() => undefined);
    expect((await failedRequest).failure()?.errorText).toBe('net::ERR_BLOCKED_BY_CLIENT');
  }
  expect(recorded).toEqual(BLOCKED_BROWSER_TARGETS.map((target) => `GET ${target}`));
  recorded?.splice(0);
});

test('browser launch transport sends production through the owned proxy', async ({
  context,
  page,
}) => {
  await context.unroute('**/*');
  const response = await page.goto('http://127.0.0.1:3050/cx-e2e-launch-proxy-proof');
  expect(response?.status()).toBe(403);
  expect(await response?.text()).toContain('E2E proxy denied this origin.');
});

test('the API request context can reach only the owned origin through its proxy', async ({
  request,
}) => {
  for (const target of BLOCKED_PROXY_TARGETS) {
    const response = await request.get(target, {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    expect(response.status()).toBe(403);
    expect(response.url()).toBe(target);
  }
});

test('test-worker fetch rejects every origin except the owned server', async () => {
  for (const target of BLOCKED_BROWSER_TARGETS) {
    await expect(globalThis.fetch(target)).rejects.toThrow('E2E network isolation blocked fetch');
  }
});

test('the isolated production server exposes health and security headers', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ app: 'mikaelcedergren', ok: true });
  expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
});

test('the server identity endpoint reports the selected synthetic release', async ({ request }) => {
  const response = await request.get('/cx-server.json');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.json()).toMatchObject({
    releaseId: 'synthetic-mikaelcedergren-test',
    entrypoint: 'server/dist/index.js',
    nodeMajor: 26,
  });
});

test('the prerendered portfolio landing page renders its primary message', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Crafting impactful experiences',
  );
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Watch Lanefinder brand video' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Watch graphic showreel 2009' })).toHaveCount(1);
});

test('a portfolio video loads only after the visitor chooses to play it', async ({ page }) => {
  await page.goto('/');
  await page.route('https://player.vimeo.com/**', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Synthetic Vimeo player</title>',
    });
  });

  const trigger = page.getByRole('button', { name: 'Watch Lanefinder brand video' });
  await trigger.click();

  await expect(page.locator('iframe[title="Lanefinder brand video"]')).toHaveAttribute(
    'src',
    'https://player.vimeo.com/video/490739497?autoplay=1',
  );
  await expect(page.getByRole('button', { name: 'Watch Lanefinder brand video' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Watch graphic showreel 2009' })).toHaveCount(1);
});

test('literal blog HTML routes survive the post-build flatten step', async ({ page }) => {
  const response = await page.goto('/blog/posts/creative-leadership.html');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/How to Make Your Creative Team Love the Work/);
});

test('a missing browser asset returns a real non-cacheable 404', async ({ request }) => {
  const response = await request.get('/missing-phase-one.js');
  expect(response.status()).toBe(404);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.text()).toBe('Asset not found');
});

test('an unknown product route returns the real no-cache 404 page', async ({ page }) => {
  const response = await page.goto('/not-a-real-portfolio-route');
  expect(response?.status()).toBe(404);
  expect(response?.headers()['cache-control']).toBe('no-cache');
  expect(response?.headers()['content-type']).toContain('text/html');
  await expect(page.getByText('This page could not be found.', { exact: true })).toBeVisible();
});

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for isolated Mikael E2E.`);
  return value;
}
