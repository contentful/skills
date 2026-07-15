import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectPackageManager } from './check-packages.js';

test('detectPackageManager finds a pnpm workspace marker above a nested app', async () => {
  const root = mkdtempSync(join(tmpdir(), 'contentful-pm-pnpm-'));
  const app = join(root, 'examples', 'apps', 'perch');
  mkdirSync(join(root, '.git'));
  mkdirSync(app, { recursive: true });
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - examples/apps/*\n');
  writeFileSync(join(app, 'package.json'), '{"name":"perch"}');

  try {
    assert.equal(await detectPackageManager(app), 'pnpm');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('detectPackageManager uses an ancestor packageManager declaration', async () => {
  const root = mkdtempSync(join(tmpdir(), 'contentful-pm-field-'));
  const app = join(root, 'apps', 'site');
  mkdirSync(join(root, '.git'));
  mkdirSync(app, { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"packageManager":"yarn@4.9.2"}');
  writeFileSync(join(app, 'package.json'), '{"name":"site"}');

  try {
    assert.equal(await detectPackageManager(app), 'yarn');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('detectPackageManager does not cross a git repository boundary', async () => {
  const outer = mkdtempSync(join(tmpdir(), 'contentful-pm-boundary-'));
  const repo = join(outer, 'repo');
  const app = join(repo, 'apps', 'site');
  mkdirSync(join(repo, '.git'), { recursive: true });
  mkdirSync(app, { recursive: true });
  writeFileSync(join(outer, 'package-lock.json'), '{}');
  writeFileSync(join(app, 'package.json'), '{"name":"site"}');

  try {
    assert.equal(await detectPackageManager(app), 'unknown');
  } finally {
    rmSync(outer, { recursive: true, force: true });
  }
});
