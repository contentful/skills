import { skill, z, prompt, render, act } from '@contentful/skill-kit';
import { checkPackagesAndEnv } from '../actions/check-packages-env.js';
import { checkApiConnectivity } from '../actions/check-api.js';
import { validateSetup } from '../actions/validate-setup.js';
import {
  PackagesAndEnvResult,
  ApiCheckResult,
  Recommendation,
} from '../schemas.js';
import { VERSION } from '../version.js';

export default skill({
  name: 'doctor',
  version: VERSION,
  description:
    'Diagnose and fix Contentful personalization issues. ' +
    'Explores the codebase, checks packages and env vars, tests API connectivity, ' +
    'and helps fix problems.',
  entry: 'explore',

  stash: z.object({
    framework: z.string(),
    projectPath: z.string(),
    packageData: PackagesAndEnvResult.optional(),
    apiData: ApiCheckResult.optional(),
    recommendations: z.array(Recommendation).optional(),
    overallStatus: z.enum(['pass', 'warn', 'fail']).optional(),
  }),
})
  .step('explore', {
    prompt: ({ refs }) => prompt`
      Explore this project to understand the current personalization setup.
      Read the reference below to know what a correct setup looks like, then
      investigate the codebase.

      ${refs.load('how-personalization-works.md')}

      Check these areas by reading the actual code:

      1. **Framework & router**: Read package.json and project structure.
         What framework, version, and router type?

      2. **Provider configuration**: Search for NinetailedProvider,
         OptimizationProvider, or similar. Where is it? How is it configured?
         What plugins are registered?

      3. **Middleware / SSR**: Look for middleware.ts/js, edge functions,
         or server-side personalization code. How is it structured?

      4. **Component wiring**: Search for Experience, Personalize,
         ExperienceMapper, BlockRenderer, ContentTypeMap, or similar patterns.
         How are components mapped and wrapped?

      5. **Analytics**: Look for Insights plugin, track/page/identify calls,
         GTM or Segment integrations.

      6. **Rendering pipeline**: How is Contentful content fetched?
         What include depth? Page-level or component-level?

      For each area, describe what you found. Be specific about file paths
      and patterns. If something looks wrong or missing, say so.
    `,
    output: z.object({
      framework: z.enum(['nextjs-app', 'nextjs-pages', 'nextjs-hybrid', 'gatsby', 'remix', 'other']),
      frameworkVersion: z.string().optional(),
      projectPath: z.string(),
      explorationSummary: z.string(),
      concerns: z.array(z.string()),
    }),
    stash: ({ output }) => ({
      framework: output.framework,
      projectPath: output.projectPath,
    }),
    next: 'check-facts',
  })

  .step('check-facts', {
    prompt: ({ stash }) => prompt`
      Confirm the project path for the automated package and env var check.
      Project path: ${stash.projectPath}
    `,
    output: z.object({ projectPath: z.string() }),
    action: checkPackagesAndEnv,
    afterAction: ({ action }) => ({ packageData: action }),
    next: 'check-api',
  })

  .step('check-api', {
    prompt: ({ stash }) => {
      const apiKey = stash.packageData?.apiKey;
      if (apiKey) {
        return prompt`
          An API key was found: ${apiKey.slice(0, 8)}****
          Environment: ${stash.packageData?.environment ?? 'main'}
          Return the key, environment, and shouldCheck=true.
        `;
      }
      return 'No API key was found in env files. Set shouldCheck to false.';
    },
    output: z.object({
      apiKey: z.string().optional(),
      environment: z.string().default('main'),
      shouldCheck: z.boolean(),
    }),
    action: checkApiConnectivity,
    afterAction: ({ action }) => ({ apiData: action }),
    next: 'review',
  })

  .step('review', {
    prompt: ({ stash, getStep, refs }) => {
      const explore = getStep('explore');

      return prompt`
        Synthesize all diagnostic findings and produce prioritized recommendations.

        ## Agent Exploration Findings
        ${explore?.output ? JSON.stringify(explore.output, null, 2) : 'No exploration data'}

        ## Package & Env Var Check (deterministic)
        ${JSON.stringify(stash.packageData, null, 2)}

        ## API Connectivity Check (deterministic)
        ${JSON.stringify(stash.apiData, null, 2)}

        ## Reference: Environment Variables
        ${refs.load('env-var-spec.md')}

        ## Reference: Package Versions
        ${refs.load('package-versions.md')}

        ## Reference: Common Errors
        ${refs.load('common-errors.md')}

        For each issue found, create a recommendation with:
        - priority: "critical" for broken core requirements, "warning" for suboptimal config, "info" for suggestions
        - message: specific, actionable advice
        - category: which area it belongs to (packages, env, provider, middleware, components, analytics, api)

        Determine the overall status:
        - "pass" if everything looks good
        - "warn" if there are warnings but nothing blocking
        - "fail" if any critical issues exist

        Be conversational in your reasoning — explain WHY things are wrong, not just WHAT.
      `;
    },
    output: z.object({
      overallStatus: z.enum(['pass', 'warn', 'fail']),
      recommendations: z.array(Recommendation),
      summary: z.string(),
    }),
    stash: ({ output }) => ({
      overallStatus: output.overallStatus,
      recommendations: output.recommendations,
    }),
    next: 'report',
  })

  .step('report', {
    prompt: ({ rendered }) => prompt`
      Present the following Optimization Doctor Report to the user.
      Then ask if they'd like help fixing the issues found.

      ${rendered ?? ''}
    `,
    output: z.object({ report: z.string() }),
    render: ({ stash, getStep }) => {
      const explore = getStep<{ explorationSummary: string; concerns: string[] }>('explore');
      const review = getStep<{
        overallStatus: string;
        recommendations: Array<{ priority: string; message: string; category: string }>;
        summary: string;
      }>('review');

      const icon = (status: string) => {
        switch (status) {
          case 'pass': return '✅';
          case 'warn': return '⚠️';
          case 'fail': return '❌';
          case 'skip': return '⏭️';
          default: return '❓';
        }
      };

      const sections: string[] = [];

      sections.push(render.section(
        `Overall: ${icon(review?.output?.overallStatus ?? 'fail')} ${(review?.output?.overallStatus ?? 'unknown').toUpperCase()}`,
        review?.output?.summary ?? 'No summary available',
      ));

      if (explore?.output?.explorationSummary) {
        sections.push(render.section('Exploration Summary', explore.output.explorationSummary));
      }

      // Package & env summary
      const pkg = stash.packageData;
      if (pkg) {
        const pkgLines: string[] = [];
        const allPkgs = [...pkg.packages.ninetailed, ...pkg.packages.optimization];
        if (allPkgs.length > 0) {
          pkgLines.push(`SDK packages: ${allPkgs.map((p) => `${p.name}@${p.version}`).join(', ')}`);
        } else {
          pkgLines.push('No personalization SDK packages found');
        }
        for (const ev of pkg.envVars) {
          pkgLines.push(`${ev.name}: ${ev.status}${ev.maskedValue ? ` (${ev.maskedValue})` : ''}`);
        }
        sections.push(render.section('Packages & Environment', pkgLines.join('\n')));
      }

      // API check summary
      const api = stash.apiData;
      if (api) {
        const apiLines = api.findings.map((f) => `${icon(f.status)} ${f.item}: ${f.detail}`);
        sections.push(render.section('API Connectivity', apiLines.join('\n')));
      }

      // Recommendations
      if (review?.output?.recommendations?.length) {
        const recs = review.output.recommendations
          .sort((a, b) => {
            const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
            return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
          })
          .map((r, i) => `${i + 1}. **[${r.priority}]** ${r.message}`)
          .join('\n');
        sections.push(render.section('Recommendations', recs));
      }

      return `## Optimization Doctor Report\n\n${sections.join('\n\n')}`;
    },
    next: 'ask-fix',
  })

  .step('ask-fix', {
    act: act.askUser({
      type: 'structured',
      question: 'Would you like help fixing these issues?',
      options: [
        { value: 'yes', label: 'Yes, help me fix them' },
        { value: 'no', label: 'No, the report is enough' },
      ],
    }),
    output: z.object({ choice: z.enum(['yes', 'no']) }),
    next: ({ output }) => (output.choice === 'yes' ? 'plan-fix' : 'report-only'),
  })

  .step('report-only', {
    prompt: 'The user declined fixes. Acknowledge and wish them well.',
    output: z.object({ message: z.string() }),
    next: { terminal: true },
  })

  .step('plan-fix', {
    prompt: ({ stash, refs }) => {
      const recLines = (stash.recommendations ?? [])
        .map((r) => `- [${r.priority}] ${r.message} (${r.category})`)
        .join('\n');

      const refSections: string[] = [];
      const categories = new Set((stash.recommendations ?? []).map((r) => r.category));

      if (categories.has('provider')) refSections.push(refs.load('provider-patterns.md'));
      if (categories.has('middleware')) refSections.push(refs.load('middleware-patterns.md'));
      if (categories.has('components')) refSections.push(refs.load('component-patterns.md'));
      if (categories.has('analytics')) refSections.push(refs.load('analytics-patterns.md'));
      if (categories.has('middleware')) refSections.push(refs.load('ssr-guide.md'));

      return prompt`
        Present a fix plan for the issues found. Use planning mode for complex
        fixes (rewriting middleware, restructuring components) to get the user's
        agreement on the approach.

        ## Issues to Fix
        ${recLines}

        ## Project Context
        Framework: ${stash.framework}
        Project: ${stash.projectPath}

        ${refSections.length > 0 ? '## Reference Context\n' + refSections.join('\n\n') : ''}

        Explain what you'll change, which files you'll modify, and why.
        Be specific about the approach.
      `;
    },
    output: z.object({
      plan: z.string(),
      filesToModify: z.array(z.string()),
    }),
    next: 'fix',
  })

  .step('fix', {
    prompt: ({ stash, getStep, refs }) => {
      const plan = getStep('plan-fix');
      const categories = new Set((stash.recommendations ?? []).map((r) => r.category));

      const refSections: string[] = [];
      if (categories.has('packages') || categories.has('env'))
        refSections.push(refs.load('env-var-spec.md'));
      if (categories.has('provider'))
        refSections.push(refs.load('provider-patterns.md'));
      if (categories.has('middleware'))
        refSections.push(refs.load('middleware-patterns.md'));
      if (categories.has('components'))
        refSections.push(refs.load('component-patterns.md'));

      return prompt`
        Implement the fixes from the plan. For package and env var issues,
        use the installPackages and writeEnvFile actions. For code issues,
        make the changes directly.

        ## Plan
        ${plan?.output ? JSON.stringify(plan.output, null, 2) : 'No plan available'}

        ## Reference
        ${refSections.join('\n\n')}
      `;
    },
    output: z.object({
      fixesMade: z.array(z.string()),
      filesModified: z.array(z.string()),
    }),
    next: 're-verify',
  })

  .step('re-verify', {
    prompt: ({ stash }) => prompt`
      Verify the fixes by confirming the project path for re-validation.
      Project path: ${stash.projectPath}
    `,
    output: z.object({ projectPath: z.string() }),
    action: validateSetup,
    next: ({ action, attempts }) => {
      const result = action as { overallStatus: string } | undefined;
      if (result?.overallStatus === 'pass') return 'done';
      if (attempts >= 3) return 'done';
      return 'fix';
    },
  })

  .step('done', {
    prompt: ({ stash, getStep }) => {
      const reVerify = getStep('re-verify');

      return prompt`
        Present a final summary of what was fixed and what remains.

        ## Original Status: ${stash.overallStatus ?? 'unknown'}

        ## Verification Result
        ${reVerify ? JSON.stringify(reVerify.output, null, 2) : 'No re-verification data'}

        ## Fixes Applied
        ${(stash.recommendations ?? []).map((r) => `- ${r.message}`).join('\n')}

        Summarize concisely. If issues remain, suggest next steps.
      `;
    },
    output: z.object({ summary: z.string() }),
    next: { terminal: true },
  })

  .build();
