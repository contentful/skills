#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

import { runFetchSpace } from './lib/contentful-environment/fetch-space.ts';
import { runGenerateDb } from './lib/database/generate-db.ts';
import { runQuery } from './lib/database/query.ts';
import { runValidateDatabase } from './lib/database/validate-db.ts';
import { runInventory } from './lib/space-analysis/startup-inventory.ts';
import { parseArgs, stringArg } from './lib/shared/args.ts';
import { isDirectExecution } from './lib/shared/is-direct-execution.ts';

const WORK_DIR = '.contentful-env-analysis';
const DATA_PROCESSING_NOTICE = [
  'Data processing notice:',
  'This skill saves Contentful content, including drafts and metadata, to local JSON files and a SQLite database.',
  'This data may include confidential or personal information.',
  'Content read by your AI agent may be processed by its provider, depending on your host, account and settings.',
  'Only continue if you are authorised to use this data with the selected agent and provider.',
  'Local copies remain until you delete them. Deleting local files does not delete agent/provider history.',
].join('\n');

function projectBase(): string {
  const segments = process.cwd().split(sep);
  const index = segments.lastIndexOf(WORK_DIR);
  return index === -1 ? process.cwd() : segments.slice(0, index).join(sep) || sep;
}

function workDir(argv: string[]): string {
  return resolve(stringArg(parseArgs(argv), 'dir') ?? join(projectBase(), WORK_DIR));
}

function runInit(argv: string[]): number {
  const root = workDir(argv);
  mkdirSync(join(root, 'snapshots'), { recursive: true });
  writeFileSync(join(root, '.gitignore'), '*\n');
  const envPath = join(root, '.env');
  try {
    const noticeComments = DATA_PROCESSING_NOTICE.split('\n')
      .map((line) => `# ${line}`)
      .join('\n');
    writeFileSync(
      envPath,
      `${noticeComments}\n\nCONTENTFUL_CMA_TOKEN=\nSPACE_ID=\nENVIRONMENT_ID=\nAPI_HOST=api.contentful.com\n`,
      {
        flag: 'wx',
        mode: 0o600,
      },
    );
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
  }
  console.error(`Working folder: ${root}`);
  console.error(`Credentials: ${envPath}`);
  console.error(DATA_PROCESSING_NOTICE);
  console.error('Next: add CONTENTFUL_CMA_TOKEN, SPACE_ID, and ENVIRONMENT_ID to that file.');
  return 0;
}

function snapshots(root: string): { path: string; summary: unknown }[] {
  const folder = join(root, 'snapshots');
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const path = join(folder, entry.name);
      try {
        if (!statSync(join(path, 'contentful-unified.db')).isFile()) return [];
        const summary: unknown = JSON.parse(readFileSync(join(path, 'summary.json'), 'utf8'));
        if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return [];
        if (
          !('space_id' in summary) ||
          typeof summary.space_id !== 'string' ||
          !summary.space_id ||
          !('environment_id' in summary) ||
          typeof summary.environment_id !== 'string' ||
          !summary.environment_id
        )
          return [];
        if (
          Object.values(summary).some(
            (value) => value && typeof value === 'object' && 'status' in value && value.status === 'truncated',
          )
        )
          return [];
        return [{ path, summary }];
      } catch {
        return [];
      }
    })
    .sort((a, b) => statSync(b.path).mtimeMs - statSync(a.path).mtimeMs);
}

function snapshotPath(root: string, argv: string[]): string {
  const requested = stringArg(parseArgs(argv), 'snapshot');
  if (requested) return resolve(requested);
  const latest = snapshots(root)[0]?.path;
  if (!latest) throw new Error('No snapshot found. Run fetch first or pass --snapshot <path>.');
  return latest;
}

async function main(): Promise<number> {
  const [command, ...args] = process.argv.slice(2);
  const rest = args.flatMap((value) => {
    const equals = value.indexOf('=');
    return value.startsWith('--') && equals > 2 ? [value.slice(0, equals), value.slice(equals + 1)] : [value];
  });
  if (!command || command === '--help' || command === '-h') {
    console.error(
      'Usage: node scripts/main.js <init|fetch|snapshots|inventory|query|generate-db|validate-db> [options]',
    );
    console.error('Options: --dir <work-folder> --env-file <credentials-file> --snapshot <snapshot-folder>');
    console.error('Fetch: --out-dir <folder> --result-file <file> --refresh-db <db> --content-type <id>');
    console.error(
      'Fetch --dry-run: show the selected target and output path without downloading or exposing credentials.',
    );
    console.error(
      'Inventory: --render human|json. Query/validation: --db <file>. Query: --sql <SELECT> --limit <rows>.',
    );
    return command ? 0 : 1;
  }
  try {
    if (command === 'init') return runInit(rest);
    const parsed = parseArgs(rest);
    const root = workDir(rest);
    if (!existsSync(root)) runInit(rest);
    if (command === 'snapshots') {
      process.stdout.write(`${JSON.stringify(snapshots(root), null, 2)}\n`);
      return 0;
    }
    if (command === 'fetch') {
      const reuse = stringArg(parsed, 'snapshot');
      const output = stringArg(parsed, 'out-dir');
      if (reuse && output && resolve(reuse) !== resolve(output)) {
        throw new Error('--snapshot and --out-dir must select the same folder when reusing a snapshot');
      }
      const forwarded = rest.filter(
        (value, index) =>
          value !== '--dir' &&
          rest[index - 1] !== '--dir' &&
          value !== '--snapshot' &&
          rest[index - 1] !== '--snapshot' &&
          value !== '--env-file' &&
          rest[index - 1] !== '--env-file',
      );
      if (!output) forwarded.push('--out-dir', reuse ? resolve(reuse) : join(root, 'snapshots'));
      forwarded.push('--keep-db');
      if (reuse) forwarded.push('--skip-if-present');
      process.env.CONTENTFUL_ENV_FILE = stringArg(parsed, 'env-file') ?? join(root, '.env');
      return runFetchSpace(forwarded);
    }
    if (command === 'generate-db') {
      const cleaned = rest.filter((value, index) => value !== '--dir' && rest[index - 1] !== '--dir');
      return runGenerateDb(cleaned);
    }
    const explicitDb = stringArg(parsed, 'db');
    if (command === 'validate-db' && explicitDb) return runValidateDatabase([resolve(explicitDb)]);
    if (command === 'query' && explicitDb) return runQuery(rest);
    const snapshot = snapshotPath(root, rest);
    const cleaned = rest.filter(
      (value, index) =>
        value !== '--dir' && rest[index - 1] !== '--dir' && value !== '--snapshot' && rest[index - 1] !== '--snapshot',
    );
    if (command === 'inventory') {
      const envFile = stringArg(parsed, 'env-file') ?? join(root, '.env');
      return runInventory([
        ...cleaned,
        '--data-dir',
        snapshot,
        '--render',
        stringArg(parsed, 'render') ?? 'human',
        '--env-file',
        envFile,
      ]);
    }
    if (command === 'query') return runQuery([...cleaned, '--db', join(snapshot, 'contentful-unified.db')]);
    if (command === 'validate-db') return runValidateDatabase([join(snapshot, 'contentful-unified.db')]);
    console.error(`Unknown command: ${command}`);
    return 1;
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (isDirectExecution(import.meta.url, process.argv[1], ['main.ts', 'main.js'])) process.exitCode = await main();
