#!/usr/bin/env node

import {
  createHermeticE2EChildEnvironment,
  validateOwnedE2ERuntime,
} from '@mikaelcedergren/cx-framework/platform/e2e-runner';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createE2EBuildEnvironment,
  createE2EReleaseBuildEnvironment,
  createE2EServerEnvironment,
} from './e2e-environment.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = validateOwnedE2ERuntime({ productId: 'mikaelcedergren' });
const pathValue = requiredEnvironment('PATH');
const pnpmCli = requiredEnvironment('CX_E2E_PNPM_CLI_PATH');
const port = runtime.port;
const serverIdentityFile = requiredEnvironment('CX_SERVER_RELEASE_IDENTITY_FILE');
const releaseDir = path.join(runtime.root, 'release');
const browserDir = path.join(releaseDir, 'browser');
let activeChild;
let shuttingDown = false;

for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM']) {
  process.once(signal, () => void shutdown(signal, signalExitCode(signal)));
}

try {
  await runPackageScript(
    'build:server',
    createE2EBuildEnvironment({ pathValue, runtimeTemp: runtime.runtimeTemp }),
  );
  await runPackageScript(
    'build:release',
    createE2EReleaseBuildEnvironment({
      browserDirectory: browserDir,
      pathValue,
      releaseDirectory: releaseDir,
      runtimeTemp: runtime.runtimeTemp,
    }),
  );
  const server = spawn(process.execPath, [path.join(repoRoot, 'server', 'dist', 'index.js')], {
    cwd: runtime.root,
    detached: false,
    env: createHermeticE2EChildEnvironment(
      createE2EServerEnvironment({
        browserDirectory: browserDir,
        pathValue,
        port,
        runtimeTemp: runtime.runtimeTemp,
        serverIdentityFile,
      }),
      { targetServer: true },
    ),
    stdio: 'inherit',
  });
  activeChild = server;
  server.once('error', (error) => {
    console.error(error);
    void shutdown('SIGTERM', 1);
  });
  server.once('exit', (code) => void shutdown('SIGTERM', code ?? 1));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function runPackageScript(script, environment) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [pnpmCli, script], {
      cwd: repoRoot,
      detached: false,
      env: createHermeticE2EChildEnvironment(environment),
      stdio: 'inherit',
    });
    activeChild = child;
    child.once('error', (error) => {
      if (activeChild === child) activeChild = undefined;
      reject(error);
    });
    child.once('exit', (code) => {
      if (activeChild === child) activeChild = undefined;
      if (code === 0) resolve();
      else reject(new Error(`${script} failed with exit code ${code ?? 'unknown'}.`));
    });
  });
}

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const child = activeChild;
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = new Promise((resolve) => child.once('exit', resolve));
    child.kill(signal);
    await exited;
  }
  process.exit(exitCode);
}

function signalExitCode(signal) {
  return { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 }[signal] ?? 1;
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for isolated Mikael E2E.`);
  return value;
}
