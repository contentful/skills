import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPackages } from './check-packages.js';

test('detects optimization runtime hints and sdk family', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skill-check-packages-'));
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        dependencies: {
          '@contentful/optimization-react-web': '^0.1.0',
          '@contentful/optimization-node': '^0.1.0',
          react: '^18.0.0',
        },
      },
      null,
      2,
    ),
    'utf-8',
  );

  const result = await checkPackages.run({
    input: { projectPath: dir },
    signal: new AbortController().signal,
  });

  assert.equal(result.detected.sdkFamily, 'optimization');
  assert.equal(result.detected.runtimeHint, 'hybrid');
  assert.equal(result.detected.hasOptimizationReactWeb, true);
  assert.equal(result.detected.hasOptimizationNode, true);
});

test('detects mixed installs when both families are present', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skill-check-packages-'));
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        dependencies: {
          '@contentful/optimization-web': '^0.1.0',
          '@ninetailed/experience.js': '^2.0.0',
        },
      },
      null,
      2,
    ),
    'utf-8',
  );

  const result = await checkPackages.run({
    input: { projectPath: dir },
    signal: new AbortController().signal,
  });

  assert.equal(result.detected.sdkFamily, 'mixed');
});
