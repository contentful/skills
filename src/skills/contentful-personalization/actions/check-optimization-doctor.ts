import { type, action } from '@contentful/skill-kit';
import { OptimizationDoctorCheckResult, OptimizationDoctorResponse, type Finding } from '../schemas.js';
import { createOptimizationDoctorRequestContext } from '../validation/credentials.js';

const API_TIMEOUT_MS = 10_000;

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
    'managementTokenSource?': 'string',
  }),
  output: OptimizationDoctorCheckResult,
  run: async ({ input, signal }) => {
    const request = createOptimizationDoctorRequestContext(input);

    if (!input.spaceId || !input.environmentId || !input.managementToken) {
      return {
        status: 'skip' as const,
        request,
        findings: [
          {
            item: 'Optimization doctor',
            status: 'skip' as const,
            detail: 'No Contentful Management token (CFPAT) available — cannot call the /optimization-doctor endpoint',
          },
        ],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    signal.addEventListener('abort', () => controller.abort());

    const url = request.endpoint;

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
          request,
          findings: [
            {
              item: 'Optimization doctor',
              status: 'fail' as const,
              detail:
                res.status === 401
                  ? 'The endpoint rejected this request with HTTP 401. This response alone does not prove that the token is expired, incorrectly scoped, or missing space access; compare the masked credential, source, and request target shown with this result.'
                  : 'The endpoint rejected this request with HTTP 403. Compare the masked credential, source, and request target shown with this result before diagnosing an authorization or endpoint issue.',
            },
          ],
          error: `HTTP ${res.status}`,
        };
      }

      if (res.status === 404) {
        return {
          status: 'fail' as const,
          request,
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
          request,
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
          request,
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
        counts.numTrackEvents + counts.numPageEvents + counts.numComponentEvents + counts.numIdentifyEvents;

      // Page events without component events usually means personalizable components aren't wired up.
      if (counts.numPageEvents > 0 && counts.numComponentEvents === 0) {
        findings.push({
          item: 'Page events without component events',
          status: 'warn',
          detail:
            'Pages are being viewed but no component events are firing. Personalizable components may not be wrapped in the SDK or the provider tree is missing.',
        });
      }

      return {
        status: totalEvents > 0 ? ('pass' as const) : ('warn' as const),
        request,
        findings,
        liveEvents: counts,
      };
    } catch (err) {
      clearTimeout(timeout);
      return {
        status: 'fail' as const,
        request,
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
