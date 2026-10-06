import test from 'node:test';
import assert from 'node:assert/strict';
import { finishedApplicationSummary, runtimePresentationInstructions } from './runtime-presentation.js';

test('runtime presentation opens the finished app before user-facing event validation', () => {
  const instructions = runtimePresentationInstructions({
    projectPath: '/tmp/example',
    packageManager: 'pnpm',
    liveEventsUrl: 'https://app.contentful.com/live-events',
    scenario: 'Use the published all-visitors experience.',
    evidenceTarget: 'A correlated page event and rendered variant.',
  });

  assert.match(instructions, /Before presenting any aggregate Live Events result/);
  assert.match(instructions, /already running/);
  assert.match(instructions, /actual\s+local URL and port/);
  assert.match(instructions, /user-visible browser or host preview/);
  assert.match(instructions, /do not claim the page was shown to the\s+user/);
  assert.match(instructions, /Do not stop the server/);
  assert.match(instructions, /https:\/\/app\.contentful\.com\/live-events/);
});

test('finished application summary distinguishes visible and headless presentation', () => {
  const headless = finishedApplicationSummary({
    applicationUrl: 'http://localhost:3000/',
    serverStatus: 'started',
    browserStatus: 'opened-headless',
    liveEventsStatus: 'user-required',
    summary: 'Page rendered.',
    checks: [],
    issues: [],
  });

  assert.match(headless, /Open the running application/);
  assert.match(headless, /left running/);
  assert.match(headless, /inspection was headless/);
  assert.doesNotMatch(headless, /user-visible browser/);
});
