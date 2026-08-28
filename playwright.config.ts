import { defineConfig } from '@playwright/test';
import {
  createHermeticPlaywrightUse,
  validateOwnedE2ERuntime,
} from '@mikaelcedergren/cx-framework/platform/e2e-runner';
import path from 'node:path';

const RUNTIME = validateOwnedE2ERuntime({ productId: 'mikaelcedergren' });

export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(RUNTIME.root, 'playwright-output'),
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: process.env.CI === '1',
  retries: process.env.CI === '1' ? 1 : 0,
  reporter: 'list',
  use: createHermeticPlaywrightUse(RUNTIME, {
    trace: 'on-first-retry',
  }),
  projects: [{ name: 'chromium' }],
});
