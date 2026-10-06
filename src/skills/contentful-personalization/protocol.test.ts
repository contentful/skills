import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const RUN_SCRIPT = resolve('skills/contentful-personalization/scripts/run');

// Shared prefix: explore has run and package data was captured, so downstream steps have a project.
const exploredHistory = (readinessOnly: boolean) => [
  {
    step: 'onboard/explore',
    response: {
      framework: 'nextjs-app',
      routerType: 'app',
      projectPath: '.',
      explorationSummary: 'Generated protocol regression fixture',
      personalizableCandidates: [],
      renderingBoundaries: ['src/components/renderer/SectionRenderer.tsx'],
      existingSetup: 'none',
      readinessOnly,
    },
    actionResult: {
      packages: { ninetailed: [], optimization: [], contentful: [], framework: [] },
      packageManager: 'pnpm',
    },
  },
  {
    step: 'onboard/scan-credentials',
    actionResult: { envVars: [] },
  },
];

function advanceOnboard(step: string, output: unknown, history: unknown): { kind: string; step?: string } {
  const stdout = execFileSync(
    RUN_SCRIPT,
    ['onboard', 'advance', '--step', step, '--output', JSON.stringify(output), '--history', JSON.stringify(history)],
    { cwd: process.cwd(), encoding: 'utf-8' },
  );
  return JSON.parse(stdout) as { kind: string; step?: string };
}

test('generated onboard surfaces the readiness report as the first setup interaction', () => {
  // A ready, non-readiness-only assessment must reach the merged readiness + credential review
  // step (not jump straight to the recommendation, and not terminate at the gate).
  const result = advanceOnboard(
    'onboard/assess',
    { readinessStatus: 'ready', report: 'All good', prerequisites: [], readinessOnly: false },
    exploredHistory(false),
  );

  assert.equal(result.kind, 'prompt');
  assert.equal(result.step, 'onboard/review-readiness');
});

test('generated onboard stops a readiness-only question at the terminal gate', () => {
  const result = advanceOnboard(
    'onboard/assess',
    { readinessStatus: 'ready', report: 'All good', prerequisites: [], readinessOnly: true },
    exploredHistory(true),
  );

  assert.equal(result.kind, 'prompt');
  assert.equal(result.step, 'onboard/gate');
});

test('generated onboard continues from the readiness review into the SDK recommendation', () => {
  const history = [
    ...exploredHistory(false),
    {
      step: 'onboard/assess',
      response: { readinessStatus: 'ready', report: 'All good', prerequisites: [], readinessOnly: false },
    },
  ];
  const result = advanceOnboard('onboard/review-readiness', { choice: 'continue' }, history);

  assert.equal(result.kind, 'prompt');
  assert.equal(result.step, 'onboard/recommend');
});

test('generated onboard verify action restores projectPath from replayed workflow state', () => {
  const runScript = resolve('skills/contentful-personalization/scripts/run');
  const history = [
    {
      step: 'onboard/explore',
      response: {
        framework: 'nextjs-app',
        routerType: 'app',
        projectPath: '.',
        explorationSummary: 'Generated protocol regression fixture',
        personalizableCandidates: [],
        existingSetup: 'partial',
        readinessOnly: false,
      },
      actionResult: {
        packages: { ninetailed: [], optimization: [], contentful: [], framework: [] },
        packageManager: 'pnpm',
      },
    },
  ];

  const stdout = execFileSync(
    runScript,
    ['onboard', 'advance', '--step', 'onboard/verify', '--output', '{}', '--history', JSON.stringify(history)],
    { cwd: process.cwd(), encoding: 'utf-8' },
  );
  const result = JSON.parse(stdout) as {
    kind: string;
    step?: string;
    completed?: { actionResult?: { status?: string } };
  };

  assert.equal(result.kind, 'prompt');
  assert.equal(result.step, 'onboard/fix');
  assert.equal(result.completed?.actionResult?.status, 'fail');
  assert.doesNotMatch(stdout, /projectPath.*missing/i);
});

test('generated validation reports return a typed non-empty finalOutput', () => {
  const runScript = resolve('skills/contentful-personalization/scripts/run');
  const history = [
    {
      step: 'onboard/explore',
      response: {
        framework: 'nextjs-app',
        routerType: 'app',
        projectPath: '.',
        explorationSummary: 'Generated final-output regression fixture',
        personalizableCandidates: [],
        existingSetup: 'partial',
        readinessOnly: false,
      },
      actionResult: {
        packages: { ninetailed: [], optimization: [], contentful: [], framework: [] },
        packageManager: 'pnpm',
      },
    },
  ];
  const expected = {
    profile: 'full-setup',
    finalState: 'implementation-complete-validation-deferred',
    evidence: [],
    rerunStages: [],
    summary: 'Implementation complete; validation deferred',
  };

  const stdout = execFileSync(
    runScript,
    [
      'onboard',
      'advance',
      '--step',
      'onboard/report',
      '--output',
      JSON.stringify(expected),
      '--history',
      JSON.stringify(history),
    ],
    { cwd: process.cwd(), encoding: 'utf-8' },
  );
  const result = JSON.parse(stdout) as { kind: string; finalOutput?: unknown };

  assert.equal(result.kind, 'done');
  assert.deepEqual(result.finalOutput, expected);
});
