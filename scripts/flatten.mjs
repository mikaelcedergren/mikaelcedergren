#!/usr/bin/env node
// Post-build flatten. Angular SSG prerenders every route to `<route>/index.html`. Our product/blog
// URLs are literal `*.html` files (e.g. /koi-pond-series.html, /blog/posts/<slug>.html), so routes
// whose path ends in `.html` come out as a DIRECTORY `koi-pond-series.html/index.html`. This walks
// dist/browser and flattens each such leaf directory into a flat file `koi-pond-series.html`,
// leaving section/container dirs (about/, blog/, blog/posts/, en/, ...) untouched. Result:
// dist/browser mirrors the live URL tree exactly, so plain static serving preserves every URL.
import { existsSync, readdirSync, renameSync, rmdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const BROWSER = join(ROOT, 'dist', 'browser');

if (!existsSync(BROWSER)) {
  console.error(`[flatten] ${BROWSER} not found — run the build first.`);
  process.exit(1);
}

let count = 0;

function flatten(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name.endsWith('.html')) {
      // leaf `<route>.html/` directory → flatten to a flat file `<route>.html`
      const index = join(full, 'index.html');
      if (!existsSync(index)) {
        console.warn(`[flatten] skip ${full} (no index.html inside)`);
        continue;
      }
      const tmp = `${full}.__flat__`;
      renameSync(index, tmp); // move the page out of the directory
      rmdirSync(full); // throws if the directory still holds other files — a deliberate guard
      renameSync(tmp, full); // the page becomes the flat file `<route>.html`
      count++;
      console.log(`[flatten] ${full.slice(BROWSER.length + 1)}`);
    } else {
      flatten(full); // recurse into section/container dirs (about/, blog/, en/, ...)
    }
  }
}

flatten(BROWSER);
console.log(`[flatten] done — ${count} file(s) flattened.`);
