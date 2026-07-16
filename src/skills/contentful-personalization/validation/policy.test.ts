import test from 'node:test';
import assert from 'node:assert/strict';
import type { ValidationStage, ValidationStageEvidence } from '../schemas.js';
import {
  deriveValidationFinalState,
  filterValidationEvidence,
  getEvidenceRerunStages,
  getRerunStages,
  getValidationRequirements,
  getValidationStages,
} from './policy.js';

function evidence(stage: ValidationStage, status: ValidationStageEvidence['status']): ValidationStageEvidence {
  return { stage, status, source: 'local-analysis', summary: `${stage}: ${status}`, findings: [] };
}

test('full setup uses the complete evidence ladder without forcing live validation', () => {
  assert.deepEqual(getValidationRequirements('full-setup'), {
    'local-integrity': 'required',
    'credential-connectivity': 'required',
    'cms-graph': 'required',
    'runtime-transport': 'recommended',
    'personalization-outcome': 'recommended',
  });
});

test('extension profiles only require evidence relevant to the requested change', () => {
  assert.deepEqual(getValidationStages('analytics-extension'), [
    'local-integrity',
    'credential-connectivity',
    'runtime-transport',
  ]);
  assert.equal(getValidationRequirements('merge-tag-extension')['runtime-transport'], 'not-applicable');
});

test('reports discard evidence for non-applicable profile stages', () => {
  assert.deepEqual(
    filterValidationEvidence('merge-tag-code-extension', [
      evidence('local-integrity', 'pass'),
      evidence('runtime-transport', 'deferred'),
      evidence('personalization-outcome', 'pass'),
    ]).map((item) => item.stage),
    ['local-integrity', 'personalization-outcome'],
  );
});

test('typed reports expose the first unresolved stage and its applicable downstream reruns', () => {
  assert.deepEqual(
    getEvidenceRerunStages('analytics-extension', [
      evidence('local-integrity', 'pass'),
      evidence('credential-connectivity', 'fail'),
      evidence('runtime-transport', 'deferred'),
    ]),
    ['credential-connectivity', 'runtime-transport'],
  );
  assert.deepEqual(
    getEvidenceRerunStages('merge-tag-code-extension', [
      evidence('local-integrity', 'pass'),
      evidence('personalization-outcome', 'pass'),
    ]),
    [],
  );
});

test('all applicable stages must pass before reporting end-to-end validation', () => {
  const result = deriveValidationFinalState({
    profile: 'full-setup',
    evidence: [
      evidence('local-integrity', 'pass'),
      evidence('credential-connectivity', 'pass'),
      evidence('cms-graph', 'pass'),
      evidence('runtime-transport', 'pass'),
      evidence('personalization-outcome', 'pass'),
    ],
  });

  assert.equal(result, 'validated-end-to-end');
});

test('unfinished live evidence is pending unless the user explicitly defers it', () => {
  const observations = [
    evidence('local-integrity', 'pass'),
    evidence('credential-connectivity', 'pass'),
    evidence('cms-graph', 'pass'),
    evidence('runtime-transport', 'unavailable'),
    evidence('personalization-outcome', 'unavailable'),
  ];

  assert.equal(
    deriveValidationFinalState({ profile: 'full-setup', evidence: observations }),
    'implementation-complete-live-validation-pending',
  );
  assert.equal(
    deriveValidationFinalState({
      profile: 'full-setup',
      evidence: observations,
      decision: 'defer-live-validation',
    }),
    'implementation-complete-validation-deferred',
  );
});

test('CMS authoring blocks require an explicit workflow decision', () => {
  assert.equal(
    deriveValidationFinalState({
      profile: 'diagnostic-repair',
      evidence: [evidence('cms-graph', 'fail')],
    }),
    'validation-failed',
  );
  assert.equal(
    deriveValidationFinalState({
      profile: 'diagnostic-repair',
      evidence: [evidence('runtime-transport', 'fail')],
    }),
    'validation-failed',
  );
  assert.equal(
    deriveValidationFinalState({
      profile: 'full-setup',
      evidence: [evidence('cms-graph', 'unavailable')],
      decision: 'cannot-author-or-trigger',
    }),
    'blocked-by-cms-authoring-or-publishing',
  );
  assert.equal(
    deriveValidationFinalState({
      profile: 'analytics-extension',
      evidence: [evidence('runtime-transport', 'blocked')],
      decision: 'cannot-complete-validation',
    }),
    'blocked-by-validation-constraints',
  );
});

test('doctor reruns the changed stage and every applicable downstream dependency', () => {
  assert.deepEqual(getRerunStages('cms-graph'), ['cms-graph', 'runtime-transport', 'personalization-outcome']);
  assert.deepEqual(getRerunStages('credential-connectivity', 'analytics-extension'), [
    'credential-connectivity',
    'runtime-transport',
  ]);
});
