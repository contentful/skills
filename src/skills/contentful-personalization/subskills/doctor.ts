import { skill, z, prompt, render, act, view, terminal } from '@contentful/skill-kit';
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
    prompt: ({ refs }) => [
      prompt`
        Explore this project to understand the current personalization setup.
        You are gathering facts about the CURRENT state — do NOT diagnose problems
        or suggest fixes yet. That happens in a later step.

        ## What to investigate (in priority order)

        1. **Framework & router** — Read package.json and project structure.
           What framework, version, and router type?

        2. **Provider configuration** — Search for NinetailedProvider or OptimizationProvider.
           Where is it? How is it configured? What plugins? Is it wrapping the right subtree?

        3. **Middleware / SSR** — Look for middleware.ts/js, edge functions, or server-side
           personalization code. Check for preflight calls, cookie handling, matcher config.

        4. **Component wiring** — Search for Experience, Personalize, ExperienceMapper,
           BlockRenderer, ContentTypeMap. How are components mapped and wrapped?

        5. **Analytics** — Insights plugin, track/page/identify calls, GTM or Segment?

        6. **Rendering pipeline** — How is content fetched? What include depth?
           Page-level or component-level?

        ## 🚩 Red flags to watch for
        - Provider missing or wrapping wrong subtree
        - Middleware matcher that catches static assets
        - Include depth < 10 (personalization entries need depth)
        - Missing or empty environment variables
        - Client-side data fetching without provider
        - Components that fetch their own data (breaks personalization)

        For each area, note the specific file paths and what you found.
        If something looks wrong, describe what you see but do NOT attempt to fix it.
      `,
      view('Reference: How Personalization Works', refs.load('how-personalization-works.md')),
    ],
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
    action: {
      input: ({ output }) => ({ projectPath: output.projectPath }),
      run: checkPackagesAndEnv,
      stash: ({ result }) => ({ packageData: result }),
    },
    next: 'check-api',
  })

  .step('check-api', {
    prompt: 'Confirming API connectivity check parameters.',
    output: z.object({
      apiKey: z.string().optional(),
      environment: z.string().default('main'),
      shouldCheck: z.boolean(),
    }),
    action: {
      input: ({ stash }) => ({
        apiKey: stash.packageData?.apiKey,
        environment: stash.packageData?.environment ?? 'main',
        shouldCheck: !!stash.packageData?.apiKey,
      }),
      run: checkApiConnectivity,
      stash: ({ result }) => ({ apiData: result }),
    },
    next: 'review',
  })

  .step('review', {
    prompt: ({ stash, getStep, refs }) => {
      const explore = getStep<{
        framework: string; explorationSummary: string; concerns: string[];
      }>('explore');

      const explorationView = explore?.output
        ? [
            `**Framework:** ${explore.output.framework}`,
            '',
            explore.output.explorationSummary,
            '',
            explore.output.concerns.length > 0
              ? render.section('⚠️ Concerns from Exploration',
                  explore.output.concerns.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n'))
              : '✅ No concerns noted during exploration',
          ].join('\n')
        : 'No exploration data available';

      const pkg = stash.packageData;
      const packageView = pkg
        ? [
            render.table(
              [...(pkg.packages?.ninetailed ?? []), ...(pkg.packages?.optimization ?? [])].map(
                (p: { name: string; version: string }) => ({ Package: p.name, Version: p.version })
              ),
              { columns: ['Package', 'Version'] }
            ) || '*No personalization SDK packages found*',
            '',
            render.table(
              (pkg.envVars ?? []).map((ev: { name: string; status: string; maskedValue?: string }) => ({
                Variable: ev.name, Status: ev.status, Value: ev.maskedValue ?? '—',
              })),
              { columns: ['Variable', 'Status', 'Value'] }
            ),
          ].join('\n')
        : 'No package data available';

      const api = stash.apiData;
      const apiView = api
        ? render.table(
            (api.findings ?? []).map((f: { status: string; item: string; detail: string }) => ({
              Check: f.item, Status: f.status, Detail: f.detail,
            })),
            { columns: ['Check', 'Status', 'Detail'] }
          )
        : 'No API data available';

      return [
        prompt`
          Synthesize ALL diagnostic findings below into prioritized recommendations.

          For each issue found, create a recommendation:
          - **priority**: "critical" (core functionality broken), "warning" (suboptimal), "info" (suggestion)
          - **message**: specific, actionable advice
          - **category**: packages, env, provider, middleware, components, analytics, or api

          Overall status:
          - "pass" — everything looks good
          - "warn" — warnings but nothing blocking
          - "fail" — critical issues exist

          Be conversational — explain WHY things are wrong, not just WHAT is wrong.
          Do NOT attempt fixes or modify any files. Diagnosis only.
        `,
        view('Exploration Findings', explorationView),
        view('Package & Environment Data', packageView),
        view('API Connectivity Results', apiView),
        view('Reference: Environment Variables', refs.load('env-var-spec.md')),
        view('Reference: Package Versions', refs.load('package-versions.md')),
        view('Reference: Common Errors', refs.load('common-errors.md')),
      ];
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
    prompt: ({ stash, getStep, act }) => {
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

      const statusLabel = (s: string) => {
        switch (s) {
          case 'pass': return 'Healthy';
          case 'warn': return 'Needs Attention';
          case 'fail': return 'Issues Found';
          default: return 'Unknown';
        }
      };

      const overallStatus = review?.output?.overallStatus ?? 'fail';
      const sections: string[] = [];

      sections.push(`# 🩺 Optimization Doctor Report\n`);
      sections.push(`## ${icon(overallStatus)} Overall: ${statusLabel(overallStatus)}\n`);
      sections.push(review?.output?.summary ?? 'No summary available');
      sections.push('---');

      if (explore?.output?.explorationSummary) {
        sections.push(render.section('🔍 Exploration Summary', explore.output.explorationSummary));
      }

      const pkg = stash.packageData;
      if (pkg) {
        const allPkgs = [...(pkg.packages?.ninetailed ?? []), ...(pkg.packages?.optimization ?? [])];
        const pkgTable = allPkgs.length > 0
          ? render.table(allPkgs.map((p: { name: string; version: string }) => ({
              Package: p.name, Version: p.version
            })), { columns: ['Package', 'Version'] })
          : '*No personalization SDK packages found*';

        const envTable = render.table(
          (pkg.envVars ?? []).map((ev: { name: string; status: string; maskedValue?: string }) => ({
            Variable: ev.name, Status: ev.status, Value: ev.maskedValue ?? '—'
          })),
          { columns: ['Variable', 'Status', 'Value'] }
        );

        sections.push(render.section('📦 Packages & Environment', `${pkgTable}\n\n${envTable}`));
      }

      const api = stash.apiData;
      if (api) {
        const apiTable = render.table(
          (api.findings ?? []).map((f: { status: string; item: string; detail: string }) => ({
            Check: f.item, Status: f.status, Detail: f.detail,
          })),
          { columns: ['Check', 'Status', 'Detail'] }
        );
        sections.push(render.section('🌐 API Connectivity', apiTable));
      }

      if (review?.output?.recommendations?.length) {
        const priorityIcon: Record<string, string> = { critical: '🔴', warning: '🟡', info: '💡' };
        const recs = review.output.recommendations
          .sort((a: { priority: string }, b: { priority: string }) => {
            const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
            return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
          })
          .map((r: { priority: string; message: string; category: string }, i: number) =>
            `${i + 1}. ${priorityIcon[r.priority] ?? '•'} **[${r.priority}]** ${r.message} *(${r.category})*`)
          .join('\n');
        sections.push(render.section('💊 Recommendations', recs));
      }

      return [
        'Present the Doctor Report below to the user exactly as rendered. After showing the report, let the user decide whether to proceed with fixes.',
        view('Doctor Report', sections.join('\n\n')),
        act.askUser({
          type: 'structured',
          question: 'Would you like help fixing these issues?',
          options: [
            { value: 'yes', label: '🔧 Yes, help me fix them' },
            { value: 'no', label: '📋 No, the report is enough' },
          ],
        }),
      ];
    },
    output: z.object({ choice: z.enum(['yes', 'no']) }),
    next: ({ output }) => (output.choice === 'yes' ? 'plan-fix' : 'report-only'),
  })

  .step('report-only', {
    prompt: prompt`
      The user has the diagnostic report and chose not to proceed with fixes.
      Thank them warmly and mention they can re-run the doctor anytime if issues
      come up later. Keep it to 2-3 sentences — brief and friendly.
      Do NOT repeat the report findings.
    `,
    output: z.object({ message: z.string() }),
    next: terminal,
  })

  .step('plan-fix', {
    prompt: ({ stash, act, refs }) => {
      const recs = stash.recommendations ?? [];
      const priorityIcon: Record<string, string> = { critical: '🔴', warning: '🟡', info: '💡' };

      const refSections: Array<{ label: string; content: string }> = [];
      const categories = new Set(recs.map((r) => r.category));
      if (categories.has('provider')) refSections.push({ label: 'Provider Patterns', content: refs.load('provider-patterns.md') });
      if (categories.has('middleware')) refSections.push({ label: 'Middleware Patterns', content: refs.load('middleware-patterns.md') });
      if (categories.has('components')) refSections.push({ label: 'Component Patterns', content: refs.load('component-patterns.md') });
      if (categories.has('analytics')) refSections.push({ label: 'Analytics Patterns', content: refs.load('analytics-patterns.md') });
      if (categories.has('middleware')) refSections.push({ label: 'SSR Guide', content: refs.load('ssr-guide.md') });

      return [
        prompt`
          Create a plan to fix the ${recs.length} issue${recs.length !== 1 ? 's' : ''} found during diagnosis.
          For each fix, explain what file(s) you'll change and why.
          Be specific about your approach.

          Do NOT start implementing — this is the planning step only.

          ${render.kv({
            'Framework': stash.framework,
            'Project': stash.projectPath,
          })}
        `,
        act.plan({
          summary: `Fix ${recs.length} issue${recs.length !== 1 ? 's' : ''} in ${stash.framework} personalization setup`,
          steps: recs.map((r) => `${priorityIcon[r.priority] ?? '•'} [${r.priority}] ${r.message}`),
        }),
        ...refSections.map(r => view(`Reference: ${r.label}`, r.content)),
      ];
    },
    output: z.object({
      approved: z.boolean(),
      plan: z.string(),
      filesToModify: z.array(z.string()),
    }),
    next: ({ output }) => (output.approved ? 'fix' : 'done'),
  })

  .step('fix', {
    prompt: ({ stash, act, system, getStep, refs }) => {
      const plan = getStep<{ plan: string; filesToModify: string[] }>('plan-fix');
      const recs = stash.recommendations ?? [];
      const priorityIcon: Record<string, string> = { critical: '🔴', warning: '🟡', info: '💡' };

      const categories = new Set(recs.map((r) => r.category));
      const refSections: Array<{ label: string; content: string }> = [];
      if (categories.has('packages') || categories.has('env'))
        refSections.push({ label: 'Env Var Spec', content: refs.load('env-var-spec.md') });
      if (categories.has('provider'))
        refSections.push({ label: 'Provider Patterns', content: refs.load('provider-patterns.md') });
      if (categories.has('middleware'))
        refSections.push({ label: 'Middleware Patterns', content: refs.load('middleware-patterns.md') });
      if (categories.has('components'))
        refSections.push({ label: 'Component Patterns', content: refs.load('component-patterns.md') });

      return [
        system`Apply each fix methodically. Update the checklist status as you complete each one. Match the project's existing code style.`,
        prompt`
          Implement the fixes from the approved plan. For each fix:

          - **Package issues** → use the installPackages action
          - **Env var issues** → use the writeEnvFile action
          - **Code issues** → edit files directly

          After all fixes, the setup will be re-verified automatically.

          ${plan?.output?.plan ? `**Plan:** ${plan.output.plan}` : ''}
          ${plan?.output?.filesToModify?.length ? `**Files to modify:** ${plan.output.filesToModify.join(', ')}` : ''}
        `,
        act.checklist({
          create: recs.map((r) => ({
            title: `${priorityIcon[r.priority] ?? '•'} [${r.priority}] ${r.message}`,
            status: 'pending' as const,
          })),
        }),
        ...refSections.map(r => view(`Reference: ${r.label}`, r.content)),
      ];
    },
    output: z.object({
      fixesMade: z.array(z.string()),
      filesModified: z.array(z.string()),
    }),
    next: 're-verify',
  })

  .step('re-verify', {
    prompt: 'Re-running validation to verify the fixes.',
    output: z.object({ projectPath: z.string() }),
    action: {
      input: ({ stash }) => ({ projectPath: stash.projectPath }),
      run: validateSetup,
    },
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
      const reVerifyAction = reVerify?.action as { overallStatus?: string; summary?: string } | undefined;
      const recs = stash.recommendations ?? [];

      const statusIcon = reVerifyAction?.overallStatus === 'pass' ? '✅'
        : reVerifyAction?.overallStatus === 'warn' ? '⚠️' : '❌';

      const sections: string[] = [];
      sections.push(`# 🩺 Doctor Summary\n`);
      sections.push(render.section('Before', `Status: ${stash.overallStatus ?? 'unknown'}`));

      if (reVerifyAction) {
        sections.push(render.section(
          `After: ${statusIcon} ${(reVerifyAction.overallStatus ?? 'unknown').toUpperCase()}`,
          reVerifyAction.summary ?? 'No verification summary',
        ));
      }

      if (recs.length > 0) {
        sections.push(render.section('🔧 Fixes Applied',
          recs.map((r) => `- ${r.message}`).join('\n')
        ));
      }

      if (reVerifyAction?.overallStatus !== 'pass') {
        sections.push(render.section('💡 Remaining Issues',
          'Some issues may remain. Consider running the doctor again after addressing any manual steps above.'
        ));
      }

      return [
        'Present the final summary below to the user. Be warm and encouraging. If everything passed, celebrate briefly. If issues remain, be honest but constructive.',
        view('Doctor Summary', sections.join('\n\n')),
      ];
    },
    output: z.object({ summary: z.string() }),
    next: terminal,
  })

  .build();
