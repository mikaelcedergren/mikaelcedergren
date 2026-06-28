#!/usr/bin/env node
// One-time migration importer: transplants the legacy CodeKit site (../mikaelcedergren) into Angular
// page components. For each legacy page it extracts the inner HTML of <main>…</main> (the page body;
// the shared bottom <nav> after </main> is dropped — the Angular app shell provides it) and emits a
// standalone component that renders that body verbatim via [innerHTML] (JSON-escaped, so any markup
// — emails with '@', curly braces, etc. — survives without touching the Angular template compiler).
// It also generates src/app/app.routes.ts. After this runs, src/app is the source of truth; the
// legacy folder can be deleted.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const LEGACY = resolve(REPO, '..', 'mikaelcedergren');
const APP = join(REPO, 'src', 'app');
const DEFAULT_DESC =
  'Explore the work of Mikael Cedergren, a designer focused on simple, effective, and meaningful creative solutions.';
const BRAND = 'Mikael Cedergren';

function read(file) {
  return readFileSync(join(LEGACY, file), 'utf8');
}
function mainBody(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!m) throw new Error('no <main> found');
  return m[1].trim();
}
function firstHeading(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
}
function pascal(slug) {
  const p = slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
  return /^[0-9]/.test(p) ? `Page${p}` : p;
}
function writeComponent(filePath, selector, cls, body) {
  mkdirSync(dirname(filePath), { recursive: true });
  const src = `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// Body transplanted verbatim from the legacy site by scripts/import-legacy.mjs.
const HTML = ${JSON.stringify(body)};

@Component({
  selector: '${selector}',
  template: '<div [innerHTML]="body"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${cls} {
  protected readonly body = inject(DomSanitizer).bypassSecurityTrustHtml(HTML);
}
`;
  writeFileSync(filePath, src);
}

const sections = [
  { name: 'home', route: '', file: 'index.html', seoPath: '/', title: `${BRAND} | Art Director, Content Strategist & User Experience Designer` },
  { name: 'about', route: 'about', file: 'about/index.html', seoPath: '/about/', title: `About | ${BRAND}` },
  { name: 'resume', route: 'resume', file: 'resume/index.html', seoPath: '/resume/', title: `Resume | ${BRAND}` },
  { name: 'concepts', route: 'concepts', file: 'concepts/index.html', seoPath: '/concepts/', title: `Concepts | ${BRAND}` },
  { name: 'blog', route: 'blog', file: 'blog/index.html', seoPath: '/blog/', title: `Blog | ${BRAND}` },
];

const routeEntries = [];

for (const s of sections) {
  const body = mainBody(read(s.file));
  const cls = pascal(s.name === 'blog' ? 'blog-index' : s.name) + 'Component';
  const selector = `mc-${s.name}`;
  const compRel = `./pages/${s.name}/${s.name}.component`;
  writeComponent(join(APP, 'pages', s.name, `${s.name}.component.ts`), selector, cls, body);
  routeEntries.push(
    `  {\n    path: '${s.route}',\n    loadComponent: () => import('${compRel}').then((m) => m.${cls}),\n    title: ${JSON.stringify(s.title)},\n    data: { seo: { path: '${s.seoPath}', description: ${JSON.stringify(DEFAULT_DESC)} } satisfies PageSeo },\n  },`,
  );
}

// Blog posts: one component per legacy blog/posts/*.html, URL kept literal (".html").
const postsDir = join(LEGACY, 'blog', 'posts');
for (const file of readdirSync(postsDir).filter((f) => f.endsWith('.html')).sort()) {
  const slug = file.replace(/\.html$/, '');
  const html = read(join('blog', 'posts', file));
  const body = mainBody(html);
  const cls = pascal(slug) + 'Component';
  const selector = `mc-post-${slug}`.slice(0, 60);
  const compRel = `./pages/blog/posts/${slug}.component`;
  writeComponent(join(APP, 'pages', 'blog', 'posts', `${slug}.component.ts`), selector, cls, body);
  const heading = firstHeading(html);
  const title = heading ? `${heading} | ${BRAND}` : `${BRAND} | Blog`;
  routeEntries.push(
    `  {\n    path: 'blog/posts/${slug}.html',\n    loadComponent: () => import('${compRel}').then((m) => m.${cls}),\n    title: ${JSON.stringify(title)},\n    data: { seo: { path: '/blog/posts/${slug}.html', description: ${JSON.stringify(DEFAULT_DESC)}, ogType: 'article' } satisfies PageSeo },\n  },`,
  );
}

// Not-found component + wildcard route.
writeComponent(
  join(APP, 'pages', 'not-found', 'not-found.component.ts'),
  'mc-not-found',
  'NotFoundComponent',
  '<section style="max-width:640px;margin:4rem auto;padding:0 1.5rem;text-align:center"><h1>404</h1><p>This page could not be found.</p><p><a href="/">Back to the portfolio</a></p></section>',
);
routeEntries.push(
  `  {\n    path: '**',\n    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),\n    title: 'Page not found | ${BRAND}',\n    data: { seo: { path: '/404', description: 'Page not found.', noindex: true } satisfies PageSeo },\n  },`,
);

const routesSrc = `import { Routes } from '@angular/router';
import { PageSeo } from './shared/seo';

// GENERATED by scripts/import-legacy.mjs from the legacy CodeKit site. Edit the Angular pages
// directly going forward (src/app/pages/**); re-running the importer overwrites them.
export const routes: Routes = [
${routeEntries.join('\n')}
];
`;
writeFileSync(join(APP, 'app.routes.ts'), routesSrc);

console.log(`[import] generated ${sections.length} sections + blog posts + not-found, and app.routes.ts`);
