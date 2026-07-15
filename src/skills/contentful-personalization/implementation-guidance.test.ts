import test from 'node:test';
import assert from 'node:assert/strict';
import { implementationGuidance, planPresentationGuidance } from './implementation-guidance.js';

test('plan presentation guidance requires readable Markdown and multiline code', () => {
  const guidance = planPresentationGuidance();

  assert.match(guidance, /short \*\*Decisions\*\* section/);
  assert.match(guidance, /own Markdown heading/);
  assert.match(guidance, /Leave a blank line/);
  assert.match(guidance, /Never squeeze a full function call/);
  assert.match(guidance, /language-labelled fenced code block/);
  assert.match(guidance, /real line breaks/);
});

test('Optimization implementation guidance keeps agents on public references and one entry path', () => {
  const guidance = implementationGuidance({ sdk: 'optimization', workflowOwnsSetup: true });

  assert.match(guidance, /authoritative contract/);
  assert.match(guidance, /Do not inspect node_modules/);
  assert.match(guidance, /concrete build or type error/);
  assert.match(guidance, /Discover every shared content-rendering boundary/);
  assert.match(guidance, /rich-text renderers/);
  assert.match(guidance, /wrapping each compatible boundary/);
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
