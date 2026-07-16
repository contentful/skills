import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateLocalSetup } from './validate-local-setup.js';

test('validate-local-setup treats CPA and CMA as optional accelerators', async () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'contentful-personalization-local-'));
  writeFileSync(
    join(projectPath, 'package.json'),
    JSON.stringify({
      dependencies: {
        '@contentful/optimization-nextjs': '^1.0.1',
        contentful: '^11.0.0',
      },
    }),
  );
  writeFileSync(
    join(projectPath, '.env.local'),
    ['OPTIMIZATION_CLIENT_ID=client-id', 'CONTENTFUL_SPACE_ID=space-id', 'CONTENTFUL_ACCESS_TOKEN=delivery-token'].join(
      '\n',
    ),
  );

  try {
    const result = await validateLocalSetup.run({
      input: { projectPath },
      signal: new AbortController().signal,
    });

    assert.equal(result.status, 'pass');
    assert.equal(result.findings.find((finding) => finding.item === 'Optional validation credentials')?.status, 'skip');
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('validate-local-setup scopes analytics extensions to SDK and analytics credentials', async () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'contentful-personalization-analytics-'));
  writeFileSync(
    join(projectPath, 'package.json'),
    JSON.stringify({ dependencies: { '@contentful/optimization-web': '^1.0.1' } }),
  );
  writeFileSync(join(projectPath, '.env.local'), 'OPTIMIZATION_CLIENT_ID=client-id\n');

  try {
    const result = await validateLocalSetup.run({
      input: { projectPath, profile: 'analytics-extension' },
      signal: new AbortController().signal,
    });

    assert.equal(result.status, 'pass');
    assert.equal(result.findings.find((finding) => finding.item === 'Contentful SDK package')?.status, 'skip');
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('validate-local-setup omits unrelated Content API and Live Events guidance for code merge tags', async () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'contentful-personalization-merge-tag-'));
  writeFileSync(
    join(projectPath, 'package.json'),
    JSON.stringify({ dependencies: { '@contentful/optimization-react-web': '^1.0.1' } }),
  );
  writeFileSync(join(projectPath, '.env.local'), 'OPTIMIZATION_CLIENT_ID=client-id\n');

  try {
    const result = await validateLocalSetup.run({
      input: { projectPath, profile: 'merge-tag-code-extension' },
      signal: new AbortController().signal,
    });

    assert.equal(result.status, 'pass');
    assert.ok(!result.findings.some((finding) => finding.item === 'Optional validation credentials'));
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});
