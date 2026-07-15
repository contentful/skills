import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectContent } from './inspect-content.js';

function makeEntry(fields: Record<string, unknown>, sysOverrides?: Record<string, unknown>) {
  return {
    sys: {
      id: 'entry1',
      type: 'Entry',
      contentType: {
        sys: { id: 'hero', type: 'Link', linkType: 'ContentType' },
      },
      ...sysOverrides,
    },
    fields,
  };
}

function makeExperience(id: string, variants: unknown[] = []) {
  return {
    sys: {
      id,
      type: 'Entry',
      contentType: {
        sys: { id: 'nt_experience', type: 'Link', linkType: 'ContentType' },
      },
    },
    fields: {
      nt_name: `Experience ${id}`,
      nt_type: 'nt_personalization',
      nt_variants: variants,
    },
  };
}

function makeVariant(id: string) {
  return {
    sys: {
      id,
      type: 'Entry',
      contentType: {
        sys: { id: 'hero', type: 'Link', linkType: 'ContentType' },
      },
    },
    fields: { headline: `Variant ${id}` },
  };
}

function unresolvedLink(id: string) {
  return { sys: { type: 'Link', linkType: 'Entry', id } };
}

const controller = new AbortController();

test('skip when no tokens provided', async () => {
  const result = await inspectContent.run({
    input: {
      spaceId: 'space1',
      environment: 'master',
      entryId: 'entry1',
      includeDepth: 3,
    },
    signal: controller.signal,
  });

  assert.equal(result.status, 'skip');
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].status, 'skip');
});

test('detects entry not found in CDA but present in CPA (unpublished entry)', async () => {
  const entry = makeEntry({ title: 'Test', nt_experiences: [] });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('cdn.contentful.com')) {
      return new Response('Not Found', { status: 404 });
    }
    if (url.includes('preview.contentful.com')) {
      return new Response(JSON.stringify(entry), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not Found', { status: 404 });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
        previewToken: 'cpa-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    const finding = result.findings.find((f) => f.item.includes('publishing'));
    assert.ok(finding);
    assert.equal(finding.status, 'fail');
    assert.ok(finding.detail.includes('draft'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('detects unpublished nt_experiences changes (CPA has experiences, CDA does not)', async () => {
  const cdaEntry = makeEntry({ title: 'Test' });
  const cpaEntry = makeEntry({
    title: 'Test',
    nt_experiences: [makeExperience('exp1', [makeVariant('var1')])],
  });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('cdn.contentful.com')) {
      return new Response(JSON.stringify(cdaEntry), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('preview.contentful.com')) {
      return new Response(JSON.stringify(cpaEntry), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not Found', { status: 404 });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
        previewToken: 'cpa-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    assert.ok(result.entry.comparison?.hasUnpublishedChanges);
    const finding = result.findings.find((f) => f.item.includes('Unpublished'));
    assert.ok(finding);
    assert.ok(finding.detail.includes('republish'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('detects unpublished experience entries (unresolved links)', async () => {
  const entry = makeEntry({
    title: 'Test',
    nt_experiences: [unresolvedLink('exp1'), unresolvedLink('exp2')],
  });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('cdn.contentful.com')) {
      return new Response(JSON.stringify(entry), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not Found', { status: 404 });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    const finding = result.findings.find((f) => f.item.includes('Experience entries'));
    assert.ok(finding);
    assert.equal(finding.status, 'fail');
    assert.ok(finding.detail.includes('not published'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('detects unpublished variant entries', async () => {
  const entry = makeEntry({
    title: 'Test',
    nt_experiences: [makeExperience('exp1', [unresolvedLink('var1'), unresolvedLink('var2')])],
  });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('cdn.contentful.com')) {
      return new Response(JSON.stringify(entry), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not Found', { status: 404 });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    const finding = result.findings.find((f) => f.item.includes('Variant entries'));
    assert.ok(finding);
    assert.equal(finding.status, 'fail');
    assert.ok(finding.detail.includes('not published'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('passes when everything is resolved correctly', async () => {
  const entry = makeEntry({
    title: 'Test',
    nt_experiences: [makeExperience('exp1', [makeVariant('var1')])],
  });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
        previewToken: 'cpa-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'pass');
    assert.ok(!result.entry.comparison?.hasUnpublishedChanges);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('handles invalid CDA token (401)', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response('Unauthorized', { status: 401 });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'bad-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    const finding = result.findings.find((f) => f.item.includes('authentication'));
    assert.ok(finding);
    assert.equal(finding.status, 'fail');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not infer content structure when every API request fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('connection refused');
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
        previewToken: 'cpa-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    assert.equal(result.entry.cda, undefined);
    assert.equal(result.entry.cpa, undefined);
    assert.equal(result.findings.length, 2);
    assert.ok(result.findings.every((finding) => finding.item.includes('connectivity')));
    assert.ok(!result.findings.some((finding) => finding.item.includes('Content type')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('detects content type not extended (no nt_experiences field anywhere)', async () => {
  const entry = makeEntry({
    title: 'Test',
    description: 'No experiences field',
  });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    const finding = result.findings.find((f) => f.item.includes('Content type'));
    assert.ok(finding);
    assert.equal(finding.status, 'fail');
    assert.ok(finding.detail.includes('not been extended'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('warns when nt_experiences exists but is empty', async () => {
  const entry = makeEntry({ title: 'Test', nt_experiences: [] });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await inspectContent.run({
      input: {
        spaceId: 'space1',
        environment: 'master',
        entryId: 'entry1',
        includeDepth: 3,
        accessToken: 'cda-token',
      },
      signal: controller.signal,
    });

    assert.equal(result.status, 'warn');
    const finding = result.findings.find((f) => f.item.includes('Experience attachment'));
    assert.ok(finding);
    assert.equal(finding.status, 'warn');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
