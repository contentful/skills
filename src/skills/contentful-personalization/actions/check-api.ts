import { z, action } from '@contentful/skill-kit';
import { ApiCheckResult, type Finding } from '../schemas.js';

const API_TIMEOUT_MS = 10_000;

const PROBE_EVENT = {
  events: [{
    type: 'track' as const,
    channel: 'web' as const,
    messageId: 'doctor-connectivity-check',
    event: 'doctor-check',
    properties: {},
    context: { library: { name: 'skill-kit-doctor', version: '1.0.0' } },
  }],
};

interface Endpoint {
  version: 'v2' | 'v3';
  url: string;
  label: string;
}

function buildEndpoints(input: {
  apiKey?: string;
  ninetailedEnvironment: string;
  contentfulSpaceId?: string;
  contentfulEnvironment: string;
}): Endpoint[] {
  const endpoints: Endpoint[] = [];

  if (input.apiKey) {
    endpoints.push({
      version: 'v2',
      url: `https://experience.ninetailed.co/v2/organizations/${input.apiKey}/environments/${input.ninetailedEnvironment}/profiles`,
      label: `v2 (API key ${input.apiKey.substring(0, 8)}…, env "${input.ninetailedEnvironment}")`,
    });
  }

  if (input.contentfulSpaceId) {
    endpoints.push({
      version: 'v3',
      url: `https://experience.ninetailed.co/v3/spaces/${input.contentfulSpaceId}/environments/${input.contentfulEnvironment}/profiles`,
      label: `v3 (space ${input.contentfulSpaceId}, env "${input.contentfulEnvironment}")`,
    });
  }

  return endpoints;
}

async function probeEndpoint(
  endpoint: Endpoint,
  parentSignal: AbortSignal,
): Promise<{ finding: Finding; reachable: boolean; responseTimeMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  parentSignal.addEventListener('abort', () => controller.abort());
  const start = Date.now();

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PROBE_EVENT),
    });
    clearTimeout(timeout);
    const elapsed = Date.now() - start;

    if (res.ok) {
      return {
        finding: { item: `Experience API ${endpoint.label}`, status: 'pass' as const, detail: `Reachable (${elapsed}ms)` },
        reachable: true,
        responseTimeMs: elapsed,
      };
    }

    if (res.status === 404) {
      const hint = endpoint.version === 'v2'
        ? 'check the API key and environment in Contentful under Organization settings > Optimization > SDK keys'
        : 'check the Contentful Space ID and environment, and verify the Personalization app is installed';
      return {
        finding: { item: `Experience API ${endpoint.label}`, status: 'fail' as const, detail: `Not found (HTTP 404) — ${hint}` },
        reachable: true,
        responseTimeMs: elapsed,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        finding: { item: `Experience API ${endpoint.label}`, status: 'fail' as const, detail: `Rejected (HTTP ${res.status}) — verify credentials in Contentful under Organization settings > Optimization > SDK keys` },
        reachable: true,
        responseTimeMs: elapsed,
      };
    }

    return {
      finding: { item: `Experience API ${endpoint.label}`, status: 'fail' as const, detail: `Unexpected HTTP ${res.status}` },
      reachable: false,
      responseTimeMs: elapsed,
    };
  } catch (err) {
    clearTimeout(timeout);
    const elapsed = Date.now() - start;
    return {
      finding: { item: `Experience API ${endpoint.label}`, status: 'fail' as const, detail: `Network error: ${err instanceof Error ? err.message : String(err)}` },
      reachable: false,
      responseTimeMs: elapsed,
    };
  }
}

export const checkApiConnectivity = action({
  name: 'check-api',
  input: z.object({
    apiKey: z.string().optional(),
    ninetailedEnvironment: z.string().default('main'),
    contentfulSpaceId: z.string().optional(),
    contentfulEnvironment: z.string().default('master'),
  }),
  output: ApiCheckResult,
  run: async ({ input, signal }) => {
    const endpoints = buildEndpoints(input);

    if (endpoints.length === 0) {
      return {
        status: 'skip' as const,
        findings: [{ item: 'Ninetailed API', status: 'skip' as const, detail: 'No credentials available — need either a Ninetailed API key (v2) or Contentful Space ID (v3) to check connectivity' }],
        reachable: false,
      };
    }

    const results = await Promise.all(
      endpoints.map((ep) => probeEndpoint(ep, signal)),
    );

    const findings = results.map((r) => r.finding);
    const anyPass = results.some((r) => r.finding.status === 'pass');
    const anyReachable = results.some((r) => r.reachable);
    const bestTime = Math.min(...results.map((r) => r.responseTimeMs));

    return {
      status: anyPass ? 'pass' as const : 'fail' as const,
      findings,
      reachable: anyReachable,
      responseTimeMs: bestTime,
      ...(anyPass ? {} : { error: findings.map((f) => f.detail).join('; ') }),
    };
  },
});
