import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { parseArgs, requiredStringArg, stringArg } from '../shared/args.ts';
import { isDirectExecution } from '../shared/is-direct-execution.ts';

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  truncated: boolean;
}

function safeSql(sql: string): string {
  const value = sql.trim().replace(/;\s*$/, '');
  if (!/^(SELECT|WITH|EXPLAIN)\b/i.test(value)) {
    throw new Error('Only read-only SELECT, WITH, or EXPLAIN statements are allowed');
  }
  if (value.includes(';')) throw new Error('Only one SQL statement is allowed');
  return value;
}

export function queryDatabase(dbPath: string, sql: string, limit = 200): QueryResult {
  if (!existsSync(dbPath)) throw new Error(`Database not found: ${dbPath}`);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10_000) throw new Error('--limit must be between 1 and 10000');
  const db = new DatabaseSync(dbPath, {
    readOnly: true,
    allowExtension: false,
    enableDoubleQuotedStringLiterals: false,
  });
  try {
    db.exec('PRAGMA query_only = ON; PRAGMA trusted_schema = OFF;');
    const statement = db.prepare(safeSql(sql));
    const columns = statement.columns().map((column) => column.name);
    const rows: Record<string, unknown>[] = [];
    let truncated = false;
    for (const row of statement.iterate()) {
      if (rows.length === limit) {
        truncated = true;
        break;
      }
      rows.push(
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value]),
        ),
      );
    }
    return { columns, rows, truncated };
  } finally {
    db.close();
  }
}

export function runQuery(argv = process.argv.slice(2)): number {
  try {
    const args = parseArgs(argv);
    const dbPath = requiredStringArg(args, 'db');
    const sql = requiredStringArg(args, 'sql');
    const rawLimit = stringArg(args, 'limit');
    const result = queryDatabase(dbPath, sql, rawLimit === null ? 200 : Number(rawLimit));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (isDirectExecution(import.meta.url, process.argv[1], ['query.ts', 'query.js'])) {
  process.exitCode = runQuery();
}
