import {
  runHermeticE2E,
  createE2EControllerEnvironment,
} from '@mikaelcedergren/cx-framework/platform/e2e-runner';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, mkdir, rename, rm } from 'node:fs/promises';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [browserArgument, outputArgument] = process.argv.slice(2);
if (!browserArgument)
  throw new Error('Usage: build-resume-pdf.mjs <built-browser-directory> [output-directory]');
const browserDirectory = resolve(browserArgument);
const outputDirectory = resolve(outputArgument ?? join(browserDirectory, 'assets/documents'));
await access(join(browserDirectory, 'resume/index.html'));
await mkdir(outputDirectory, { recursive: true });
const destination = join(outputDirectory, 'Mikael-Cedergren-CV.pdf');
const temporary = join(outputDirectory, `.resume-${process.pid}.pdf`);
try {
  const code = await runHermeticE2E({
    playwrightArgs: [],
    productId: 'mikaelcedergren',
    repoRoot,
    configure(context) {
      return {
        configPath: join(repoRoot, 'playwright.pdf.config.ts'),
        testDirectory: join(repoRoot, 'tests/pdf'),
        playwrightEnvironment: { MC_PDF_OUTPUT: temporary },
        controller: {
          scriptPath: join(repoRoot, 'scripts/e2e-server.mjs'),
          environment: createE2EControllerEnvironment({
            ci: '1',
            extras: {
              MC_PDF_BROWSER_DIR: browserDirectory,
              CX_SERVER_RELEASE_IDENTITY_FILE: join(
                repoRoot,
                'tests/fixtures/synthetic-server-release.json',
              ),
            },
            pathValue: context.pathValue,
            pnpmCliPath: context.pnpmCliPath,
            proxyUrl: context.proxyUrl,
            runtime: context.runtime,
          }),
        },
      };
    },
  });
  if (code !== 0) throw new Error('Resume PDF generation failed.');
  await rename(temporary, destination);
  console.log(`Generated ${destination}`);
} finally {
  await rm(temporary, { force: true });
}
