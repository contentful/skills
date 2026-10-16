import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildDatabase, refreshEntries } from './generate-db.ts';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const MAIN = join(HERE, '..', '..', 'main.ts');

test(
  'generate-db preserves snapshot identity and replaces a summary symlink without changing its target',
  { skip: process.platform === 'win32' },
  () => {
    const root = mkdtempSync(join(tmpdir(), 'exo-generate-db-summary-'));
    const raw = join(root, 'raw');
    const snapshot = join(root, 'snapshot');
    mkdirSync(raw);
    mkdirSync(snapshot);
    const identity = { space_id: 'space-1', environment_id: 'master' };
    const original = JSON.stringify(identity);
    const target = join(root, 'outside.json');
    const summary = join(snapshot, 'summary.json');
    writeFileSync(target, original);
    symlinkSync(target, summary);

    execFileSync(process.execPath, [
      MAIN,
      'generate-db',
      '--source-dir',
      raw,
      '--db-path',
      join(snapshot, 'contentful-unified.db'),
      '--dir',
      join(root, 'work'),
    ]);

    assert.equal(readFileSync(target, 'utf8'), original);
    assert.equal(lstatSync(summary).isSymbolicLink(), false);
    const generated = JSON.parse(readFileSync(summary, 'utf8'));
    assert.equal(generated.space_id, identity.space_id);
    assert.equal(generated.environment_id, identity.environment_id);
    assert.equal(generated.tables.entries, 0);
    assert.deepEqual(readdirSync(snapshot).sort(), ['contentful-unified.db', 'summary.json']);
  },
);

test('published entry tables mirror entry table columns and ingest published fields', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exo-generate-db-'));
  const contentTypes = join(dir, 'content-types');
  const dbPath = join(dir, 'contentful-unified.db');
  const entriesPath = join(dir, 'entries.json');
  const publishedEntriesPath = join(dir, 'published-entries.json');
  mkdirSync(contentTypes);
  writeFileSync(entriesPath, JSON.stringify([{ sys: { id: 'entry-1' }, fields: { title: { 'en-US': 'Draft' } } }]));
  writeFileSync(
    publishedEntriesPath,
    JSON.stringify([
      {
        sys: { id: 'entry-1', type: 'Entry', publishedAt: '2026-09-01T00:00:00Z' },
        fields: { title: { 'en-US': 'Published' } },
      },
    ]),
  );

  execFileSync(process.execPath, [
    MAIN,
    'generate-db',
    '--dir',
    join(dir, 'work'),
    '--content-types-dir',
    contentTypes,
    '--entries-file',
    entriesPath,
    '--published-entries-file',
    publishedEntriesPath,
    '--db-path',
    dbPath,
  ]);

  const db = new DatabaseSync(dbPath);
  try {
    const columns = (table: string) =>
      db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .map((row) => row.name);
    assert.deepEqual(columns('entries'), columns('published_entries'));
    assert.deepEqual(columns('entry_fields'), columns('published_entry_fields'));
    assert.equal(
      db
        .prepare('SELECT value_json FROM published_entry_fields WHERE entry_id = ? AND field_key = ?')
        .get('entry-1', 'title')?.value_json,
      '"Published"',
    );
  } finally {
    db.close();
  }
});

test('simple ExO rows preserve timestamps and resource-link relationships', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exo-generate-db-simple-'));
  const dbPath = join(dir, 'contentful-unified.db');
  const sys = (id: string, type: string, extra: Record<string, unknown> = {}) => ({
    id,
    type,
    version: 3,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-02T00:00:00Z',
    space: { sys: { id: 'space-1' } },
    environment: { sys: { id: 'environment-1' } },
    ...extra,
  });
  const resourceLink = (type: string, id: string) => ({
    sys: {
      type: 'ResourceLink',
      linkType: `Contentful:${type}`,
      urn: `crn:contentful:::experience:spaces/$self/environments/$self/${type.toLowerCase()}s/${id}`,
    },
  });
  writeFileSync(
    join(dir, 'component-types.json'),
    JSON.stringify({ items: [{ sys: sys('component-1', 'Component'), name: 'Component' }] }),
  );
  writeFileSync(
    join(dir, 'templates.json'),
    JSON.stringify({ items: [{ sys: sys('template-1', 'ExperienceTemplate'), name: 'Template' }] }),
  );
  writeFileSync(
    join(dir, 'experiences.json'),
    JSON.stringify({
      items: [
        {
          sys: sys('experience-1', 'Experience', {
            experienceTemplate: resourceLink('ExperienceTemplate', 'template-1'),
          }),
          name: 'Experience',
        },
      ],
    }),
  );
  writeFileSync(
    join(dir, 'fragments.json'),
    JSON.stringify({
      items: [
        {
          sys: sys('fragment-1', 'ExperienceFragment', { component: resourceLink('Component', 'component-1') }),
          name: 'Fragment',
        },
      ],
    }),
  );

  buildDatabase(dir, dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    assert.deepEqual(
      {
        ...db
          .prepare(
            'SELECT sys_type, sys_version, sys_created_at, sys_updated_at, space_id, environment_id FROM component',
          )
          .get(),
      },
      {
        sys_type: 'Component',
        sys_version: 3,
        sys_created_at: '2026-09-01T00:00:00Z',
        sys_updated_at: '2026-09-02T00:00:00Z',
        space_id: 'space-1',
        environment_id: 'environment-1',
      },
    );
    assert.equal(
      db.prepare('SELECT experience_template_id FROM exo_experience WHERE experience_id = ?').get('experience-1')
        ?.experience_template_id,
      'template-1',
    );
    assert.equal(
      db.prepare('SELECT component_id FROM exo_fragment WHERE fragment_id = ?').get('fragment-1')?.component_id,
      'component-1',
    );
  } finally {
    db.close();
  }
});

test('refreshEntries persists refreshed tags and taxonomy concepts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exo-generate-db-refresh-'));
  const dbPath = join(dir, 'contentful-unified.db');
  writeFileSync(join(dir, 'entries.json'), '[]');
  buildDatabase(dir, dbPath);

  refreshEntries(
    dbPath,
    {
      article: [{ sys: { id: 'entry-1', contentType: { sys: { id: 'article' } } }, fields: {}, metadata: {} }],
    },
    {
      tags: [{ sys: { id: 'tag-1' }, name: 'Tag', visibility: 'public' }],
      concepts: [{ sys: { id: 'concept-1' }, uri: 'https://example.com/concept', prefLabel: { 'en-US': 'Concept' } }],
    },
  );

  const db = new DatabaseSync(dbPath);
  try {
    assert.equal(db.prepare('SELECT name FROM tags WHERE tag_id = ?').get('tag-1')?.name, 'Tag');
    assert.equal(
      db.prepare('SELECT pref_label FROM taxonomy_concepts WHERE concept_id = ?').get('concept-1')?.pref_label,
      '{"en-US":"Concept"}',
    );
  } finally {
    db.close();
  }
});
