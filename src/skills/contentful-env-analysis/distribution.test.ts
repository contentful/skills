import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildEnvironmentAnalysis } from './build.ts';

test('committed bundle is current and runs in isolation without installed dependencies', async () => {
  await buildEnvironmentAnalysis(true);
  const root = await mkdtemp(join(tmpdir(), 'env-analysis-installed-'));
  try {
    const skill = join(root, 'skill');
    await cp(fileURLToPath(new URL('../../../skills/contentful-env-analysis', import.meta.url)), skill, {
      recursive: true,
    });
    const run = (...args: string[]) =>
      spawnSync(process.execPath, [join(skill, 'scripts/main.js'), ...args], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, NODE_PATH: '' },
      });
    const initialized = run('snapshots');
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.deepEqual(JSON.parse(initialized.stdout), []);
    assert.deepEqual((await readdir(join(root, '.contentful-env-analysis'))).sort(), [
      '.env',
      '.gitignore',
      'snapshots',
    ]);
    const raw = join(root, 'raw');
    const snapshot = join(root, 'snapshot');
    await mkdir(raw);
    await mkdir(snapshot);
    const generated = run('generate-db', '--source-dir', raw, '--db-path', join(snapshot, 'contentful-unified.db'));
    assert.equal(generated.status, 0, generated.stderr);
    const validated = run('validate-db', '--db', join(snapshot, 'contentful-unified.db'));
    assert.equal(validated.status, 0, validated.stderr);
    const inventory = run('inventory', '--snapshot', snapshot, '--render', 'json');
    assert.equal(inventory.status, 0, inventory.stderr);
    assert.equal(JSON.parse(inventory.stdout).inventory.entryCount, 0);
    const query = run('query', '--snapshot', snapshot, '--sql', 'SELECT COUNT(*) AS count FROM entries');
    assert.equal(query.status, 0, query.stderr);
    assert.deepEqual(JSON.parse(query.stdout).rows, [{ count: 0 }]);
    assert.notEqual(run('query', '--snapshot', snapshot, '--sql', 'DELETE FROM entries').status, 0);
    await writeFile(join(root, '.contentful-env-analysis', '.env'), 'SPACE_ID=preserved\n');
    assert.equal(run('init').status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
