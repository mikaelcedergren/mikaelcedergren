import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createE2EBuildEnvironment,
  createE2EReleaseBuildEnvironment,
  createE2EServerEnvironment,
  E2E_BUILD_ENVIRONMENT_KEYS,
  E2E_RELEASE_BUILD_ENVIRONMENT_KEYS,
  E2E_SERVER_ENVIRONMENT_KEYS,
} from '../scripts/e2e-environment.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syntheticRuntimeTemp = '/tmp/mikael-e2e/tmp';

test('product build and server environments are exact, frozen, and ambient-free', (t) => {
  const previousAmbientPoison = process.env.AMBIENT_POISON;
  process.env.AMBIENT_POISON = 'must-not-cross-the-E2E-boundary';
  t.after(() => restoreEnvironment('AMBIENT_POISON', previousAmbientPoison));
  const build = createE2EBuildEnvironment({
    pathValue: '/synthetic/node/bin:/usr/bin:/bin',
    runtimeTemp: syntheticRuntimeTemp,
  });
  const releaseBuild = createE2EReleaseBuildEnvironment({
    browserDirectory: '/tmp/mikael-e2e/release/browser',
    pathValue: '/synthetic/node/bin:/usr/bin:/bin',
    releaseDirectory: '/tmp/mikael-e2e/release',
    runtimeTemp: syntheticRuntimeTemp,
  });
  const server = createE2EServerEnvironment({
    browserDirectory: '/tmp/mikael-e2e/release/browser',
    pathValue: '/synthetic/node/bin:/usr/bin:/bin',
    port: 50_125,
    runtimeTemp: syntheticRuntimeTemp,
    serverIdentityFile: '/synthetic/server-release.json',
  });

  assert.deepEqual(Object.keys(build).sort(), E2E_BUILD_ENVIRONMENT_KEYS);
  assert.deepEqual(Object.keys(releaseBuild).sort(), E2E_RELEASE_BUILD_ENVIRONMENT_KEYS);
  assert.deepEqual(Object.keys(server).sort(), E2E_SERVER_ENVIRONMENT_KEYS);
  assert.equal(build.NPM_CONFIG_GLOBALCONFIG, '/dev/null');
  assert.equal(build.NPM_CONFIG_USERCONFIG, '/dev/null');
  assert.equal(releaseBuild.NPM_CONFIG_GLOBALCONFIG, '/dev/null');
  assert.equal(releaseBuild.NPM_CONFIG_USERCONFIG, '/dev/null');
  for (const environment of [build, releaseBuild, server]) {
    assert.equal(Object.isFrozen(environment), true);
    for (const forbidden of [
      'AMBIENT_POISON',
      'HOME',
      'NODE_OPTIONS',
      'NODE_EXTRA_CA_CERTS',
      'SSH_AUTH_SOCK',
    ]) {
      assert.equal(Object.hasOwn(environment, forbidden), false, forbidden);
    }
  }
});

test('the product harness delegates ownership and isolation to the framework runner', async () => {
  const [packageJsonSource, runnerSource, configSource, controllerSource, specSource] =
    await Promise.all([
      readFile(path.join(repoRoot, 'package.json'), 'utf8'),
      readFile(path.join(repoRoot, 'scripts', 'run-e2e.mjs'), 'utf8'),
      readFile(path.join(repoRoot, 'playwright.config.ts'), 'utf8'),
      readFile(path.join(repoRoot, 'scripts', 'e2e-server.mjs'), 'utf8'),
      readFile(path.join(repoRoot, 'e2e', 'smoke.spec.ts'), 'utf8'),
    ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.equal(packageJson.scripts.e2e, 'node scripts/run-e2e.mjs');
  assert.match(runnerSource, /@mikaelcedergren\/cx-framework\/platform\/e2e-runner/);
  assert.match(runnerSource, /createE2EControllerEnvironment/);
  assert.match(runnerSource, /CX_SERVER_RELEASE_IDENTITY_FILE/);
  assert.match(runnerSource, /testDirectory:/);
  assert.doesNotMatch(runnerSource, /fixedPort|forbiddenPorts/);
  assert.match(runnerSource, /productId: 'mikaelcedergren'/);
  assert.doesNotMatch(runnerSource, /npm_execpath|shell:\s*true|\.\.\.process\.env/);

  assert.match(configSource, /validateOwnedE2ERuntime/);
  assert.match(configSource, /outputDir: path\.join\(RUNTIME\.root, 'playwright-output'\)/);
  assert.match(configSource, /createHermeticPlaywrightUse\(RUNTIME/);
  assert.doesNotMatch(configSource, /\bproxy\s*:|\bserviceWorkers\s*:/);
  assert.match(configSource, /process\.env\.CI === '1'/);
  assert.doesNotMatch(configSource, /webServer|npm_execpath|reuseExistingServer|bypass/);

  assert.match(controllerSource, /validateOwnedE2ERuntime/);
  assert.match(controllerSource, /path\.join\(runtime\.root, 'release'\)/);
  assert.match(controllerSource, /requiredEnvironment\('CX_E2E_PNPM_CLI_PATH'\)/);
  assert.doesNotMatch(controllerSource, /mkdtemp|os\.tmpdir|\brm\(|\.\.\.process\.env/);

  assert.match(specSource, /127\.0\.0\.1:3050/);
  assert.match(specSource, /OTHER_E2E_ORIGIN/);
  assert.doesNotMatch(specSource, /127\.0\.0\.1:4261/);
  assert.match(specSource, /cx-e2e-network-isolation\.invalid/);
  assert.match(specSource, /cx-e2e-launch-proxy-proof/);
  assert.match(specSource, /url\.origin === OWNED_ORIGIN/);
  assert.match(specSource, /request\.get\(target,\s*\{/);
  assert.match(specSource, /failOnStatusCode:\s*false/);
  assert.match(specSource, /maxRedirects:\s*0/);
  assert.match(specSource, /response\.status\(\)\)\.toBe\(403\)/);
  assert.match(specSource, /response\.url\(\)\)\.toBe\(target\)/);
  assert.match(specSource, /globalThis\.fetch\(target\)/);
});

function restoreEnvironment(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
