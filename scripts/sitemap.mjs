#!/usr/bin/env node
// Pre-build sitemap + robots generator (same pattern as wargr, which regenerates
// public/{sitemap.xml,robots.txt} from its content source on every build). Here the content source
// of truth is src/app/app.routes.ts — every prerendered route carries its canonical path on
// `data.seo.path` — so this reads those paths (skipping `noindex` routes like the 404 catch-all)
// and writes public/sitemap.xml and public/robots.txt. angular.json's assets glob
// `{robots.txt,sitemap.xml}` copies both to the dist root. Runs before `ng build` in `pnpm build`,
// so the sitemap never goes stale when a blog post is added to app.routes.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

// Single source of truth for the origin lives in src/app/shared/seo.ts — read it, don't copy it.
const seoSource = readFileSync(join(REPO, 'src', 'app', 'shared', 'seo.ts'), 'utf8');
const SITE_ORIGIN = seoSource.match(/SITE_ORIGIN = '([^']+)'/)?.[1];
if (!SITE_ORIGIN) {
  console.error('[sitemap] SITE_ORIGIN not found in src/app/shared/seo.ts');
  process.exit(1);
}

const routesSource = readFileSync(join(REPO, 'src', 'app', 'app.routes.ts'), 'utf8');
const paths = [...routesSource.matchAll(/seo:\s*\{\s*path:\s*'([^']*)'([^}]*)\}/g)]
  .filter(([, , rest]) => !rest.includes('noindex'))
  .map(([, path]) => path);
if (paths.length === 0) {
  console.error('[sitemap] no seo paths found in src/app/app.routes.ts');
  process.exit(1);
}

const body = paths.map((p) => `  <url><loc>${SITE_ORIGIN}${p}</loc></url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
writeFileSync(join(REPO, 'public', 'sitemap.xml'), sitemap);
writeFileSync(
  join(REPO, 'public', 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
);
console.log(`[sitemap] done — ${paths.length} url(s) written to public/sitemap.xml + robots.txt.`);
