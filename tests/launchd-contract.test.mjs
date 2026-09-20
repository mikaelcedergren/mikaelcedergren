import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
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

test('daemon installer is a thin delegate and never activates the service', (t) => {
  const source = readFileSync(installer, 'utf8');
  assert.match(source, /install-site-service-definitions\.mjs/);
  assert.match(source, /--site mikaelcedergren/);
  assert.match(source, /--repo "\$repo" "\$@"/);
  assert.doesNotMatch(source, /\blaunchctl\b/);
  assert.doesNotMatch(source, /\bsudo\b/);
  assert.doesNotMatch(source, /\.env\.|server\/dist/);

  // Exercise this repo's real delegate in an isolated layout. The recorder only observes the
  // operations handoff; the real validator and installer are tested inside server-ops.
  const temporary = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'site-delegate.')));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const relocated = path.join(temporary, "repos with spaces & 'quotes'", 'mikaelcedergren');
  const entrypoint = path.join(relocated, 'bin/install-server-daemon');
  const recorder = path.join(relocated, '../server-ops/bin/install-site-service-definitions.mjs');
  mkdirSync(path.dirname(entrypoint), { recursive: true });
  mkdirSync(path.dirname(recorder), { recursive: true });
  copyFileSync(installer, entrypoint);
  chmodSync(entrypoint, 0o700);
  writeFileSync(
    recorder,
    `
    process.stdout.write(JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd() }));
    process.exitCode = process.argv.includes('--fixture-failure') ? 23 : 0;
  `,
  );
  const environment = { HOME: temporary, PATH: '/usr/bin:/bin', TMPDIR: temporary };
  for (const args of [[], ['--check'], ['--apply'], ['--fixture-failure']]) {
    const result = spawnSync(entrypoint, args, {
      cwd: temporary,
      env: environment,
      encoding: 'utf8',
      timeout: 10_000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, args.includes('--fixture-failure') ? 23 : 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      args: ['--site', 'mikaelcedergren', '--repo', relocated, ...args],
      cwd: temporary,
    });
  }
  rmSync(recorder);
  const missing = spawnSync(entrypoint, ['--check'], {
    cwd: temporary,
    env: environment,
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.notEqual(
    missing.status,
    0,
    'A missing operations checkout must fail, never use another host path.',
  );
  assert.match(missing.stderr, /Cannot find module/);
});
