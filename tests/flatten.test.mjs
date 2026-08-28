import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the post-build step flattens literal HTML routes without flattening sections', async () => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'mikael-flatten-'));
  const browserDir = path.join(fixtureRoot, 'browser');
  const sectionDir = path.join(browserDir, 'blog');
  const articleDir = path.join(sectionDir, 'posts', 'example.html');

  try {
    await mkdir(articleDir, { recursive: true });
    await writeFile(path.join(articleDir, 'index.html'), '<h1>Example article</h1>');
    await writeFile(path.join(sectionDir, 'index.html'), '<h1>Blog</h1>');

    const result = await runNode('scripts/flatten.mjs', {
      SITE_RELEASE_BROWSER_DIR: browserDir,
    });

    assert.equal(result.code, 0, result.stderr);
    assert.equal(
      await readFile(path.join(sectionDir, 'posts', 'example.html'), 'utf8'),
      '<h1>Example article</h1>',
    );
    assert.equal((await stat(sectionDir)).isDirectory(), true);
    assert.equal(await readFile(path.join(sectionDir, 'index.html'), 'utf8'), '<h1>Blog</h1>');
    assert.match(result.stdout, /done — 1 file\(s\) flattened/);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

function runNode(script, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: repoRoot,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.once('error', reject);
    child.once('exit', (code) => resolve({ code, stderr, stdout }));
  });
}
