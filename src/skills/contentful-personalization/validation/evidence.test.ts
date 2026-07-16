import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateLiveEventsEvidence,
  buildLiveEventsUrl,
  cmsGraphEvidence,
  liveEventsDeltaRows,
  manualRuntimeEvidence,
} from './evidence.js';

const contentSurvey = {
  status: 'pass' as const,
  findings: [],
  publishedExperienceCount: 0,
  previewExperienceCount: 0,
  publishedAudienceCount: 0,
  previewAudienceCount: 0,
  publishedMergeTagCount: 2,
  previewMergeTagCount: 2,
  publishedMergeTagIdentifiers: ['entry-a', 'profile.city'],
  previewMergeTagIdentifiers: ['entry-a', 'profile.city'],
  testScenario: {
    kind: 'fixture-needed' as const,
    summary: 'No experience',
    variantEntryIds: [],
  },
  suspiciousEntryIds: [],
};

test('aggregate Live Events counts never prove correlated runtime transport', () => {
  const evidence = aggregateLiveEventsEvidence({
    status: 'pass',
    findings: [],
    request: {
      endpoint: 'https://analytics.ninetailed.co/v1/spaces/space1/environments/master/optimization-doctor',
      spaceId: 'space1',
      environmentId: 'master',
      managementToken: {
        status: 'used',
        variable: 'CONTENTFUL_MANAGEMENT_TOKEN',
        maskedValue: 'cfpat_xx****',
        source: '/project/.env.local',
      },
    },
    liveEvents: {
      numTrackEvents: 1,
      numComponentEvents: 1,
      numIdentifyEvents: 1,
      numPageEvents: 1,
    },
  });

  assert.equal(evidence.status, 'warn');
  assert.equal(evidence.source, 'analytics-api');
  assert.match(evidence.summary, /not correlated/);
});

test('manual transport confirmation does not fabricate a personalization outcome', () => {
  const evidence = manualRuntimeEvidence('transport-only');
  assert.equal(evidence[0].status, 'pass');
  assert.equal(evidence[1].status, 'unavailable');
});

test('manual evidence only contains stages applicable to the task profile', () => {
  const analytics = manualRuntimeEvidence('end-to-end', 'analytics-extension');
  assert.deepEqual(
    analytics.map((item) => item.stage),
    ['runtime-transport'],
  );
  assert.match(analytics[0].summary, /event.*destination/);

  const mergeTag = manualRuntimeEvidence('end-to-end', 'merge-tag-code-extension');
  assert.deepEqual(
    mergeTag.map((item) => item.stage),
    ['personalization-outcome'],
  );
  assert.match(mergeTag[0].summary, /target profile.*fallback/);
});

test('blocked evidence remains distinct from a voluntary deferral', () => {
  const blocked = manualRuntimeEvidence('blocked');
  assert.ok(blocked.every((item) => item.status === 'blocked'));
  assert.ok(blocked.every((item) => item.summary.includes('blocked')));
});

test('CMS merge-tag evidence validates the requested tag rather than any tag', () => {
  assert.equal(cmsGraphEvidence(contentSurvey, 'merge-tag-extension', 'profile.city').status, 'pass');
  const wrongTag = cmsGraphEvidence(contentSurvey, 'merge-tag-extension', 'profile.country');
  assert.equal(wrongTag.status, 'fail');
  assert.match(wrongTag.summary, /profile\.country/);
  assert.equal(cmsGraphEvidence(contentSurvey, 'merge-tag-extension').status, 'warn');
});

test('buildLiveEventsUrl encodes the verified space and environment', () => {
  assert.equal(
    buildLiveEventsUrl('space id', 'feature/env'),
    'https://app.contentful.com/spaces/space%20id/environments/feature%2Fenv/apps/app_installations/contentful-personalization/analytics/realtime',
  );
  assert.equal(buildLiveEventsUrl(undefined, 'master'), undefined);
});

test('Live Events comparisons use a reusable per-event delta shape', () => {
  const rows = liveEventsDeltaRows(
    { numPageEvents: 1, numComponentEvents: 2, numTrackEvents: 3, numIdentifyEvents: 4 },
    { numPageEvents: 3, numComponentEvents: 2, numTrackEvents: 8, numIdentifyEvents: 5 },
  );
  assert.deepEqual(
    rows.map((row) => [row.Event, row.Delta]),
    [
      ['Page', '2'],
      ['Component', '0'],
      ['Track', '5'],
      ['Identify', '1'],
    ],
  );
});

test('Live Events comparisons do not turn failed or missing snapshots into observed zeroes', () => {
  const missing = liveEventsDeltaRows(undefined, undefined);
  assert.ok(missing.every((row) => row.Baseline === 'unavailable'));
  assert.ok(missing.every((row) => row.Current === 'unavailable'));
  assert.ok(missing.every((row) => row.Delta === 'unavailable'));

  const currentOnly = liveEventsDeltaRows(undefined, {
    numPageEvents: 2,
    numComponentEvents: 0,
    numTrackEvents: 1,
    numIdentifyEvents: 0,
  });
  assert.equal(currentOnly[0].Current, '2');
  assert.equal(currentOnly[0].Delta, 'unavailable');
});
