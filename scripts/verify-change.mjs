#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERIFICATION_SCHEMA_VERSION = 1;
const repoName = 'mikaelcedergren';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = path.join(repoRoot, '.run', 'verification');
const receiptPath = path.join(runtimeRoot, 'change-receipt.json');
const evidenceRoot = path.join(runtimeRoot, 'evidence');
const allowedArguments = new Set(['--force', '--full', '--plan', '--visual']);

function ensureContained(root, candidate) {
  const resolved = path.resolve(root, candidate);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Path escapes repository: ${candidate}`);
  }
  return resolved;
}

function runGit(args, root = repoRoot) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return result.stdout;
}

export function parseOptions(args) {
  if (
    new Set(args).size !== args.length ||
    args.some((argument) => !allowedArguments.has(argument))
  ) {
    throw new Error('Usage: pnpm verify:change [--plan] [--force] [--full] [--visual]');
  }
  const selected = new Set(args);
  return {
    force: selected.has('--force'),
    forceFull: selected.has('--full'),
    forceVisual: selected.has('--visual'),
    plan: selected.has('--plan'),
  };
}

export function digestSourceEntry(absolutePath) {
  const details = lstatSync(absolutePath, { throwIfNoEntry: false });
  if (!details) return null;
  const hash = createHash('sha256');
  if (details.isSymbolicLink()) {
    hash.update(`symlink\0${readlinkSync(absolutePath)}`);
  } else if (details.isFile()) {
    hash.update(`file\0${details.mode & 0o111 ? 'executable' : 'regular'}\0`);
    hash.update(readFileSync(absolutePath));
  } else {
    throw new Error(`Unsupported source entry: ${absolutePath}`);
  }
  return hash.digest('hex');
}

export function createSourceSnapshot(root = repoRoot) {
  const names = runGit(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], root)
    .split('\0')
    .filter(Boolean)
    .sort();
  const snapshot = {};
  for (const name of names) {
    const digest = digestSourceEntry(ensureContained(root, name));
    if (digest) snapshot[name.split(path.sep).join('/')] = digest;
  }
  return snapshot;
}

export function changedSnapshotPaths(previous, current) {
  const before = previous ?? {};
  const names = new Set([...Object.keys(before), ...Object.keys(current)]);
  return [...names].filter((name) => before[name] !== current[name]).sort();
}

function uniqueRoutes(routes, fallback = '/') {
  const unique = [...new Set(routes.filter(Boolean))];
  if (unique.length === 0 || unique.length > 3) return [fallback];
  return unique;
}

export function routeForSourcePath(file) {
  const post = /^src\/app\/pages\/blog\/posts\/([^/]+)\.component\.ts$/u.exec(file)?.[1];
  if (post) return `/blog/posts/${post}.html`;
  const page = /^src\/app\/pages\/([^/]+)\//u.exec(file)?.[1];
  if (!page || page === 'home' || page === 'not-found') return '/';
  return `/${page}/`;
}

export function classifyChanges(
  changedFiles,
  { forceFull = false, forceVisual = false, hasVerifiedSnapshot = true } = {},
) {
  if (forceFull || !hasVerifiedSnapshot) {
    return {
      checks: forceVisual ? ['full', 'visual'] : ['full'],
      reason: forceFull ? 'explicit full verification' : 'first trusted baseline',
      routes: forceVisual ? ['/'] : [],
    };
  }

  const checks = new Set();
  const routes = [];
  const has = (pattern) => changedFiles.some((file) => pattern.test(file));
  const documentationPattern = /^(?:README\.md|DOMAIN_SETUP\.md|.*\.md)$/u;
  const interfacePattern = /^(?:src\/|public\/)/u;
  const e2ePattern =
    /^(?:e2e\/|playwright\.config\.ts$|scripts\/(?:run-e2e|e2e-server|e2e-environment)\.mjs$)/u;
  const highRiskPattern =
    /^(?:AGENTS\.md|CLAUDE\.md|\.agents\/|\.codex\/|\.gitignore$|package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|angular\.json|tsconfig(?:\.[^.]+)?\.json|cx-product\.json|\.github\/|server\/|launchd\/|bin\/|scripts\/(?:verify-change|sitemap|flatten)\.mjs$|tests\/change-verification\.test\.mjs$|DEVELOPMENT-VERIFICATION\.md$)/u;
  const interfaceFiles = changedFiles.filter((file) => interfacePattern.test(file));
  const e2eChange = has(e2ePattern);
  const unknownChange = changedFiles.some(
    (file) =>
      !documentationPattern.test(file) &&
      !interfacePattern.test(file) &&
      !e2ePattern.test(file) &&
      !highRiskPattern.test(file),
  );
  const highRisk = has(highRiskPattern) || unknownChange;

  if (highRisk) {
    checks.add('full');
    if (e2eChange) checks.add('e2e');
    if (interfaceFiles.length > 0) {
      checks.add('visual');
      routes.push(...interfaceFiles.map(routeForSourcePath));
    }
  } else {
    if (has(documentationPattern)) {
      checks.add('format');
    }
    if (interfaceFiles.length > 0) {
      checks.add('format');
      checks.add('typecheck');
      checks.add('build-browser');
      checks.add('visual');
      routes.push(...interfaceFiles.map(routeForSourcePath));
    }
    if (e2eChange) {
      checks.add('format');
      checks.add('e2e');
    }
    if (checks.size === 0 && changedFiles.length > 0) checks.add('full');
  }

  if (forceVisual) {
    checks.add('visual');
    routes.push('/');
  }
  return {
    checks: [...checks],
    reason:
      changedFiles.length === 0
        ? forceVisual
          ? 'explicit visual verification'
          : 'no source change since last proof'
        : 'changed local files',
    routes: checks.has('visual') ? uniqueRoutes(routes) : [],
  };
}

function commandCheck(id, label, phase, command, { hostAccess = false } = {}) {
  return { command, hostAccess, id, label, phase, type: 'command' };
}

function plannedChecks(classification) {
  const checks = {
    full: commandCheck('full', 'Full Mikael Cedergren proof', 0, ['corepack', 'pnpm', 'check'], {
      hostAccess: true,
    }),
    format: commandCheck('format', 'Formatting', 0, ['corepack', 'pnpm', 'format:check']),
    typecheck: commandCheck('typecheck', 'Type integration', 0, ['corepack', 'pnpm', 'typecheck']),
    'build-browser': commandCheck('build-browser', 'Production browser build', 1, [
      'corepack',
      'pnpm',
      'build:browser',
    ]),
    e2e: commandCheck('e2e', 'Isolated browser journeys', 1, ['corepack', 'pnpm', 'e2e'], {
      hostAccess: true,
    }),
    visual: {
      hostAccess: true,
      id: 'visual',
      label: `Rendered Mikael Cedergren check (${classification.routes.join(', ')})`,
      phase: 2,
      routes: classification.routes.map((route) => ({
        origin: 'http://127.0.0.1:4250',
        route,
      })),
      type: 'visual',
    },
  };
  return classification.checks.map((id) => checks[id]);
}

export function checkOwnsPath(checkId, file) {
  if (checkId === 'full' || checkId === 'format') return true;
  if (checkId === 'typecheck') {
    return /^(?:src\/|server\/|.*\.json$|pnpm-lock\.yaml|pnpm-workspace\.yaml)/u.test(file);
  }
  if (checkId === 'build-browser' || checkId === 'visual') {
    return /^(?:src\/|public\/|angular\.json|package\.json|pnpm-lock\.yaml)/u.test(file);
  }
  if (checkId === 'e2e') {
    return /^(?:src\/|public\/|server\/|e2e\/|scripts\/(?:run-e2e|e2e-server)|playwright\.config|package\.json|pnpm-lock\.yaml)/u.test(
      file,
    );
  }
  return false;
}

export function checkInputHash(check, snapshot) {
  const hash = createHash('sha256');
  hash.update(
    `mikaelcedergren-change-verification-v1\0${process.version}\0${check.id}\0${JSON.stringify(check.command ?? check.routes ?? [])}`,
  );
  for (const [file, digest] of Object.entries(snapshot).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (checkOwnsPath(check.id, file)) hash.update(`\0${file}\0${digest}`);
  }
  return hash.digest('hex');
}

export function readReceipt(file = receiptPath) {
  try {
    const receipt = JSON.parse(readFileSync(file, 'utf8'));
    if (
      receipt.schemaVersion !== VERIFICATION_SCHEMA_VERSION ||
      receipt.repo !== repoName ||
      !receipt.snapshot ||
      typeof receipt.snapshot !== 'object' ||
      !receipt.checks ||
      typeof receipt.checks !== 'object'
    ) {
      return null;
    }
    return receipt;
  } catch {
    return null;
  }
}

export function writeReceipt(file, receipt) {
  const directory = path.dirname(file);
  mkdirSync(directory, { mode: 0o700, recursive: true });
  chmodSync(directory, 0o700);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    chmodSync(temporary, 0o600);
    renameSync(temporary, file);
    chmodSync(file, 0o600);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

export function runCommand(check) {
  const [command, ...args] = check.command;
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const append = (chunk) => {
      output = `${output}${chunk}`.slice(-4 * 1024 * 1024);
    };
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.once('error', (error) =>
      resolve({ check, durationMs: Date.now() - started, error, output, passed: false }),
    );
    child.once('close', (code, signal) =>
      resolve({
        check,
        durationMs: Date.now() - started,
        output,
        passed: code === 0 && !signal,
        status: signal ? `signal ${signal}` : `status ${String(code)}`,
      }),
    );
  });
}

export function safeEvidenceName(route) {
  return route.replace(/^\/+|\/+$/gu, '').replace(/[^a-z0-9]+/giu, '-') || 'home';
}

function pruneEvidence(limit = 20) {
  if (!existsSync(evidenceRoot)) return;
  const files = readdirSync(evidenceRoot)
    .map((name) => ({ name, time: statSync(path.join(evidenceRoot, name)).mtimeMs }))
    .sort((left, right) => right.time - left.time);
  for (const entry of files.slice(limit)) unlinkSync(path.join(evidenceRoot, entry.name));
}

async function runVisual(check) {
  const started = Date.now();
  let browser;
  const evidence = [];
  try {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ headless: true });
    mkdirSync(evidenceRoot, { mode: 0o700, recursive: true });
    chmodSync(evidenceRoot, 0o700);
    for (const target of check.routes) {
      const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
      const browserErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text());
      });
      page.on('pageerror', (error) => browserErrors.push(error.message));
      const response = await page.goto(`${target.origin}${target.route}`, {
        timeout: 20_000,
        waitUntil: 'networkidle',
      });
      if (!response?.ok()) throw new Error(`Route ${target.route} returned ${response?.status()}`);
      if (browserErrors.length > 0) {
        throw new Error(
          `Route ${target.route} reported browser errors:\n${browserErrors.join('\n')}`,
        );
      }
      const output = path.join(
        evidenceRoot,
        `${new Date().toISOString().replace(/[:.]/gu, '-')}-${safeEvidenceName(target.route)}.png`,
      );
      await page.screenshot({ fullPage: true, path: output });
      chmodSync(output, 0o600);
      evidence.push(path.relative(repoRoot, output).split(path.sep).join('/'));
      await page.close();
    }
    pruneEvidence();
    return { check, durationMs: Date.now() - started, evidence, output: '', passed: true };
  } catch (error) {
    return {
      check,
      durationMs: Date.now() - started,
      error,
      evidence,
      output: '',
      passed: false,
    };
  } finally {
    await browser?.close();
  }
}

function printPlan(classification, changedFiles, checks, reusable) {
  console.log('Mikael Cedergren change verification');
  console.log(`Reason: ${classification.reason}`);
  console.log(`Changed source files: ${changedFiles.length}`);
  for (const file of changedFiles) console.log(`  - ${file}`);
  if (classification.routes.length > 0) {
    console.log(`Rendered routes: ${classification.routes.join(', ')}`);
  }
  if (checks.length === 0) {
    console.log('Result: current change is already verified.');
    return;
  }
  console.log('Proof:');
  for (const check of checks) {
    const action = reusable.has(check.id) ? 'Reuse' : 'Run';
    console.log(`  - ${action}: ${check.label}${check.hostAccess ? ' [normal Mac access]' : ''}`);
  }
}

async function main() {
  let options;
  try {
    options = parseOptions(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }

  const snapshot = createSourceSnapshot();
  const receipt = readReceipt();
  const changedFiles = changedSnapshotPaths(receipt?.snapshot, snapshot);
  const classification = classifyChanges(changedFiles, {
    forceFull: options.forceFull,
    forceVisual: options.forceVisual,
    hasVerifiedSnapshot: Boolean(receipt?.snapshot),
  });
  const checks = plannedChecks(classification);
  const inputHashes = Object.fromEntries(
    checks.map((check) => [check.id, checkInputHash(check, snapshot)]),
  );
  const reusable = new Set(
    options.force
      ? []
      : checks
          .filter((check) => receipt?.checks?.[check.id]?.inputHash === inputHashes[check.id])
          .map((check) => check.id),
  );
  printPlan(classification, changedFiles, checks, reusable);
  if (options.plan || checks.length === 0) return;

  const started = Date.now();
  const completed = [];
  const activeChecks = checks.filter((check) => !reusable.has(check.id));
  for (const phase of [...new Set(activeChecks.map((check) => check.phase))].sort()) {
    const phaseChecks = activeChecks.filter((check) => check.phase === phase);
    const results = await Promise.all(
      phaseChecks.map((check) => (check.type === 'visual' ? runVisual(check) : runCommand(check))),
    );
    completed.push(...results);
    for (const result of results) {
      if (result.passed) {
        console.log(`Passed: ${result.check.label} (${(result.durationMs / 1000).toFixed(1)}s)`);
      } else {
        console.error(`Failed: ${result.check.label} (${(result.durationMs / 1000).toFixed(1)}s)`);
        if (result.output.trim()) console.error(result.output.trim());
        if (result.error) console.error(result.error.stack ?? result.error.message);
      }
    }
    if (results.some((result) => !result.passed)) {
      console.error('Verification failed. No passing receipt was written.');
      process.exitCode = 1;
      return;
    }
  }

  const nextChecks = { ...(receipt?.checks ?? {}) };
  for (const result of completed) {
    nextChecks[result.check.id] = {
      command: result.check.command ?? result.check.routes,
      completedAt: new Date().toISOString(),
      durationMs: result.durationMs,
      evidence: result.evidence ?? [],
      inputHash: inputHashes[result.check.id],
    };
  }
  writeReceipt(receiptPath, {
    checks: nextChecks,
    repo: repoName,
    schemaVersion: VERIFICATION_SCHEMA_VERSION,
    snapshot,
    updatedAt: new Date().toISOString(),
  });
  console.log(`Verification passed in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
