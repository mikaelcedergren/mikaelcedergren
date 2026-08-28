import { createStaticSiteServer } from '@mikaelcedergren/cx-framework/server/static-site';
import compression from 'compression';
import express from 'express';
import { fileURLToPath } from 'node:url';

createStaticSiteServer({
  compression,
  defaultPort: 3050,
  entrypointUrl: import.meta.url,
  express,
  frameOptions: 'SAMEORIGIN',
  manifestFile: fileURLToPath(new URL('../../cx-product.json', import.meta.url)),
  repoRoot: process.cwd(),
});
