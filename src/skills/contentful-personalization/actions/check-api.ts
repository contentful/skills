import { z, action } from '@contentful/skill-kit';
import { ApiCheckResult } from '../schemas.js';

const API_TIMEOUT_MS = 10_000;

export const checkApiConnectivity = action({
  name: 'check-api',
  input: z.object({
    apiKey: z.string().optional(),
    environment: z.string().default('main'),
    contentfulSpaceId: z.string().optional(),
    shouldCheck: z.boolean(),
  }),
  output: ApiCheckResult,
  run: async ({ input, signal }) => {
    if (!input.shouldCheck || !input.apiKey) {
      return {
        status: 'skip' as const,
        findings: [{ item: 'Ninetailed API', status: 'skip' as const, detail: 'No API key available — skipped connectivity check' }],
        reachable: false,
      };
    }

    if (!input.contentfulSpaceId) {
      return {
        status: 'skip' as const,
        findings: [{ item: 'Ninetailed API', status: 'skip' as const, detail: 'No Contentful Space ID available — skipped connectivity check' }],
        reachable: false,
      };
    }

    const url = `https://experience.ninetailed.co/v3/spaces/${input.contentfulSpaceId}/environments/${input.environment}/profiles`;
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      signal.addEventListener('abort', () => controller.abort());

      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: [{
            type: 'track',
            channel: 'web',
            messageId: 'doctor-connectivity-check',
            event: 'doctor-check',
            properties: {},
            context: {
              library: { name: 'skill-kit-doctor', version: '1.0.0' },
            },
          }],
        }),
      });
      clearTimeout(timeout);

      const elapsed = Date.now() - start;

      if (res.ok) {
        return {
          status: 'pass' as const,
          findings: [
            { item: 'Ninetailed Experience API', status: 'pass' as const, detail: `Reachable, key accepted (${elapsed}ms)` },
          ],
          reachable: true,
          responseTimeMs: elapsed,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'fail' as const,
          findings: [
            { item: 'Ninetailed Experience API', status: 'fail' as const, detail: `API key rejected (HTTP ${res.status}) — verify the key in Contentful under Organization settings > Optimization > SDK keys` },
          ],
          reachable: true,
          responseTimeMs: elapsed,
          error: `API key rejected (HTTP ${res.status})`,
        };
      }

      if (res.status === 404) {
        return {
          status: 'fail' as const,
          findings: [
            { item: 'Ninetailed Experience API', status: 'fail' as const, detail: `Space or environment not found (HTTP 404) — check the Contentful Space ID and environment slug` },
          ],
          reachable: true,
          responseTimeMs: elapsed,
          error: `Space or environment not found`,
        };
      }

      return {
        status: 'fail' as const,
        findings: [
          { item: 'Ninetailed Experience API', status: 'fail' as const, detail: `Unexpected HTTP ${res.status} from experience.ninetailed.co` },
        ],
        reachable: false,
        responseTimeMs: elapsed,
        error: `HTTP ${res.status}`,
      };
    } catch (err) {
      const elapsed = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: 'fail' as const,
        findings: [
          { item: 'Ninetailed Experience API', status: 'fail' as const, detail: `Network error: ${message}` },
        ],
        reachable: false,
        responseTimeMs: elapsed,
        error: message,
      };
    }
  },
});
