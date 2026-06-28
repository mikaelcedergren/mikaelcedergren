import compression from 'compression';
import express from 'express';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticSiteServer } from '../../server-ops/lib/site-server.mjs';

// Served entirely by the shared static-site server (the one technique every static site here uses).
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
createStaticSiteServer({
  express,
  compression,
  appName: 'mikaelcedergren.com',
  browserDir: join(ROOT, 'dist', 'browser'),
  host: process.env.HOST ?? '127.0.0.1',
  port: Number.parseInt(process.env.PORT ?? '3050', 10),
  frameOptions: 'SAMEORIGIN',
});
