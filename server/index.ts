import { createRuntimeLogger } from '@mikaelcedergren/cx-framework/server/logging';
import { createStaticSiteServer } from '@mikaelcedergren/cx-framework/server/static-site';
import compression from 'compression';
import express from 'express';
import { fileURLToPath } from 'node:url';

try {
  createStaticSiteServer({
    compression,
    defaultPort: 3050,
    entrypointUrl: import.meta.url,
    express,
    frameOptions: 'SAMEORIGIN',
    manifestFile: fileURLToPath(new URL('../../cx-product.json', import.meta.url)),
    repoRoot: process.cwd(),
    ...(process.env['NODE_ENV'] === 'production'
      ? { trustedProxyAddress: '127.0.0.1' as const }
      : {}),
  });
} catch (error) {
  const mode = process.env['NODE_ENV'];
  createRuntimeLogger({
    identity: {
      service: 'mikaelcedergren',
      role: 'web',
      environment: mode === 'production' || mode === 'test' ? mode : 'development',
      executionScope: mode === 'production' || mode === 'test' ? mode : 'development',
      releaseId: 'unresolved',
      pid: process.pid,
    },
  }).emit({
    event: 'process.start_failed',
    level: 'fatal',
    category: 'diagnostic',
    outcome: 'failure',
    error,
  });
  process.exitCode = 1;
}
