import test from 'node:test';
import assert from 'node:assert/strict';
import { checkOptimizationDoctor } from './check-optimization-doctor.js';

const controller = new AbortController();

const OK_BODY = {
  data: {
    diagnostics: {
      liveEvents: {
        last15m: {
          numTrackEvents: 2,
          numComponentEvents: 401,
          numIdentifyEvents: 0,
          numPageEvents: 55,
        },
      },
    },
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('optimization-doctor: skips when no CFPAT is available', async () => {
  const result = await checkOptimizationDoctor.run({
    input: { spaceId: 'space1', environmentId: 'master' },
    signal: controller.signal,
  });
  assert.equal(result.status, 'skip');
  assert.equal(result.findings[0].status, 'skip');
});

test('optimization-doctor: parses event counts and passes when total > 0', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => jsonResponse(OK_BODY);

  try {
    const result = await checkOptimizationDoctor.run({
      input: { spaceId: 'space1', environmentId: 'master', managementToken: 'cfpat_xxx' },
      signal: controller.signal,
    });

    assert.equal(result.status, 'pass');
    assert.deepEqual(result.liveEvents, {
      numTrackEvents: 2,
      numComponentEvents: 401,
      numIdentifyEvents: 0,
      numPageEvents: 55,
    });
    // Identify events at 0 should surface as a `warn` row without failing the overall status.
    const identifyFinding = result.findings.find((f) => f.item.includes('Identify events'));
    assert.ok(identifyFinding, 'expected an Identify events finding');
    assert.equal(identifyFinding.status, 'warn');
  } finally {
    globalThis.fetch = original;
  }
});

test('optimization-doctor: stays actionable when the endpoint is healthy but no events are visible yet', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    jsonResponse({
      data: {
        diagnostics: {
          liveEvents: {
            last15m: {
              numTrackEvents: 0,
              numComponentEvents: 0,
              numIdentifyEvents: 0,
              numPageEvents: 0,
            },
          },
        },
      },
    });

  try {
    const result = await checkOptimizationDoctor.run({
      input: { spaceId: 'space1', environmentId: 'master', managementToken: 'cfpat_xxx' },
      signal: controller.signal,
    });

    assert.equal(result.status, 'warn');
    assert.equal(result.findings.length, 4);
    assert.ok(result.findings.every((finding) => finding.status === 'warn'));
  } finally {
    globalThis.fetch = original;
  }
});

test('optimization-doctor: reports fail on 401 without leaking the token', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('unauthorized', { status: 401 });

  try {
    const result = await checkOptimizationDoctor.run({
      input: { spaceId: 'space1', environmentId: 'master', managementToken: 'cfpat_secret' },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    const finding = result.findings[0];
    assert.equal(finding.status, 'fail');
    assert.ok(finding.detail.includes('401'), 'detail should mention the HTTP status');
    assert.ok(!finding.detail.includes('cfpat_secret'), 'detail must not leak the token');
    assert.ok(!(result.error ?? '').includes('cfpat_secret'), 'error must not leak the token');
  } finally {
    globalThis.fetch = original;
  }
});

test('optimization-doctor: warns when page events > 0 but component events = 0', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    jsonResponse({
      data: {
        diagnostics: {
          liveEvents: {
            last15m: {
              numTrackEvents: 0,
              numComponentEvents: 0,
              numIdentifyEvents: 0,
              numPageEvents: 55,
            },
          },
        },
      },
    });

  try {
    const result = await checkOptimizationDoctor.run({
      input: { spaceId: 'space1', environmentId: 'master', managementToken: 'cfpat_xxx' },
      signal: controller.signal,
    });

    const finding = result.findings.find((f) => f.item.includes('Page events without component events'));
    assert.ok(finding, 'expected a page-without-components finding');
    assert.equal(finding.status, 'warn');
  } finally {
    globalThis.fetch = original;
  }
});

test('optimization-doctor: fails when response body has an unexpected shape', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => jsonResponse({ data: { diagnostics: { liveEvents: { last15m: { foo: 'bar' } } } } });

  try {
    const result = await checkOptimizationDoctor.run({
      input: { spaceId: 'space1', environmentId: 'master', managementToken: 'cfpat_xxx' },
      signal: controller.signal,
    });

    assert.equal(result.status, 'fail');
    assert.ok(result.findings[0].detail.includes('Unexpected response shape'));
  } finally {
    globalThis.fetch = original;
  }
});
