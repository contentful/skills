import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { buildDatabase } from './lib/database/generate-db.ts';

const MAIN = fileURLToPath(new URL('main.ts', import.meta.url));

function richText(content: unknown[]): Record<string, unknown> {
  return { nodeType: 'document', data: {}, content };
}

function paragraph(value: string): Record<string, unknown> {
  return {
    nodeType: 'paragraph',
    data: {},
    content: [{ nodeType: 'text', value, marks: [], data: {} }],
  };
}

function runCli(cwd: string, ...args: string[]): string {
  const result = spawnSync(process.execPath, [MAIN, ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

test(
  'init never follows a dangling credentials symlink or overwrites existing credentials',
  { skip: process.platform === 'win32' },
  () => {
    const root = mkdtempSync(join(tmpdir(), 'contentful-env-analysis-init-'));
    const work = join(root, 'work');
    mkdirSync(work);
    const target = join(root, 'outside.env');
    symlinkSync(target, join(work, '.env'));
    runCli(root, 'init', '--dir', work);
    const fd = openSync(target, 'wx+', 0o600);
    try {
      writeSync(fd, 'SPACE_ID=keep-me\n', 0, 'utf8');
      runCli(root, 'init', '--dir', work);
      assert.equal(readFileSync(fd, 'utf8'), 'SPACE_ID=keep-me\n');
    } finally {
      closeSync(fd);
    }
  },
);

test('init shows the data notice and adds it to new credentials files without changing existing credentials', () => {
  const root = mkdtempSync(join(tmpdir(), 'contentful-env-analysis-notice-'));
  const work = join(root, 'work');
  try {
    const initialized = spawnSync(process.execPath, [MAIN, 'init', '--dir', work], { cwd: root, encoding: 'utf8' });
    assert.equal(initialized.status, 0, initialized.stderr);
    const envPath = join(work, '.env');
    const env = readFileSync(envPath, 'utf8');
    const notice = env
      .split('\n')
      .filter((line) => line.startsWith('# '))
      .map((line) => line.slice(2))
      .join('\n');
    assert.notEqual(notice, '', 'the new credentials template must contain a data-processing notice');
    assert.ok(initialized.stderr.includes(notice), 'the same notice must be shown beside the credentials path');
    assert.deepEqual(
      Object.fromEntries(
        env
          .split('\n')
          .filter((line) => line && !line.startsWith('#'))
          .map((line) => line.split('=')),
      ),
      {
        CONTENTFUL_CMA_TOKEN: '',
        SPACE_ID: '',
        ENVIRONMENT_ID: '',
        API_HOST: 'api.contentful.com',
      },
    );

    const existing = 'CONTENTFUL_CMA_TOKEN=notice-test-token\nSPACE_ID=keep-space\nENVIRONMENT_ID=keep-env\n';
    writeFileSync(envPath, existing);
    const repeated = spawnSync(process.execPath, [MAIN, 'init', '--dir', work], { cwd: root, encoding: 'utf8' });
    assert.equal(repeated.status, 0, repeated.stderr);
    assert.equal(readFileSync(envPath, 'utf8'), existing);
    assert.ok(repeated.stderr.includes(notice), 'existing users must also see the notice');
    assert.doesNotMatch(repeated.stdout + repeated.stderr, /notice-test-token/);
    assert.equal(repeated.stdout, '', 'setup diagnostics must not change machine-readable stdout');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('snapshot discovery skips failed and truncated downloads and selects the latest complete snapshot', () => {
  const root = mkdtempSync(join(tmpdir(), 'contentful-env-analysis-discovery-'));
  runCli(root, 'init');
  const folder = join(root, '.contentful-env-analysis', 'snapshots');
  const identity = { space_id: 'space-1', environment_id: 'master' };
  const complete = join(folder, 'complete');
  const raw = join(complete, 'raw');
  mkdirSync(raw, { recursive: true });
  buildDatabase(raw, join(complete, 'contentful-unified.db'));
  writeFileSync(join(complete, 'summary.json'), JSON.stringify(identity));
  utimesSync(complete, new Date(0), new Date(0));

  for (const [name, summary, database] of [
    ['failed', undefined, false],
    ['missing-db', JSON.stringify(identity), false],
    ['malformed', '{broken', true],
    ['missing-identity', '{}', true],
    ['truncated', JSON.stringify({ ...identity, components: { status: 'truncated' } }), true],
  ] as const) {
    const path = join(folder, name);
    mkdirSync(path);
    if (summary) writeFileSync(join(path, 'summary.json'), summary);
    if (database) writeFileSync(join(path, 'contentful-unified.db'), '');
  }

  const discovered = JSON.parse(runCli(root, 'snapshots'));
  assert.deepEqual(
    discovered.map((snapshot: { path: string }) => snapshot.path),
    [realpathSync(complete)],
  );
  const result = JSON.parse(runCli(root, 'query', '--sql', 'SELECT COUNT(*) AS count FROM entries'));
  assert.deepEqual(result.rows, [{ count: 0 }]);
});

test('standalone CLI orients the user and answers a Rich Text completeness question', () => {
  const root = mkdtempSync(join(tmpdir(), 'contentful-env-analysis-cli-'));
  const work = join(root, 'work');
  const snapshot = join(root, 'snapshot');
  const raw = join(snapshot, 'raw');
  mkdirSync(raw, { recursive: true });

  writeFileSync(
    join(raw, 'ct-article.json'),
    JSON.stringify({
      sys: { id: 'article', type: 'ContentType' },
      name: 'Article',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', localized: false, required: true },
        { id: 'body', name: 'Body', type: 'RichText', localized: true, required: false },
      ],
    }),
  );
  writeFileSync(
    join(raw, 'entries.json'),
    JSON.stringify([
      {
        sys: { id: 'empty', type: 'Entry', contentType: { sys: { id: 'article' } } },
        fields: { body: { 'en-US': richText([paragraph('')]) } },
      },
      {
        sys: { id: 'missing', type: 'Entry', contentType: { sys: { id: 'article' } } },
        fields: {},
      },
      {
        sys: { id: 'text', type: 'Entry', contentType: { sys: { id: 'article' } } },
        fields: { body: { 'en-US': richText([paragraph('Hello')]) } },
      },
      {
        sys: { id: 'link', type: 'Entry', contentType: { sys: { id: 'article' } } },
        fields: {
          body: {
            'en-US': richText([
              {
                nodeType: 'embedded-entry-block',
                data: { target: { sys: { type: 'Link', linkType: 'Entry', id: 'linked-entry' } } },
                content: [],
              },
            ]),
          },
        },
      },
    ]),
  );
  buildDatabase(raw, join(snapshot, 'contentful-unified.db'));
  writeFileSync(
    join(snapshot, 'summary.json'),
    JSON.stringify({
      space_id: 'space-1',
      space_name: 'Editorial Space',
      environment_id: 'master',
      api_host: 'api.contentful.com',
    }),
  );

  const initialized = spawnSync(process.execPath, [MAIN, 'init', '--dir', work], { cwd: root, encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.match(initialized.stderr, /add CONTENTFUL_CMA_TOKEN, SPACE_ID, and ENVIRONMENT_ID/);
  assert.deepEqual(readdirSync(work).sort(), ['.env', '.gitignore', 'snapshots']);
  assert.deepEqual(readdirSync(join(work, 'snapshots')), []);
  assert.match(readFileSync(join(work, '.env'), 'utf8'), /CONTENTFUL_CMA_TOKEN=\nSPACE_ID=\nENVIRONMENT_ID=/);
  assert.equal(existsSync(join(work, 'runs')), false);
  assert.equal(existsSync(join(work, 'codebase-analysis')), false);

  writeFileSync(join(root, '.env'), 'SPACE_ID=unrelated-project-space\n');
  writeFileSync(join(work, '.env'), 'SPACE_ID=space-1\nENVIRONMENT_ID=master\n');
  runCli(root, 'init', '--dir', work);
  assert.equal(readFileSync(join(work, '.env'), 'utf8'), 'SPACE_ID=space-1\nENVIRONMENT_ID=master\n');

  const structured = JSON.parse(runCli(root, 'inventory', '--dir', work, '--snapshot', snapshot, '--render', 'json'));
  assert.equal(structured.schemaVersion, 1);
  assert.equal(structured.inventory.spaceId, 'space-1');
  assert.equal(structured.inventory.entryCount, 4);
  assert.equal(structured.inventory.richTextFields[0].emptyEntryCount, 2);
  runCli(root, 'validate-db', '--dir', work, '--db', join(snapshot, 'contentful-unified.db'));
  const directQuery = JSON.parse(
    runCli(
      root,
      'query',
      '--dir',
      work,
      '--db',
      join(snapshot, 'contentful-unified.db'),
      '--sql',
      'SELECT COUNT(*) AS count FROM entries',
    ),
  );
  assert.deepEqual(directQuery.rows, [{ count: 4 }]);

  const inventory = runCli(root, 'inventory', '--dir', work, '--snapshot', snapshot);
  assert.match(inventory, /Editorial Space \[space-1\]/);
  assert.match(inventory, /Article\.Body \(article\.body\): 2\/4 entries populated, 2 empty, 1 with Entry links/);
  assert.match(inventory, /4 potentially unreferenced/);
  assert.doesNotMatch(inventory, /SpaceEnv mismatch/);
  assert.match(
    runCli(root, 'inventory', '--dir', work, '--snapshot', snapshot, '--env-file', join(root, '.env')),
    /SPACE_ID 'unrelated-project-space'/,
  );
  writeFileSync(join(work, '.env'), 'SPACE_ID=different-selected-space\nENVIRONMENT_ID=master\n');
  assert.match(runCli(root, 'inventory', '--dir', work, '--snapshot', snapshot), /SPACE_ID 'different-selected-space'/);

  const sql = `
    WITH values_by_entry AS (
      SELECT e.entry_id, ef.value_json
      FROM entries e
      LEFT JOIN entry_fields ef
        ON ef.entry_id = e.entry_id
        AND ef.field_key = 'body'
        AND ef.locale = 'en-US'
      WHERE e.content_type_id = 'article'
    )
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN value_json IS NULL OR NOT EXISTS (
        SELECT 1 FROM json_tree(value_json)
        WHERE (key = 'value' AND typeof(value) = 'text' AND trim(value) != '')
           OR (key = 'linkType' AND value = 'Entry')
      ) THEN 1 ELSE 0 END) AS empty,
      SUM(CASE WHEN value_json IS NOT NULL AND EXISTS (
        SELECT 1 FROM json_tree(value_json)
        WHERE (key = 'value' AND typeof(value) = 'text' AND trim(value) != '')
           OR (key = 'linkType' AND value = 'Entry')
      ) THEN 1 ELSE 0 END) AS populated,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM json_tree(value_json)
        WHERE key = 'linkType' AND value = 'Entry'
      ) THEN 1 ELSE 0 END) AS with_entry_links
    FROM values_by_entry
  `;
  const result = JSON.parse(runCli(root, 'query', '--dir', work, '--snapshot', snapshot, '--sql', sql));
  assert.deepEqual(result.rows, [{ total: 4, empty: 2, populated: 2, with_entry_links: 1 }]);
});
