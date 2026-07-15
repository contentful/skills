import test from 'node:test';
import assert from 'node:assert/strict';
import { implementationGuidance } from './implementation-guidance.js';

test('Optimization implementation guidance keeps agents on public references and one entry path', () => {
  const guidance = implementationGuidance({ sdk: 'optimization', workflowOwnsSetup: true });

  assert.match(guidance, /authoritative contract/);
  assert.match(guidance, /Do not inspect node_modules/);
  assert.match(guidance, /concrete build or type error/);
  assert.match(guidance, /Default to one shared renderer or component-mapper/);
  assert.match(guidance, /document any exclusions/);
  assert.match(guidance, /application-fetched `baselineEntry`/);
  assert.match(guidance, /do not invent a new consent control/i);
  assert.match(guidance, /workflow actions own package installation/);
});

test('legacy guidance does not prescribe Optimization entry ownership', () => {
  const guidance = implementationGuidance({ sdk: 'ninetailed' });

  assert.doesNotMatch(guidance, /SDK-managed `entryId`/);
  assert.doesNotMatch(guidance, /workflow actions own package installation/);
});
