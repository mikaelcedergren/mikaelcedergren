import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const installer = path.join(repoRoot, 'bin', 'install-server-daemon');
const label = 'com.mikaelcedergren.server';
const template = path.join(repoRoot, 'launchd', `${label}.plist`);

test('LaunchDaemon source selects the immutable local-only server', () => {
  const source = readFileSync(template, 'utf8');
  assert.match(
    source,
    /\/\.run\/site-releases\/server\/current-server\/artifact\/server\/dist\/index\.js</,
  );
  assert.match(source, /current-server\/server-release\.json</);
  assert.match(source, /<key>HOST<\/key>\s*<string>127\.0\.0\.1<\/string>/);
  assert.match(source, /<key>PORT<\/key>\s*<string>3050<\/string>/);
  assert.doesNotMatch(source, /<key>(?:API_KEY|PASSWORD|SECRET|TOKEN)[^<]*<\/key>/i);
});

test('daemon installer is check-first, shared, definition-only, and copy-safe', (t) => {
  const source = readFileSync(installer, 'utf8');
  assert.match(source, /MODE="check"/);
  assert.match(source, /current-server\/server-release\.json/);
  assert.match(source, /current-server\/artifact\/server\/dist\/index\.js/);
  assert.match(source, /server-ops\/bin\/install-launchdaemon-definitions\.mjs/);
  assert.match(source, /--definition "\$LABEL=\$RENDERED"/);
  assert.doesNotMatch(source, /\b(?:bootout|bootstrap|kickstart|restart)\b/);
  assert.doesNotMatch(source, /sudo install -o root -g wheel -m 0644/);

  if (process.platform !== 'darwin') {
    t.diagnostic('Mac-only installer execution is covered by source contract on this platform.');
    return;
  }

  const direct = execFileSync(installer, ['--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.match(direct, /VALID: Mikael Cedergren LaunchDaemon template/);
  assert.match(direct, /No service definition was installed/);

  const copiedRoot = makeCopiedInstaller(t);
  const copiedInstaller = path.join(copiedRoot, 'bin', 'install-server-daemon');
  assert.equal(
    execFileSync(copiedInstaller, ['--check'], {
      cwd: copiedRoot,
      encoding: 'utf8',
    }),
    direct,
  );
  assert.throws(
    () =>
      execFileSync(copiedInstaller, ['--apply'], {
        cwd: copiedRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    (error) =>
      error instanceof Error &&
      /--apply is allowed only from the canonical production checkout/.test(
        'stderr' in error ? String(error.stderr) : error.message,
      ),
  );
});

test('daemon check rejects a template whose exact semantics drift', (t) => {
  if (process.platform !== 'darwin') return;
  const copiedRoot = makeCopiedInstaller(t);
  const copiedInstaller = path.join(copiedRoot, 'bin', 'install-server-daemon');
  const copiedTemplate = path.join(copiedRoot, 'launchd', `${label}.plist`);
  writeFileSync(
    copiedTemplate,
    readFileSync(copiedTemplate, 'utf8').replace(
      '<string>127.0.0.1</string>',
      '<string>0.0.0.0</string>',
    ),
  );
  assert.throws(
    () =>
      execFileSync(copiedInstaller, ['--check'], {
        cwd: copiedRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    (error) =>
      error instanceof Error &&
      /wrong LaunchDaemon EnvironmentVariables contract/.test(
        'stderr' in error ? String(error.stderr) : error.message,
      ),
  );
});

function makeCopiedInstaller(t) {
  const copiedRoot = mkdtempSync(path.join(os.tmpdir(), 'mikael-daemon-check-'));
  t.after(() => rmSync(copiedRoot, { force: true, recursive: true }));
  mkdirSync(path.join(copiedRoot, 'bin'));
  mkdirSync(path.join(copiedRoot, 'launchd'));
  const copiedInstaller = path.join(copiedRoot, 'bin', 'install-server-daemon');
  copyFileSync(installer, copiedInstaller);
  chmodSync(copiedInstaller, 0o755);
  copyFileSync(template, path.join(copiedRoot, 'launchd', `${label}.plist`));
  return copiedRoot;
}
