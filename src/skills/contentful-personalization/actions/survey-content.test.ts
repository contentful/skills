import test from 'node:test';
import assert from 'node:assert/strict';
import { surveyContent } from './survey-content.js';

const controller = new AbortController();

function entryList(ids: string[]): Response {
  return new Response(JSON.stringify({ items: ids.map((id) => ({ sys: { id } })) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface FixtureHost {
  // experience IDs returned by a content_type=nt_experience query
  experiences: string[];
  // baseline IDs returned by links_to_entry={expId}, keyed by experience ID
  linksTo?: Record<string, string[]>;
  experienceEntries?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
  audienceEntries?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
  mergeTagEntries?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
}

// Build a fetch stub serving distinct CDA (cdn) and CPA (preview) fixtures based on query params.
function stubFetch(cda: FixtureHost, cpa?: FixtureHost) {
  return async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    const host = cda && url.hostname.includes('cdn') ? cda : url.hostname.includes('preview') ? cpa : undefined;
    if (!host) return new Response('Not Found', { status: 404 });

    const linksTo = url.searchParams.get('links_to_entry');
    if (linksTo) {
      return entryList(host.linksTo?.[linksTo] ?? []);
    }
    if (url.searchParams.get('content_type') === 'nt_experience') {
      return host.experienceEntries
        ? new Response(JSON.stringify({ items: host.experienceEntries }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        : entryList(host.experiences);
    }
    if (url.searchParams.get('content_type') === 'nt_audience') {
      return new Response(JSON.stringify({ items: host.audienceEntries ?? [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.searchParams.get('content_type') === 'nt_mergetag') {
      return new Response(JSON.stringify({ items: host.mergeTagEntries ?? [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not Found', { status: 404 });
  };
}

test('survey: skips cleanly when no tokens are available', async () => {
  const result = await surveyContent.run({
    input: { spaceId: '', environment: 'master' },
    signal: controller.signal,
  });
  assert.equal(result.status, 'skip');
  assert.equal(result.findings[0].status, 'skip');
  assert.equal(result.testScenario.kind, 'unavailable');
});

test('survey: does not infer an empty CMS when all inventory requests fail', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('network unavailable');
  };

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    assert.equal(result.testScenario.kind, 'unavailable');
    assert.match(result.testScenario.summary, /Do not infer/);
    assert.ok(!result.findings.some((finding) => finding.item.includes('Published experiences')));
    assert.ok(!result.findings.some((finding) => finding.item.includes('Unpublished experiences')));
  } finally {
    globalThis.fetch = original;
  }
});

test('survey: flags a published baseline that links only in preview (the real bug)', async () => {
  const original = globalThis.fetch;
  // Experience exp1 is published in both. A baseline "hero1" links to it in preview, but the
  // published baseline does not link to it yet — the classic unpublished-link mismatch.
  globalThis.fetch = stubFetch(
    { experiences: ['exp1'], linksTo: { exp1: [] } },
    { experiences: ['exp1'], linksTo: { exp1: ['hero1'] } },
  );

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    const finding = result.findings.find((f) => f.item.includes('Unpublished baseline link'));
    assert.ok(finding, 'expected an unpublished-baseline-link finding');
    assert.equal(finding.status, 'fail');
    assert.ok(result.suspiciousEntryIds.includes('hero1'), 'baseline should be offered for drill-down');
  } finally {
    globalThis.fetch = original;
  }
});

test('survey: a healthy published+linked experience does NOT flag a baseline issue', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = stubFetch(
    { experiences: ['exp1'], linksTo: { exp1: ['hero1'] } },
    { experiences: ['exp1'], linksTo: { exp1: ['hero1'] } },
  );

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    assert.ok(!result.findings.some((f) => f.item.includes('Unpublished baseline link')));
    assert.ok(!result.findings.some((f) => f.item.includes('Unattached experience')));
    assert.equal(result.status, 'pass');
  } finally {
    globalThis.fetch = original;
  }
});

test('survey: flags a published experience that nothing links to', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = stubFetch(
    { experiences: ['exp1'], linksTo: { exp1: [] } },
    { experiences: ['exp1'], linksTo: { exp1: [] } },
  );

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    const finding = result.findings.find((f) => f.item.includes('Unattached experience'));
    assert.ok(finding, 'expected an unattached-experience finding');
    assert.equal(finding.status, 'warn');
  } finally {
    globalThis.fetch = original;
  }
});

test('survey: caps the reverse-link pass and reports how many were checked', async () => {
  const original = globalThis.fetch;
  // 25 published experiences, all properly linked — exceeds the cap of 20.
  const ids = Array.from({ length: 25 }, (_, i) => `exp${i}`);
  const linksTo = Object.fromEntries(ids.map((id) => [id, [`hero-${id}`]]));
  globalThis.fetch = stubFetch({ experiences: ids, linksTo }, { experiences: ids, linksTo });

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    const capNote = result.findings.find((f) => f.item.includes('partial'));
    assert.ok(capNote, 'expected a partial-check notice');
    assert.ok(capNote.detail.includes('20 of 25'));
  } finally {
    globalThis.fetch = original;
  }
});

test('survey: prefers an existing all-visitors experience as the deterministic scenario', async () => {
  const original = globalThis.fetch;
  const experienceEntries = [
    {
      sys: { id: 'experience-entry' },
      fields: {
        nt_experience_id: 'experience-api-id',
        nt_name: 'Homepage test',
        nt_audience: null,
        nt_variants: [{ sys: { id: 'variant-entry' } }],
      },
    },
  ];
  globalThis.fetch = stubFetch(
    { experiences: ['experience-entry'], experienceEntries, linksTo: { 'experience-entry': ['hero'] } },
    { experiences: ['experience-entry'], experienceEntries, linksTo: { 'experience-entry': ['hero'] } },
  );

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    assert.equal(result.testScenario.kind, 'all-visitors');
    assert.equal(result.testScenario.experienceId, 'experience-api-id');
    assert.deepEqual(result.testScenario.variantEntryIds, ['variant-entry']);
  } finally {
    globalThis.fetch = original;
  }
});

test('survey: inventories targeted audiences but does not invent their server-side rules', async () => {
  const original = globalThis.fetch;
  const experienceEntries = [
    {
      sys: { id: 'experience-entry' },
      fields: {
        nt_experience_id: 'experience-api-id',
        nt_name: 'Known customers',
        nt_audience: { sys: { id: 'audience-entry' } },
        nt_variants: [{ sys: { id: 'variant-entry' } }],
      },
    },
  ];
  const audienceEntries = [
    {
      sys: { id: 'audience-entry' },
      fields: { nt_audience_id: 'audience-api-id', nt_name: 'Customers' },
    },
  ];
  globalThis.fetch = stubFetch(
    {
      experiences: ['experience-entry'],
      experienceEntries,
      audienceEntries,
      linksTo: { 'experience-entry': ['hero'] },
    },
    {
      experiences: ['experience-entry'],
      experienceEntries,
      audienceEntries,
      linksTo: { 'experience-entry': ['hero'] },
    },
  );

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    assert.equal(result.publishedAudienceCount, 1);
    assert.equal(result.testScenario.kind, 'existing-targeted');
    assert.equal(result.testScenario.audienceId, 'audience-api-id');
    assert.match(result.testScenario.summary, /server-side audience rules cannot be derived/);
  } finally {
    globalThis.fetch = original;
  }
});

test('survey: inventories merge tags independently from experiences', async () => {
  const original = globalThis.fetch;
  const mergeTagEntries = [{ sys: { id: 'merge-tag-entry' }, fields: { nt_mergetag_id: 'profile.location.city' } }];
  globalThis.fetch = stubFetch({ experiences: [], mergeTagEntries }, { experiences: [], mergeTagEntries });

  try {
    const result = await surveyContent.run({
      input: { spaceId: 'space1', environment: 'master', accessToken: 'cda', previewToken: 'cpa' },
      signal: controller.signal,
    });

    assert.equal(result.publishedExperienceCount, 0);
    assert.equal(result.publishedMergeTagCount, 1);
    assert.deepEqual(result.publishedMergeTagIdentifiers, ['merge-tag-entry', 'profile.location.city']);
  } finally {
    globalThis.fetch = original;
  }
});
