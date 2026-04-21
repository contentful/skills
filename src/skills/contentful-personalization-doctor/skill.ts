import { skill, z, prompt, render } from '@contentful/skill-kit';
import { scanProject } from './actions/scan-project.js';
import { checkApiConnectivity } from './actions/check-api.js';
import {
  CheckStatus,
  Recommendation,
  ScanResult,
  ApiCheckResult,
  type CheckResult,
} from './schemas.js';

export default skill({
  name: 'contentful-personalization-doctor',
  version: '1.0.0',
  description:
    'Diagnose Contentful optimization and personalization issues. ' +
    'Validates environment variables, SDK packages, provider configuration, middleware, ' +
    'component wiring, API connectivity, and analytics setup.',
  triggers: [
    'debug personalization',
    'personalization not working',
    'check my setup',
    'ninetailed doctor',
    'analytics not tracking',
    'diagnose optimization',
  ],
  entry: 'diagnose',

  stash: z.object({
    framework: z.string(),
    projectPath: z.string(),
    scan: ScanResult.optional(),
    api: ApiCheckResult.optional(),
  }),

  finalOutput: z.object({
    report: z.string(),
  }),
})
  // --- Step 1: Identify the project ---
  .step('diagnose', {
    prompt: prompt`
      Inspect the current project to identify the framework and layout.

      Check for:
      - package.json for Next.js, Gatsby, Remix, or other frameworks
      - next.config.js/ts for Next.js confirmation
      - app/ directory (Next.js App Router)
      - pages/ directory (Next.js Pages Router)
      - gatsby-config.js for Gatsby

      Determine the project root path (usually the current working directory).

      Return the framework type, its version if detectable, and the project path.
    `,
    output: z.object({
      framework: z.enum(['nextjs-app', 'nextjs-pages', 'nextjs-hybrid', 'gatsby', 'remix', 'other']),
      frameworkVersion: z.string().optional(),
      projectPath: z.string(),
    }),
    stash: ({ output }) => ({
      framework: output.framework,
      projectPath: output.projectPath,
    }),
    next: 'scan',
  })

  // --- Step 2: Deterministic scan ---
  .step('scan', {
    prompt: ({ stash }) => prompt`
      Confirm the project path and framework for the automated scan.

      The project appears to be at: ${stash.projectPath}
      Framework detected: ${stash.framework}

      Return the project path and framework so the automated scanner can check
      environment variables, installed packages, provider configuration,
      middleware, component wiring, and analytics setup.
    `,
    output: z.object({
      projectPath: z.string(),
      framework: z.string(),
    }),
    action: scanProject,
    afterAction: ({ action }) => ({ scan: action }),
    next: ({ action }) => {
      const scan = action as z.infer<typeof ScanResult>;
      if (!scan) return 'check-api';
      const hasGaps =
        scan.provider.status === 'not_found' ||
        scan.middleware.status === 'not_found' ||
        scan.components.status === 'not_found' ||
        scan.analytics.status === 'not_found';
      return hasGaps ? 'deep-search' : 'check-api';
    },
  })

  // --- Step 3: Agentic deep search (conditional) ---
  .step('deep-search', {
    prompt: ({ stash, refs }) => {
      const scan = stash.scan;
      if (!scan) return 'The scan produced no results. Search for all categories.';

      const gaps: string[] = [];
      const refSections: string[] = [];

      if (scan.provider.status === 'not_found') {
        gaps.push('provider configuration');
        refSections.push('## Provider patterns to look for:\n' + refs.load('provider-patterns.md'));
      }
      if (scan.middleware.status === 'not_found') {
        gaps.push('middleware setup');
        refSections.push('## Middleware patterns to look for:\n' + refs.load('middleware-patterns.md'));
      }
      if (scan.components.status === 'not_found') {
        gaps.push('experience components');
        refSections.push('## Component patterns to look for:\n' + refs.load('component-patterns.md'));
      }
      if (scan.analytics.status === 'not_found') {
        gaps.push('analytics configuration');
        refSections.push('## Analytics patterns to look for:\n' + refs.load('analytics-patterns.md'));
      }

      return prompt`
        The automated scan could not find: ${gaps.join(', ')}.

        Search the codebase manually for these patterns. Look for:
        - Custom wrappers or aliased imports
        - Alternative naming conventions
        - Components that serve the same purpose but are named differently
        - Configuration spread across multiple files

        For each category you search, report what you found (or confirm it's genuinely missing).

        ${refSections.join('\n\n')}
      `;
    },
    output: z.object({
      provider: z.object({ found: z.boolean(), location: z.string().optional(), detail: z.string() }).optional(),
      middleware: z.object({ found: z.boolean(), path: z.string().optional(), detail: z.string() }).optional(),
      components: z
        .object({ found: z.boolean(), files: z.array(z.string()).optional(), detail: z.string() })
        .optional(),
      analytics: z.object({ found: z.boolean(), detail: z.string() }).optional(),
    }),
    next: 'check-api',
  })

  // --- Step 4: API connectivity check ---
  .step('check-api', {
    prompt: ({ stash }) => {
      const apiKey = stash.scan?.env.apiKey;
      if (apiKey) {
        return prompt`
          The scan found an API key: ${apiKey.slice(0, 8)}****

          Return the API key, environment, and shouldCheck=true to test connectivity.
        `;
      }
      return 'No API key was found in the environment scan. Set shouldCheck to false.';
    },
    output: z.object({
      apiKey: z.string().optional(),
      environment: z.string().default('main'),
      shouldCheck: z.boolean(),
    }),
    action: checkApiConnectivity,
    afterAction: ({ action }) => ({ api: action }),
    next: 'review',
  })

  // --- Step 5: Interpret results and generate recommendations ---
  .step('review', {
    prompt: ({ stash, getStep, refs }) => {
      const deepSearch = getStep('deep-search');

      return prompt`
        Review all diagnostic results and generate prioritized recommendations.

        ## Scan Results
        ${JSON.stringify(stash.scan, null, 2)}

        ## API Connectivity
        ${JSON.stringify(stash.api, null, 2)}

        ## Deep Search Results
        ${deepSearch ? JSON.stringify(deepSearch.output, null, 2) : 'Not performed (no gaps found)'}

        ## Reference: Environment Variables
        ${refs.load('env-var-spec.md')}

        ## Reference: Package Versions
        ${refs.load('package-versions.md')}

        For each issue found, generate a recommendation with:
        - priority: "critical" for missing core requirements, "warning" for suboptimal config, "info" for suggestions
        - message: specific, actionable advice
        - check: which diagnostic category it belongs to

        Determine the overall status:
        - "pass" if all checks pass
        - "warn" if there are warnings but nothing critical
        - "fail" if any critical issues exist
      `;
    },
    output: z.object({
      overallStatus: CheckStatus,
      recommendations: z.array(Recommendation),
      summary: z.string(),
    }),
    next: 'report',
  })

  // --- Step 6: Render final report ---
  .step('report', {
    prompt: ({ rendered }) => prompt`
      Output the following Optimization Doctor Report to the user exactly as shown,
      with no preamble or trailing commentary:

      ${rendered ?? ''}
    `,
    output: z.object({
      report: z.string(),
    }),
    render: ({ stash, getStep }) => {
      const scan = stash.scan;
      const api = stash.api;
      const reviewStep = getStep<{ overallStatus: string; recommendations: Array<{ priority: string; message: string; check: string }>; summary: string }>('review');
      const deepSearch = getStep<Record<string, { found: boolean; detail: string }>>('deep-search');

      const icon = (status: string) => {
        switch (status) {
          case 'pass': return '\u2705';
          case 'warn': return '\u26A0\uFE0F';
          case 'fail': return '\u274C';
          case 'skip': return '\u23ED\uFE0F';
          default: return '\u2753';
        }
      };

      const renderFindings = (findings: Array<{ item: string; status: string; detail: string }>) =>
        findings.map((f) => `- ${f.item}: ${f.detail}`).join('\n');

      const mergeDeepSearch = (
        category: string,
        scanResult: CheckResult,
      ): { status: string; findings: Array<{ item: string; status: string; detail: string }> } => {
        if (!deepSearch?.output?.[category]?.found) return scanResult;
        return {
          ...scanResult,
          status: 'pass',
          findings: [
            ...scanResult.findings,
            { item: `${category} (deep search)`, status: 'pass' as const, detail: deepSearch.output[category].detail },
          ],
        };
      };

      const sections: string[] = [];

      if (scan) {
        sections.push(render.section(`Environment Configuration ${icon(scan.env.status)}`, renderFindings(scan.env.findings)));
        sections.push(render.section(`Package Installation ${icon(scan.packages.status)}`, renderFindings(scan.packages.findings)));

        const provider = mergeDeepSearch('provider', scan.provider);
        sections.push(render.section(`Provider Configuration ${icon(provider.status)}`, renderFindings(provider.findings)));

        const middleware = mergeDeepSearch('middleware', scan.middleware);
        sections.push(render.section(`Middleware ${icon(middleware.status)}`, renderFindings(middleware.findings)));

        const components = mergeDeepSearch('components', scan.components);
        sections.push(render.section(`Component Wiring ${icon(components.status)}`, renderFindings(components.findings)));

        const analytics = mergeDeepSearch('analytics', scan.analytics);
        sections.push(render.section(`Analytics ${icon(analytics.status)}`, renderFindings(analytics.findings)));
      }

      if (api) {
        sections.push(render.section(`API Connectivity ${icon(api.status)}`, renderFindings(api.findings)));
      }

      if (reviewStep?.output?.recommendations?.length) {
        const recs = reviewStep.output.recommendations
          .sort((a, b) => {
            const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
            return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
          })
          .map((r, i) => `${i + 1}. ${r.message}`)
          .join('\n');
        sections.push(render.section('Recommendations', recs));
      }

      return `## Optimization Doctor Report\n\n${sections.join('\n\n')}`;
    },
    next: { terminal: true },
  })

  .build();
