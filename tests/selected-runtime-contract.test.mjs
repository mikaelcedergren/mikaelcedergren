import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_LEGACY_ENTRYPOINT_SHA256 =
  '53ff46c882e2dd5312267047ebe8e05ded400df99083267ec3c0770dbc7c1185';

test('the currently selected legacy entrypoint remains exact until compiled-server cutover', async () => {
  const source = await readFile(path.join(REPO_ROOT, 'server', 'index.mjs'));
  assert.equal(
    createHash('sha256').update(source).digest('hex'),
    EXPECTED_LEGACY_ENTRYPOINT_SHA256,
  );
});
