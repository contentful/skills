import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanCredentials } from './scan-credentials.js';

const ENV_NAMES = [
  'CONTENTFUL_SPACE_ID',
  'CONTENTFUL_ACCESS_TOKEN',
  'CONTENTFUL_PREVIEW_TOKEN',
  'CONTENTFUL_MANAGEMENT_TOKEN',
  'CONTENTFUL_CMA_TOKEN',
  'NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN',
  'OPTIMIZATION_CLIENT_ID',
  'OPTIMIZATION_ENVIRONMENT',
  'NINETAILED_API_KEY',
  'NINETAILED_ENVIRONMENT',
];

async function withoutKnownProcessEnv(run: () => Promise<void>): Promise<void> {
  const original = Object.fromEntries(ENV_NAMES.map((name) => [name, process.env[name]]));
  for (const name of ENV_NAMES) delete process.env[name];

  try {
    await run();
  } finally {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test('scan-credentials finds process, project, and monorepo-root values in precedence order', async () => {
  await withoutKnownProcessEnv(async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentful-personalization-creds-'));
    const project = join(root, 'apps', 'site');
    mkdirSync(join(root, '.git'));
    mkdirSync(project, { recursive: true });
    writeFileSync(
      join(root, '.env'),
      ['CONTENTFUL_SPACE_ID=root-space', 'CONTENTFUL_ACCESS_TOKEN=root-delivery-token'].join('\n'),
    );
    writeFileSync(
      join(project, '.env.local'),
      ['CONTENTFUL_SPACE_ID=app-space', 'OPTIMIZATION_CLIENT_ID=app-client'].join('\n'),
    );
    process.env.CONTENTFUL_ACCESS_TOKEN = 'process-delivery-token';

    try {
      const result = await scanCredentials.run({
        input: { projectPath: project },
        signal: new AbortController().signal,
      });

      assert.equal(result.contentful?.spaceId, 'app-space');
      assert.equal(result.contentful?.accessToken, 'process-delivery-token');
      assert.equal(result.optimization?.clientId, 'app-client');
      assert.equal(
        result.envVars.find((variable) => variable.name === 'CONTENTFUL_SPACE_ID')?.source,
        join(project, '.env.local'),
      );
      assert.equal(
        result.envVars.find((variable) => variable.name === 'CONTENTFUL_ACCESS_TOKEN')?.source,
        'process environment',
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

test('scan-credentials rejects browser-exposed management tokens', async () => {
  await withoutKnownProcessEnv(async () => {
    const project = mkdtempSync(join(tmpdir(), 'contentful-personalization-creds-'));
    process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN = 'unsafe-management-token';

    try {
      const result = await scanCredentials.run({
        input: { projectPath: project },
        signal: new AbortController().signal,
      });
      const management = result.envVars.find((variable) => variable.name === 'CONTENTFUL_MANAGEMENT_TOKEN');

      assert.equal(result.contentful?.managementToken, undefined);
      assert.equal(management?.status, 'missing');
      assert.match(management?.warning ?? '', /browser-exposed management token was ignored/);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });
});
