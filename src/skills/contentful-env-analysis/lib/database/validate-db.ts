import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export const REQUIRED_SNAPSHOT_TABLES = [
  'content_type',
  'field',
  'entries',
  'entry_fields',
  'assets',
  'asset_fields',
] as const;

export interface DatabaseValidationResult {
  ok: boolean;
  missingTables: string[];
  counts: Record<string, number>;
}

function numberValue(value: unknown): number {
  return typeof value === 'number' || typeof value === 'bigint' ? Number(value) : 0;
}

export function validateDatabase(dbPath: string): DatabaseValidationResult {
  if (!existsSync(dbPath)) throw new Error(`Database not found: ${dbPath}`);

  const db = new DatabaseSync(dbPath, { readOnly: true, allowExtension: false });
  try {
    const tableRows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
    const tables = new Set(tableRows.flatMap((row) => (typeof row.name === 'string' ? [row.name] : [])));
    const missingTables = REQUIRED_SNAPSHOT_TABLES.filter((table) => !tables.has(table));
    if (missingTables.length > 0) return { ok: false, missingTables, counts: {} };

    const counts = Object.fromEntries(
      REQUIRED_SNAPSHOT_TABLES.map((table) => {
        const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
        return [table, numberValue(row?.count)];
      }),
    );
    return { ok: true, missingTables: [], counts };
  } finally {
    db.close();
  }
}

export function runValidateDatabase(argv = process.argv.slice(2)): number {
  const dbPath = argv[0];
  if (!dbPath) {
    console.error('Usage: validate-db <db-path>');
    return 1;
  }
  try {
    const result = validateDatabase(dbPath);
    if (!result.ok) {
      console.error(`FAIL: missing tables: ${result.missingTables.join(', ')}`);
      return 1;
    }
    for (const table of REQUIRED_SNAPSHOT_TABLES) console.log(`${table}: ${result.counts[table] ?? 0}`);
    console.log('OK');
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
