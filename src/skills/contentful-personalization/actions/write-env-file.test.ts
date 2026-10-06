import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeEnvFile } from './write-env-file.js';

test('write-env-file refuses browser-exposed Contentful management tokens', async () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'contentful-personalization-env-'));

  try {
    const result = await writeEnvFile.run({
      input: {
        projectPath,
        fileName: '.env.local',
        variables: {
          CONTENTFUL_SPACE_ID: 'space-id',
          NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN: 'unsafe-token',
        },
      },
      signal: new AbortController().signal,
    });

    assert.match(result.skipped[0].reason, /server-only/);
    assert.doesNotMatch(readFileSync(join(projectPath, '.env.local'), 'utf-8'), /unsafe-token/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});
