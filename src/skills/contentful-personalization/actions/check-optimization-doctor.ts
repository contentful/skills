import { type, action } from '@contentful/skill-kit';
import {
  OptimizationDoctorCheckResult,
  OptimizationDoctorResponse,
  type Finding,
} from '../schemas.js';

const API_TIMEOUT_MS = 10_000;
const ANALYTICS_API_HOST = 'analytics.ninetailed.co';

function eventFinding(label: string, count: number): Finding {
  return {
    item: `${label} (last 15m)`,
    status: count > 0 ? 'pass' : 'warn',
    detail:
      count > 0
        ? `${count} event${count === 1 ? '' : 's'} observed`
        : 'No events observed — verify tracking is configured and reaching the ingestion endpoint',
  };
}

export const checkOptimizationDoctor = action({
  name: 'check-optimization-doctor',
  input: type({
    spaceId: 'string',
    environmentId: 'string',
    'managementToken?': 'string',
  }),
  output: OptimizationDoctorCheckResult,
  run: async ({ input, signal }) => {
    if (!input.spaceId || !input.environmentId || !input.managementToken) {
      return {
        status: 'skip' as const,
        findings: [
          {
            item: 'Optimization doctor',
            status: 'skip' as const,
            detail:
              'No Contentful Management token (CFPAT) available — cannot call the /optimization-doctor endpoint',
          },
        ],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    signal.addEventListener('abort', () => controller.abort());

    const url = `https://${ANALYTICS_API_HOST}/v1/spaces/${input.spaceId}/environments/${input.environmentId}/optimization-doctor`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${input.managementToken}`,
        },
      });
      clearTimeout(timeout);

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'fail' as const,
          findings: [
            {
              item: 'Optimization doctor',
              status: 'fail' as const,
              detail: `Rejected (HTTP ${res.status}) — verify the CONTENTFUL_MANAGEMENT_TOKEN (CFPAT) has access to space "${input.spaceId}"`,
            },
          ],
          error: `HTTP ${res.status}`,
        };
      }

      if (res.status === 404) {
        return {
          status: 'fail' as const,
          findings: [
            {
              item: 'Optimization doctor',
              status: 'fail' as const,
              detail: `Not found (HTTP 404) — check the space "${input.spaceId}" and environment "${input.environmentId}" are correct and personalization is installed`,
            },
          ],
          error: 'HTTP 404',
        };
      }

      if (!res.ok) {
        return {
          status: 'fail' as const,
          findings: [
            {
              item: 'Optimization doctor',
              status: 'fail' as const,
              detail: `Unexpected HTTP ${res.status}`,
            },
          ],
          error: `HTTP ${res.status}`,
        };
      }

      const parsed = OptimizationDoctorResponse(await res.json());
      if (parsed instanceof type.errors) {
        return {
          status: 'fail' as const,
          findings: [
            {
              item: 'Optimization doctor',
              status: 'fail' as const,
              detail: `Unexpected response shape: ${parsed.summary}`,
            },
          ],
          error: parsed.summary,
        };
      }

      const counts = parsed.data.diagnostics.liveEvents.last15m;
      const findings: Finding[] = [
        eventFinding('Track events', counts.numTrackEvents),
        eventFinding('Page events', counts.numPageEvents),
        eventFinding('Component events', counts.numComponentEvents),
        eventFinding('Identify events', counts.numIdentifyEvents),
      ];

      const totalEvents =
        counts.numTrackEvents +
        counts.numPageEvents +
        counts.numComponentEvents +
        counts.numIdentifyEvents;

      return {
        status: totalEvents > 0 ? ('pass' as const) : ('warn' as const),
        findings,
        liveEvents: counts,
      };
    } catch (err) {
      clearTimeout(timeout);
      return {
        status: 'fail' as const,
        findings: [
          {
            item: 'Optimization doctor',
            status: 'fail' as const,
            detail: `Network error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
