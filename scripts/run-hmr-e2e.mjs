#!/usr/bin/env node

import {
  createE2EControllerEnvironment,
  runHermeticE2E,
} from '@mikaelcedergren/cx-framework/platform/e2e-runner';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  process.exitCode = await runHermeticE2E({
    configure(context) {
      return {
        configPath: path.join(repoRoot, 'playwright.hmr.config.ts'),
        controller: {
          environment: createE2EControllerEnvironment({
            pathValue: context.pathValue,
            pnpmCliPath: context.pnpmCliPath,
            proxyUrl: context.proxyUrl,
            runtime: context.runtime,
          }),
          scriptPath: path.join(repoRoot, 'scripts', 'e2e-hmr-server.mjs'),
        },
        testDirectory: path.join(repoRoot, 'tests/hmr'),
      };
    },
    productId: 'mikaelcedergren',
    playwrightArgs: process.argv.slice(2),
    repoRoot,
  });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
