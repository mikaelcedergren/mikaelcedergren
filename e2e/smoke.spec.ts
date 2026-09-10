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

test('the shared masthead works with the portfolio brand and routed pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const masthead = page.locator('cx-masthead');
  const toggle = masthead.getByRole('button', { name: 'Open menu', exact: true });
  const panel = masthead.locator('.cx-masthead__panel');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toHaveAttribute('inert', '');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const spacing = await masthead.evaluate((host) => {
      const header = host.querySelector('.cx-masthead')!.getBoundingClientRect();
      const brand = host.querySelector('.mc-brand')!.getBoundingClientRect();
      const icon = host.querySelector('.cx-masthead__toggle-icon')!.getBoundingClientRect();
      const button = host.querySelector('.cx-masthead__toggle')!.getBoundingClientRect();
      return {
        left: brand.left - header.left,
        right: header.right - icon.right,
        targetWidth: button.width,
        targetHeight: button.height,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(Math.abs(spacing.left - spacing.right)).toBeLessThanOrEqual(1);
    expect(spacing.targetWidth).toBeGreaterThanOrEqual(44);
    expect(spacing.targetHeight).toBeGreaterThanOrEqual(44);
    expect(spacing.overflow).toBe(false);
  }

  await toggle.hover();
  await expect(toggle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await toggle.click();
  const close = masthead.getByRole('button', { name: 'Close menu', exact: true });
  await expect(close).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.locator('.cx-masthead__panel-inner')).toHaveCSS('opacity', '1');
  await close.press('Tab');
  const portfolio = panel.getByRole('link', { name: 'Portfolio', exact: true });
  await expect(portfolio).toBeFocused();
  await portfolio.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(panel).toHaveAttribute('inert', '');

  await toggle.click();
  await panel.getByRole('link', { name: 'Resume', exact: true }).click();
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { level: 1, name: /^Art Director/ })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(toggle).toBeHidden();
  await expect(masthead.getByRole('link', { name: 'Resume', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(masthead.getByRole('link', { name: 'Concepts', exact: true })).toHaveCount(0);
  const response = await page.goto('/concepts/');
  expect(response?.ok()).toBeTruthy();
});

test('portfolio images keep moving in covered frames and respect reduced motion', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const frames = page.locator('.mc-parallax');
  await expect(frames).toHaveCount(26);
  await expect(page.locator('.section-header .mc-parallax')).toHaveCount(0);
  await expect(page.locator('.home-page section > img')).toHaveCount(0);
  await expect(page.locator('.two-columns > .mc-parallax')).toHaveCount(6);
  for (const logo of await page.locator('.section-header img').all()) {
    await expect(logo).toHaveCSS('animation-name', 'none');
    await expect(logo).toHaveCSS('transform', 'none');
  }
  await page.locator('.home-page').evaluate(async (element) => {
    await document.fonts.ready;
    await Promise.all([...element.querySelectorAll('img')].map((image) => image.decode()));
  });

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    for (const frame of await frames.all()) {
      const image = frame.locator('img');
      const layout = await frame.evaluate((element) => ({
        top: element.getBoundingClientRect().top + window.scrollY,
        height: element.getBoundingClientRect().height,
        documentHeight: document.documentElement.scrollHeight,
      }));
      const transforms: string[] = [];
      const offsets: number[] = [];
      // Equal scroll steps from first appearance until almost completely gone.
      // Sampling only the centre misses easing that stalls near either edge.
      for (const progress of [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95]) {
        await page.evaluate(
          ({ top, height, progress }) =>
            window.scrollTo({
              top: top - innerHeight + (innerHeight + height) * progress,
              behavior: 'instant',
            }),
          { top: layout.top, height: layout.height, progress },
        );
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        await expect
          .poll(() => image.evaluate((element) => getComputedStyle(element).transform))
          .not.toBe(transforms.at(-1) ?? 'none');
        const geometry = await frame.evaluate((element) => {
          const frame = element.getBoundingClientRect();
          const image = element.querySelector('img')!.getBoundingClientRect();
          return {
            covered:
              image.top <= frame.top &&
              image.bottom >= frame.bottom &&
              image.left <= frame.left &&
              image.right >= frame.right,
            height: frame.height,
            offset: (image.top + image.bottom - frame.top - frame.bottom) / 2,
            documentHeight: document.documentElement.scrollHeight,
            transform: getComputedStyle(element.querySelector('img')!).transform,
          };
        });
        expect(geometry.covered).toBe(true);
        expect(geometry.height).toBeCloseTo(layout.height, 1);
        expect(geometry.documentHeight).toBe(layout.documentHeight);
        transforms.push(geometry.transform);
        offsets.push(geometry.offset);
      }
      const travel = offsets.slice(1).map((offset, index) => offset - offsets[index]);
      expect(Math.min(...travel)).toBeGreaterThan(1);
      // Movement near the edges must stay perceptible compared with the centre.
      expect(Math.min(...travel) / Math.max(...travel)).toBeGreaterThan(0.65);
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const image of await frames.locator('img').all()) {
      await expect(image).toHaveCSS('transform', 'none');
      await expect(image).toHaveCSS('animation-name', 'none');
    }
  }
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

test('writing links to Substack and the retired local blog is absent', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(
    page.locator('cx-masthead').getByRole('link', { name: 'Blog', exact: true }),
  ).toHaveAttribute('href', 'https://mikaelcedergren.substack.com');
  for (const route of ['/blog/', '/blog/posts/creative-leadership.html']) {
    const response = await request.get(route);
    expect(response.status()).toBe(404);
  }
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).not.toContain('/blog');
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
