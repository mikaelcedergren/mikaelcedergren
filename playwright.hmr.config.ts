import { defineConfig } from '@playwright/test';
import {
  createHermeticPlaywrightUse,
  validateOwnedE2ERuntime,
} from '@mikaelcedergren/cx-framework/platform/e2e-runner';
import path from 'node:path';

const runtime = validateOwnedE2ERuntime({ productId: 'mikaelcedergren' });

export default defineConfig({
  testDir: './tests/hmr',
  outputDir: path.join(runtime.root, 'playwright-output'),
  use: createHermeticPlaywrightUse(runtime),
  projects: [{ name: 'chromium' }],
  reporter: 'list',
  forbidOnly: process.env.CI === '1',
  fullyParallel: false,
  timeout: 60_000,
});
