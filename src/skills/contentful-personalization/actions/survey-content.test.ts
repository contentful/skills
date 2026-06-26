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
      return entryList(host.experiences);
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
