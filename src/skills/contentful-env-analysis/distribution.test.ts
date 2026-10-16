import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { strToU8, zipSync } from 'fflate';
import { checkDistribution, extractSkill } from './sync.js';

test('release import checks integrity and imports only standalone runtime files', () => {
  const prefix = 'contentful-env-analysis/contentful-env-analysis/';
  const files = {
    [prefix + 'SKILL.md']: strToU8(
      '---\nname: contentful-env-analysis\ndescription: Analyze a space.\n---\n\n## Download the snapshot\nRun node bin/main.js init.',
    ),
    [prefix + 'bin/main.js']: strToU8('console.log("test");'),
    [prefix + 'references/database.md']: strToU8('Database reference'),
    [prefix + 'references/exo-domain.md']: strToU8('ExO reference'),
    [prefix + 'references/new-guide.md']: strToU8('A new upstream reference'),
    [prefix + '../../.env']: strToU8('DO_NOT_EXTRACT=1'),
    'contentful-env-analysis/USER-GUIDE.pdf': strToU8('not distributed'),
  };
  const archive = zipSync(files);
  const digest = createHash('sha256').update(archive).digest('hex');
  const result = extractSkill(archive, digest);
  assert.deepEqual(
    [...result.keys()],
    ['SKILL.md', 'scripts/main.js', 'references/database.md', 'references/exo-domain.md', 'references/new-guide.md'],
  );
  assert.match(Buffer.from(result.get('SKILL.md')!).toString(), /node scripts\/main.js init/);
  assert.throws(() => extractSkill(archive, '0'.repeat(64)), /checksum mismatch/);
  delete files[prefix + 'bin/main.js'];
  const incomplete = zipSync(files);
  assert.throws(
    () => extractSkill(incomplete, createHash('sha256').update(incomplete).digest('hex')),
    /Missing release file/,
  );
});

test('committed skill is verified and works in isolation without dependencies or credentials', async () => {
  await checkDistribution();
  const folder = await mkdtemp(join(tmpdir(), 'env-analysis-test-'));
  try {
    const skill = join(folder, 'skill');
    await cp(fileURLToPath(new URL('../../../skills/contentful-env-analysis', import.meta.url)), skill, {
      recursive: true,
    });
    const run = (...args: string[]) =>
      spawnSync(process.execPath, [join(skill, 'scripts/main.js'), ...args], {
        cwd: folder,
        encoding: 'utf8',
        env: { ...process.env, NODE_PATH: '' },
      });
    assert.equal(run('--help').status, 0);
    const initialized = run('init');
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.deepEqual((await readdir(join(folder, '.contentful-env-analysis'))).sort(), [
      '.env',
      '.gitignore',
      'snapshots',
    ]);
    const raw = join(folder, 'raw');
    const snapshot = join(folder, 'snapshot');
    await mkdir(raw);
    await mkdir(snapshot);
    await writeFile(
      join(raw, 'ct-article.json'),
      JSON.stringify({
        sys: { id: 'article' },
        name: 'Article',
        fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
      }),
    );
    await writeFile(
      join(raw, 'entries.json'),
      JSON.stringify([
        { sys: { id: 'article-1', contentType: { sys: { id: 'article' } } }, fields: { title: { 'en-US': 'Hello' } } },
      ]),
    );
    const generated = run('generate-db', '--source-dir', raw, '--db-path', join(snapshot, 'contentful-unified.db'));
    assert.equal(generated.status, 0, generated.stderr);
    const valid = run('validate-db', '--snapshot', snapshot);
    assert.equal(valid.status, 0, valid.stderr);
    const query = run('query', '--snapshot', snapshot, '--sql', 'SELECT entry_id FROM entries');
    assert.equal(query.status, 0, query.stderr);
    assert.match(query.stdout, /article-1/);
    const mutation = run('query', '--snapshot', snapshot, '--sql', 'DELETE FROM entries');
    assert.notEqual(mutation.status, 0);
    const unchanged = run('query', '--snapshot', snapshot, '--sql', 'SELECT entry_id FROM entries');
    assert.equal(unchanged.stdout, query.stdout);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
