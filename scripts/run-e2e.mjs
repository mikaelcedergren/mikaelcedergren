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
        configPath: path.join(repoRoot, 'playwright.config.ts'),
        controller: {
          environment: createE2EControllerEnvironment({
            ci: '1',
            extras: {
              CX_SERVER_RELEASE_IDENTITY_FILE: path.join(
                repoRoot,
                'tests',
                'fixtures',
                'synthetic-server-release.json',
              ),
            },
            pathValue: context.pathValue,
            pnpmCliPath: context.pnpmCliPath,
            proxyUrl: context.proxyUrl,
            runtime: context.runtime,
          }),
          scriptPath: path.join(repoRoot, 'scripts', 'e2e-server.mjs'),
        },
        testDirectory: path.join(repoRoot, 'e2e'),
      };
    },
    productId: 'mikaelcedergren',
    repoRoot,
  });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
