import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { validateDatabase } from './validate-db.ts';

test('validates the required snapshot tables and returns their row counts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exo-validate-db-'));
  const dbPath = join(dir, 'contentful-unified.db');
  const db = new DatabaseSync(dbPath);
  for (const table of ['content_type', 'field', 'entries', 'entry_fields', 'assets', 'asset_fields']) {
    db.exec(`CREATE TABLE ${table} (id TEXT)`);
  }
  db.exec("INSERT INTO entries VALUES ('entry-1')");
  db.close();

  assert.deepEqual(validateDatabase(dbPath), {
    ok: true,
    missingTables: [],
    counts: {
      content_type: 0,
      field: 0,
      entries: 1,
      entry_fields: 0,
      assets: 0,
      asset_fields: 0,
    },
  });
});

test('reports every missing required table without changing the database', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exo-validate-db-missing-'));
  const dbPath = join(dir, 'contentful-unified.db');
  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE content_type (id TEXT)');
  db.close();

  const result = validateDatabase(dbPath);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingTables, ['field', 'entries', 'entry_fields', 'assets', 'asset_fields']);
  assert.deepEqual(result.counts, {});
});
