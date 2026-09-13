import { defineConfig } from '@playwright/test';
import {
  createHermeticPlaywrightUse,
  validateOwnedE2ERuntime,
} from '@mikaelcedergren/cx-framework/platform/e2e-runner';
import path from 'node:path';
const runtime = validateOwnedE2ERuntime({ productId: 'mikaelcedergren' });
export default defineConfig({
  testDir: './tests/pdf',
  outputDir: path.join(runtime.root, 'pdf-output'),
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: 'list',
  use: createHermeticPlaywrightUse(runtime),
  projects: [{ name: 'chromium' }],
});
