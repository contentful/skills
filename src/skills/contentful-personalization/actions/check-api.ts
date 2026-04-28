import { z, action } from '@contentful/skill-kit';
import { ApiCheckResult } from '../schemas.js';

const API_TIMEOUT_MS = 10_000;

export const checkApiConnectivity = action({
  name: 'check-api',
  input: z.object({
    apiKey: z.string().optional(),
    environment: z.string().default('main'),
    shouldCheck: z.boolean(),
  }),
  output: ApiCheckResult,
  run: async ({ input, signal }) => {
    if (!input.shouldCheck || !input.apiKey) {
      return {
        status: 'skip' as const,
        findings: [{ item: 'API Connectivity', status: 'skip' as const, detail: 'No API key available for testing' }],
        reachable: false,
      };
    }

    const url = `https://experience.ninetailed.co/v2/organizations/${input.apiKey}/environments/${input.environment}`;
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      signal.addEventListener('abort', () => controller.abort());

      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });
      clearTimeout(timeout);

      const elapsed = Date.now() - start;

      if (res.ok) {
        return {
          status: 'pass' as const,
          findings: [
            { item: 'API Reachability', status: 'pass' as const, detail: `API reachable (${elapsed}ms)` },
            { item: 'API Key', status: 'pass' as const, detail: 'Key accepted' },
          ],
          reachable: true,
          responseTimeMs: elapsed,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'fail' as const,
          findings: [
            { item: 'Ninetailed API Reachability', status: 'pass' as const, detail: `Experience API reachable (${elapsed}ms)` },
            { item: 'Ninetailed API Key', status: 'fail' as const, detail: `Key rejected (HTTP ${res.status}) — verify the API key in Contentful under Organization settings > Optimization > SDK keys` },
          ],
          reachable: true,
          responseTimeMs: elapsed,
          error: `API key invalid (HTTP ${res.status})`,
        };
      }

      if (res.status === 404) {
        return {
          status: 'fail' as const,
          findings: [
            { item: 'Ninetailed API', status: 'fail' as const, detail: `Experience API returned 404 for environment "${input.environment}" — the environment may not exist, or the API key may be incorrect. Check the key and environment in Contentful under Organization settings > Optimization > SDK keys.` },
          ],
          reachable: true,
          responseTimeMs: elapsed,
          error: `HTTP 404 — environment "${input.environment}" not found`,
        };
      }

      return {
        status: 'fail' as const,
        findings: [
          { item: 'Ninetailed API', status: 'fail' as const, detail: `Experience API (experience.ninetailed.co) returned unexpected HTTP ${res.status}` },
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
          { item: 'API Reachability', status: 'fail' as const, detail: `Network error: ${message}` },
        ],
        reachable: false,
        responseTimeMs: elapsed,
        error: message,
      };
    }
  },
});
