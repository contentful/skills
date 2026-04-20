import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'out',
  '.cache',
  'coverage',
  '.turbo',
  '.vercel',
]);

const MAX_FILES = 5000;
const MAX_FILE_SIZE = 256 * 1024; // 256KB

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

export async function walkSourceFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    if (files.length >= MAX_FILES) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES) return;

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          await walk(join(dir, entry.name));
        }
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
        files.push(join(dir, entry.name));
      }
    }
  }

  await walk(root);
  return files;
}

export async function grepFiles(
  files: string[],
  pattern: RegExp,
  root: string,
): Promise<GrepMatch[]> {
  const matches: GrepMatch[] = [];

  for (const file of files) {
    let content: string;
    try {
      const fileStat = await stat(file);
      if (fileStat.size > MAX_FILE_SIZE) continue;
      content = await readFile(file, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({
          file: relative(root, file),
          line: i + 1,
          content: lines[i].trim(),
        });
      }
    }
  }

  return matches;
}

export async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

export async function findFiles(root: string, pattern: RegExp): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          await walk(join(dir, entry.name));
        }
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(join(dir, entry.name));
      }
    }
  }

  await walk(root);
  return results;
}
