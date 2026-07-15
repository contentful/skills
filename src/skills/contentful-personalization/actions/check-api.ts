import { type, action } from '@contentful/skill-kit';
import { randomUUID } from 'node:crypto';
import { ApiCheckResult, type Finding } from '../schemas.js';

const API_TIMEOUT_MS = 10_000;

function buildProbeEvent() {
  return {
    events: [
      {
        type: 'track' as const,
        channel: 'web' as const,
        messageId: `skill-connectivity-check-${randomUUID()}`,
        event: 'skill-credential-connectivity-check',
        properties: { diagnostic: true },
        context: { library: { name: 'contentful-personalization-skill', version: '1.0.0' } },
      },
    ],
  };
}

interface Endpoint {
  sdk: 'legacy' | 'modern';
  url: string;
  label: string;
}

// The Experience API is keyed by an organization/client identifier — never by the
// Contentful space ID. Both SDK families hit v2/organizations/{id}/.../profiles:
// the legacy SDK passes its API key as {id}; the modern @contentful/optimization SDK
// passes its Client ID. We probe whichever identifiers we have.
function buildEndpoints(input: {
  apiKey?: string;
  ninetailedEnvironment: string;
  optimizationClientId?: string;
  optimizationEnvironment: string;
}): Endpoint[] {
  const endpoints: Endpoint[] = [];

  if (input.apiKey) {
    endpoints.push({
      sdk: 'legacy',
      url: `https://experience.ninetailed.co/v2/organizations/${input.apiKey}/environments/${input.ninetailedEnvironment}/profiles`,
      label: `legacy SDK (API key ${input.apiKey.substring(0, 8)}…, env "${input.ninetailedEnvironment}")`,
    });
  }

  if (input.optimizationClientId) {
    endpoints.push({
      sdk: 'modern',
      url: `https://experience.ninetailed.co/v2/organizations/${input.optimizationClientId}/environments/${input.optimizationEnvironment}/profiles`,
      label: `Optimization SDK (client ID ${input.optimizationClientId.substring(0, 8)}…, env "${input.optimizationEnvironment}")`,
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
      body: JSON.stringify(buildProbeEvent()),
    });
    clearTimeout(timeout);
    const elapsed = Date.now() - start;

    if (res.ok) {
      return {
        finding: {
          item: `Experience API ${endpoint.label}`,
          status: 'pass' as const,
          detail: `Credential and destination accepted a synthetic diagnostic event (${elapsed}ms). This does not prove that the application runtime sends events.`,
        },
        reachable: true,
        responseTimeMs: elapsed,
      };
    }

    if (res.status === 404) {
      const hint =
        'check the Client ID and environment in Contentful under Organization settings > Optimization > Data sources and metrics > SDK keys';
      return {
        finding: {
          item: `Experience API ${endpoint.label}`,
          status: 'fail' as const,
          detail: `Not found (HTTP 404) — ${hint}`,
        },
        reachable: true,
        responseTimeMs: elapsed,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        finding: {
          item: `Experience API ${endpoint.label}`,
          status: 'fail' as const,
          detail: `Rejected (HTTP ${res.status}) — verify credentials in Contentful under Organization settings > Optimization > SDK keys`,
        },
        reachable: true,
        responseTimeMs: elapsed,
      };
    }

    return {
      finding: {
        item: `Experience API ${endpoint.label}`,
        status: 'fail' as const,
        detail: `Unexpected HTTP ${res.status}`,
      },
      reachable: false,
      responseTimeMs: elapsed,
    };
  } catch (err) {
    clearTimeout(timeout);
    const elapsed = Date.now() - start;
    return {
      finding: {
        item: `Experience API ${endpoint.label}`,
        status: 'fail' as const,
        detail: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      },
      reachable: false,
      responseTimeMs: elapsed,
    };
  }
}

export const checkApiConnectivity = action({
  name: 'check-api',
  input: type({
    'apiKey?': 'string',
    ninetailedEnvironment: "string = 'main'",
    'optimizationClientId?': 'string',
    optimizationEnvironment: "string = 'main'",
  }),
  output: ApiCheckResult,
  run: async ({ input, signal }) => {
    const endpoints = buildEndpoints(input);

    if (endpoints.length === 0) {
      return {
        status: 'skip' as const,
        findings: [
          {
            item: 'Experience API',
            status: 'skip' as const,
            detail:
              'No personalization credentials available — need a legacy Ninetailed API key or an Optimization Client ID to check connectivity',
          },
        ],
        reachable: false,
      };
    }

    const results = await Promise.all(endpoints.map((ep) => probeEndpoint(ep, signal)));

    const findings = results.map((r) => r.finding);
    const anyPass = results.some((r) => r.finding.status === 'pass');
    const anyReachable = results.some((r) => r.reachable);
    const bestTime = Math.min(...results.map((r) => r.responseTimeMs));

    return {
      status: anyPass ? ('pass' as const) : ('fail' as const),
      findings,
      reachable: anyReachable,
      responseTimeMs: bestTime,
      ...(anyPass ? {} : { error: findings.map((f) => f.detail).join('; ') }),
    };
  },
});
