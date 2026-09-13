import { mkdir, copyFile, rename, rm } from 'node:fs/promises';
const directory = new URL('../public/assets/documents/', import.meta.url);
await mkdir(directory, { recursive: true });
const name = 'Mikael-Cedergren-CV.pdf';
const temporary = new URL(`.${name}.tmp`, directory);
try {
  await copyFile(new URL(`../dist/browser/assets/documents/${name}`, import.meta.url), temporary);
  await rename(temporary, new URL(name, directory));
} finally {
  await rm(temporary, { force: true });
}
