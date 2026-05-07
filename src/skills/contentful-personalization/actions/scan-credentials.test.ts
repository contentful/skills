import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanCredentials } from './scan-credentials.js';

test('detects optimization credentials and ignores .env.example placeholders', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skill-scan-credentials-'));
  await writeFile(
    join(dir, '.env.example'),
    'NEXT_PUBLIC_CONTENTFUL_OPTIMIZATION_CLIENT_ID=<your-client-id>\n',
    'utf-8',
  );
  await writeFile(
    join(dir, '.env.local'),
    [
      'NEXT_PUBLIC_CONTENTFUL_OPTIMIZATION_CLIENT_ID=ctfl_client_123456',
      'NEXT_PUBLIC_CONTENTFUL_OPTIMIZATION_ENVIRONMENT=main',
      'CONTENTFUL_EXPERIENCE_API_BASE_URL=https://experience.ninetailed.co',
      'CONTENTFUL_INSIGHTS_API_BASE_URL=https://ingest.insights.ninetailed.co',
    ].join('\n'),
    'utf-8',
  );

  const result = await scanCredentials.run({
    input: { projectPath: dir },
    signal: new AbortController().signal,
  });

  assert.equal(result.personalization?.clientId, 'ctfl_client_123456');
  assert.equal(result.personalization?.environment, 'main');
  assert.equal(result.personalization?.experienceBaseUrl, 'https://experience.ninetailed.co');
  assert.equal(result.personalization?.insightsBaseUrl, 'https://ingest.insights.ninetailed.co');
});
