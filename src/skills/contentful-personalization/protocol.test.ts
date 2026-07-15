import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

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
