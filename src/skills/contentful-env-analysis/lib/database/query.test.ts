import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { queryDatabase } from './query.ts';

function fixture(): string {
  const dbPath = join(mkdtempSync(join(tmpdir(), 'space-query-')), 'snapshot.db');
  const db = new DatabaseSync(dbPath);
  db.exec("CREATE TABLE example (id INTEGER, name TEXT); INSERT INTO example VALUES (1, 'one'), (2, 'two');");
  db.close();
  return dbPath;
}

test('returns bounded JSON rows from a read-only statement', () => {
  const result = queryDatabase(fixture(), 'SELECT id, name FROM example ORDER BY id', 1);
  assert.deepEqual(result.columns, ['id', 'name']);
  assert.deepEqual(result.rows, [{ id: 1, name: 'one' }]);
  assert.equal(result.truncated, true);
});

test('rejects mutation and multiple statements', () => {
  const dbPath = fixture();
  assert.throws(() => queryDatabase(dbPath, 'DELETE FROM example'), /Only read-only/);
  assert.throws(() => queryDatabase(dbPath, 'SELECT * FROM example; SELECT 1'), /Only one/);
});
