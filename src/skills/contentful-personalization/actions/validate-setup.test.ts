import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSetup } from './validate-setup.js';

test('validate-setup does not require optional preview, management, or environment variables', async () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'contentful-personalization-validate-'));
  const originalFetch = globalThis.fetch;

  writeFileSync(
    join(projectPath, 'package.json'),
    JSON.stringify({
      dependencies: {
        '@contentful/optimization-nextjs': '^1.0.1',
        contentful: '^11.0.0',
        next: '^15.3.0',
      },
    }),
  );
  writeFileSync(
    join(projectPath, '.env.local'),
    ['OPTIMIZATION_CLIENT_ID=client-id', 'CONTENTFUL_SPACE_ID=space-id', 'CONTENTFUL_ACCESS_TOKEN=delivery-token'].join(
      '\n',
    ),
  );
  globalThis.fetch = async () => new Response(null, { status: 200 });

  try {
    const result = await validateSetup.run({
      input: { projectPath },
      signal: new AbortController().signal,
    });

    assert.equal(result.overallStatus, 'pass');
    assert.equal(result.summary, 'Local setup and Experience API credential/destination connectivity checks passed');
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(projectPath, { recursive: true, force: true });
  }
});
