import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  changedSnapshotPaths,
  checkInputHash,
  classifyChanges,
  createSourceSnapshot,
  digestSourceEntry,
  parseOptions,
  readReceipt,
  runCommand,
  routeForSourcePath,
  safeEvidenceName,
  writeReceipt,
} from '../scripts/verify-change.mjs';

test('source inventory retains dangling links and detects target changes without following them', (context) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'change-verification-dangling-'));
  context.after(() => rmSync(root, { force: true, recursive: true }));
  const initialized = spawnSync('git', ['init', '--quiet'], { cwd: root, encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr);
  const link = path.join(root, 'source-link');
  const target = path.join(root, 'target.txt');
  symlinkSync('target.txt', link);

  const dangling = createSourceSnapshot(root);
  assert.equal(typeof dangling['source-link'], 'string');
  assert.equal(digestSourceEntry(target), null);

  writeFileSync(target, 'target content');
  assert.equal(digestSourceEntry(link), dangling['source-link']);
  rmSync(target);
  assert.equal(digestSourceEntry(link), dangling['source-link']);

  rmSync(link);
  symlinkSync('another-missing-target.txt', link);
  const retargeted = createSourceSnapshot(root);
  assert.deepEqual(changedSnapshotPaths(dangling, retargeted), ['source-link']);

  rmSync(link);
  assert.equal(digestSourceEntry(link), null);
  assert.deepEqual(changedSnapshotPaths(retargeted, createSourceSnapshot(root)), ['source-link']);
});

test('first use and explicit full select the complete proof', () => {
  assert.deepEqual(classifyChanges([], { hasVerifiedSnapshot: false }).checks, ['full']);
  assert.deepEqual(classifyChanges([], { forceFull: true }).checks, ['full']);
});

test('options have stable meanings and reject unknown or duplicate arguments', () => {
  const flags = ['--plan', '--visual', '--force', '--full'];
  for (let mask = 0; mask < 1 << flags.length; mask += 1) {
    const args = flags.filter((_, index) => mask & (1 << index));
    assert.deepEqual(parseOptions(args), {
      force: args.includes('--force'),
      forceFull: args.includes('--full'),
      forceVisual: args.includes('--visual'),
      plan: args.includes('--plan'),
    });
  }
  assert.deepEqual(parseOptions(['--plan', '--force', '--visual']), {
    force: true,
    forceFull: false,
    forceVisual: true,
    plan: true,
  });
  assert.throws(() => parseOptions(['--unknown']), /Usage:/u);
  assert.throws(() => parseOptions(['--plan', '--plan']), /Usage:/u);
});

test('documentation, interface, E2E, and high-risk paths select their owning proofs', () => {
  assert.deepEqual(classifyChanges(['README.md']).checks, ['format']);
  const ui = classifyChanges(['src/app/pages/about/about.component.ts']);
  assert.deepEqual(ui.checks, ['format', 'typecheck', 'build-browser', 'visual']);
  assert.deepEqual(ui.routes, ['/about/']);
  assert.deepEqual(classifyChanges(['e2e/smoke.spec.ts']).checks, ['format', 'e2e']);
  for (const file of [
    'AGENTS.md',
    'package.json',
    'server/index.ts',
    'launchd/com.mikaelcedergren.server.plist',
    'scripts/sitemap.mjs',
    'scripts/verify-change.mjs',
    'tests/change-verification.test.mjs',
  ]) {
    assert.deepEqual(classifyChanges([file]).checks, ['full'], file);
  }
  assert.deepEqual(
    classifyChanges(['package.json', 'src/app/pages/about/about.component.ts']).checks,
    ['full', 'visual'],
  );
});

test('unknown source fails conservatively into the complete proof', () => {
  assert.deepEqual(classifyChanges(['unexpected/source.xyz']).checks, ['full']);
  assert.deepEqual(classifyChanges(['README.md', 'unexpected/source.xyz']).checks, ['full']);
});

test('explicit visual proof adds the default route without weakening selected checks', () => {
  const result = classifyChanges(['README.md'], { forceVisual: true });
  assert.deepEqual(result.checks, ['format', 'visual']);
  assert.deepEqual(result.routes, ['/']);
});

test('route mapping is bounded and product-owned', () => {
  assert.equal(
    routeForSourcePath('src/app/pages/blog/posts/brainstorming.component.ts'),
    '/blog/posts/brainstorming.html',
  );
  assert.equal(routeForSourcePath('src/app/pages/concepts/concepts.component.ts'), '/concepts/');
  assert.equal(routeForSourcePath('src/styles.scss'), '/');
  assert.equal(safeEvidenceName('/blog/posts/brainstorming.html'), 'blog-posts-brainstorming-html');
});

test('snapshot comparison detects additions, changes, and removals', () => {
  assert.deepEqual(changedSnapshotPaths({ a: '1', b: '2' }, { b: '3', c: '4' }), ['a', 'b', 'c']);
});

test('source inventory includes working-tree, untracked, mode, and symlink state but not ignored files', (context) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'change-verification-source-'));
  context.after(() => rmSync(root, { force: true, recursive: true }));
  const git = (args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  git(['init', '--quiet']);
  writeFileSync(path.join(root, '.gitignore'), 'ignored.txt\n');
  writeFileSync(path.join(root, 'tracked.txt'), 'indexed');
  writeFileSync(path.join(root, 'untracked.txt'), 'local');
  writeFileSync(path.join(root, 'ignored.txt'), 'private');
  symlinkSync('tracked.txt', path.join(root, 'tracked-link'));
  git(['add', '.gitignore', 'tracked.txt', 'tracked-link']);
  writeFileSync(path.join(root, 'tracked.txt'), 'uncommitted');

  const first = createSourceSnapshot(root);
  assert.deepEqual(Object.keys(first), [
    '.gitignore',
    'tracked-link',
    'tracked.txt',
    'untracked.txt',
  ]);
  assert.equal(Object.hasOwn(first, 'ignored.txt'), false);
  writeFileSync(path.join(root, 'tracked.txt'), 'changed again');
  chmodSync(path.join(root, 'untracked.txt'), 0o755);
  const second = createSourceSnapshot(root);
  assert.notEqual(first['tracked.txt'], second['tracked.txt']);
  assert.notEqual(first['untracked.txt'], second['untracked.txt']);
});

test('failed and interrupted commands never report a passing check', async () => {
  const base = { id: 'synthetic', label: 'Synthetic', phase: 0, type: 'command' };
  const failed = await runCommand({
    ...base,
    command: [process.execPath, '-e', 'process.exit(7)'],
  });
  assert.equal(failed.passed, false);
  assert.equal(failed.status, 'status 7');
  const interrupted = await runCommand({
    ...base,
    command: [process.execPath, '-e', "process.kill(process.pid, 'SIGTERM')"],
  });
  assert.equal(interrupted.passed, false);
  assert.match(interrupted.status, /signal SIGTERM/u);
});

test('source digests include content, executable mode, and symbolic-link target', (context) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mikael-verification-'));
  context.after(() => rmSync(root, { force: true, recursive: true }));
  const regular = path.join(root, 'regular.txt');
  writeFileSync(regular, 'one');
  const first = digestSourceEntry(regular);
  writeFileSync(regular, 'two');
  const second = digestSourceEntry(regular);
  assert.notEqual(first, second);
  chmodSync(regular, 0o755);
  assert.notEqual(second, digestSourceEntry(regular));
  const link = path.join(root, 'link');
  symlinkSync('regular.txt', link);
  const linkDigest = digestSourceEntry(link);
  chmodSync(regular, 0o644);
  assert.equal(linkDigest, digestSourceEntry(link));
});

test('check reuse hashes only change when an owned input changes', () => {
  const check = { command: ['pnpm', 'build:browser'], id: 'build-browser' };
  const original = checkInputHash(check, {
    'README.md': 'docs-a',
    'src/app/pages/about/about.component.ts': 'source-a',
  });
  const docsOnly = checkInputHash(check, {
    'README.md': 'docs-b',
    'src/app/pages/about/about.component.ts': 'source-a',
  });
  const sourceChange = checkInputHash(check, {
    'README.md': 'docs-b',
    'src/app/pages/about/about.component.ts': 'source-b',
  });
  assert.equal(original, docsOnly);
  assert.notEqual(original, sourceChange);
});

test('receipts are atomic, private, and invalid receipts are never trusted', (context) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mikael-receipt-'));
  context.after(() => rmSync(root, { force: true, recursive: true }));
  const receiptPath = path.join(root, 'verification', 'receipt.json');
  const receipt = {
    checks: {},
    repo: 'mikaelcedergren',
    schemaVersion: 1,
    snapshot: { 'README.md': 'digest' },
    updatedAt: new Date(0).toISOString(),
  };
  writeReceipt(receiptPath, receipt);
  assert.deepEqual(readReceipt(receiptPath), receipt);
  const { mode } = statSync(receiptPath);
  assert.equal(mode & 0o777, 0o600);
  assert.equal(statSync(path.dirname(receiptPath)).mode & 0o777, 0o700);
  writeFileSync(receiptPath, '{broken', { mode: 0o600 });
  assert.equal(readReceipt(receiptPath), null);
  assert.equal(readFileSync(receiptPath, 'utf8'), '{broken');
});
