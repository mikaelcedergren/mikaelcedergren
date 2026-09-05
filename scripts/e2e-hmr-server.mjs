import { spawn } from 'node:child_process';
import { mkdir, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import {
  createHermeticE2EChildEnvironment,
  validateOwnedE2ERuntime,
} from '@mikaelcedergren/cx-framework/platform/e2e-runner';

const workspace = '.';
const require = createRequire(path.resolve(workspace, 'package.json'));
const runtime = validateOwnedE2ERuntime({ productId: 'mikaelcedergren' });
const root = path.join(runtime.root, 'hmr-fixture');
await mkdir(path.join(root, 'public'), { recursive: true });
await symlink(path.resolve(workspace, 'node_modules'), path.join(root, 'node_modules'), 'dir');
const files = {
  'angular.json': JSON.stringify({
    version: 1,
    cli: { analytics: false, cache: { enabled: false } },
    projects: {
      fixture: {
        projectType: 'application',
        root: '',
        sourceRoot: '',
        architect: {
          build: {
            builder: '@angular/build:application',
            options: {
              browser: 'main.ts',
              index: 'index.html',
              tsConfig: 'tsconfig.json',
              outputPath: 'dist',
              optimization: false,
              sourceMap: true,
              styles: ['styles.css'],
              assets: [{ glob: '**/*', input: 'public' }],
            },
          },
          serve: {
            builder: '@angular/build:dev-server',
            options: { buildTarget: 'fixture:build', prebundle: false },
          },
        },
      },
    },
  }),
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'preserve',
      moduleResolution: 'bundler',
      experimentalDecorators: true,
      skipLibCheck: true,
      strict: true,
    },
    angularCompilerOptions: { strictTemplates: true },
    files: ['main.ts'],
  }),
  'index.html': '<html><head><base href="/"></head><body><test-app></test-app></body></html>',
  'main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { provideRouter, RouterOutlet } from '@angular/router';
@Component({ selector: 'test-app', imports: [RouterOutlet], template: '<router-outlet />' })
class App {}
bootstrapApplication(App, { providers: [provideRouter([
  { path: '', loadComponent: () => import('./campaign').then(module => module.Campaign) },
])] });`,
  'campaign.ts': `import { Component } from '@angular/core';
@Component({ selector: 'test-campaign', templateUrl: './app.html' })
export class Campaign { label = 'original'; }`,
  'app.html': '<h1>Initial {{ label }}</h1>',
  'next.html': '<h1>Current {{ label }}</h1>',
  'styles.css': 'h1 { color: rgb(10, 20, 30); }',
  'public/healthz': JSON.stringify({ ok: true }),
};
await Promise.all(
  Object.entries(files).map(([name, content]) => writeFile(path.join(root, name), content)),
);

const child = spawn(
  process.execPath,
  [
    require.resolve('@angular/cli/bin/ng.js'),
    'serve',
    '--host',
    '127.0.0.1',
    '--port',
    String(runtime.port),
  ],
  {
    cwd: root,
    env: createHermeticE2EChildEnvironment(
      {
        PATH: process.env.PATH,
        HOST: '127.0.0.1',
        PORT: String(runtime.port),
        TMPDIR: runtime.runtimeTemp,
        NG_CLI_ANALYTICS: 'false',
      },
      { targetServer: true },
    ),
    stdio: 'inherit',
  },
);
for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM']) {
  process.once(signal, () => child.kill(signal));
}
child.once('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
