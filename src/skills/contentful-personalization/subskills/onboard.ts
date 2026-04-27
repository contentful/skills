import { skill, z, prompt, render, act, view, terminal } from '@contentful/skill-kit';
import { checkPackagesAndEnv } from '../actions/check-packages-env.js';
import { validateSetup } from '../actions/validate-setup.js';
import { installPackages } from '../actions/install-packages.js';
import { writeEnvFile } from '../actions/write-env-file.js';
import { PackagesAndEnvResult, ReadinessStatus } from '../schemas.js';
import { VERSION } from '../version.js';

export default skill({
  name: 'onboard',
  version: VERSION,
  description:
    'Assess readiness and guide Contentful personalization setup end-to-end. ' +
    'Explores the codebase, checks readiness, helps choose SDK and architecture, ' +
    'installs packages, and guides implementation.',
  entry: 'explore',

  context: z.object({
    userQuery: z.string().optional(),
    readinessOnly: z.boolean().optional(),
  }),

  stash: z.object({
    framework: z.string(),
    routerType: z.enum(['app', 'pages', 'hybrid', 'none']),
    projectPath: z.string(),
    packageData: PackagesAndEnvResult.optional(),
    readinessStatus: ReadinessStatus.optional(),
    readinessOnly: z.boolean(),
    sdkChoice: z.enum(['ninetailed', 'optimization']).optional(),
    architecture: z.enum(['client-only', 'hybrid-ssr', 'server-only']).optional(),
    packagesToInstall: z.array(z.string()).optional(),
    envVars: z.record(z.string(), z.string()).optional(),
  }),
})
  .step('explore', {
    prompt: ({ context, refs }) => [
      prompt`
        Investigate this project to understand its structure, Contentful integration,
        and what personalization would look like here. You are gathering facts —
        do NOT make recommendations, produce a readiness verdict, or ask the user
        questions. That happens in later steps.

        ## What to investigate (in priority order)

        1. **Framework & version** — Read package.json. Check for app/ vs pages/ directories,
           next.config, gatsby-config, remix.config. Identify the framework and router type.

        2. **Contentful integration** — Find the Contentful client. How is content fetched?
           What include depth? Where are env vars configured? Is there a preview client?

        3. **Component architecture** — Find the component mapper (ContentTypeMap, BlockRenderer,
           ComponentRenderer). Are components isolated (props in, JSX out) or do they fetch data?

        4. **Rendering pipeline** — Page-level or component-level fetching? SSR, SSG, ISR, client?
           Any existing middleware?

        5. **Existing personalization** — Any NinetailedProvider, Experience components,
           ExperienceMapper, or @contentful/optimization code already present?

        6. **Env var approach** — .env files? Vercel env? Framework-prefixed vars?

        Spend most time on items 1-4. For each area, note the specific files and patterns you find.
        Think about which components would be good candidates for personalization.

        ${context?.userQuery ? `\nUser's request: "${context.userQuery}"` : ''}
        ${context?.readinessOnly ? '\nNote: The user only asked about readiness — keep that in mind but still explore fully.' : ''}
      `,
      view('Reference: How Personalization Works', refs.load('how-personalization-works.md')),
      view('Reference: Component Patterns', refs.load('component-patterns.md')),
      view('Reference: Framework Notes', refs.load('framework-notes.md')),
    ],
    output: z.object({
      framework: z.enum(['nextjs-app', 'nextjs-pages', 'nextjs-hybrid', 'gatsby', 'remix', 'other']),
      frameworkVersion: z.string().optional(),
      routerType: z.enum(['app', 'pages', 'hybrid', 'none']),
      projectPath: z.string(),
      explorationSummary: z.string(),
      personalizableCandidates: z.array(z.string()),
      existingSetup: z.enum(['none', 'partial', 'configured']),
      readinessOnly: z.boolean(),
    }),
    stash: ({ output }) => ({
      framework: output.framework,
      routerType: output.routerType,
      projectPath: output.projectPath,
      readinessOnly: output.readinessOnly,
    }),
    action: {
      input: ({ output }) => ({ projectPath: output.projectPath }),
      run: checkPackagesAndEnv,
      stash: ({ result }) => ({ packageData: result }),
    },
    next: 'assess',
  })

  .step('assess', {
    prompt: ({ stash, getStep, refs }) => {
      const explore = getStep('explore');
      const exploreOutput = explore?.output as {
        framework: string; routerType: string; explorationSummary: string;
        personalizableCandidates: string[]; existingSetup: string;
      } | undefined;

      const explorationView = exploreOutput
        ? [
            render.kv({
              'Framework': exploreOutput.framework,
              'Router': exploreOutput.routerType,
              'Existing setup': exploreOutput.existingSetup,
            }),
            '',
            exploreOutput.explorationSummary,
            '',
            exploreOutput.personalizableCandidates.length > 0
              ? `**Personalization candidates:** ${exploreOutput.personalizableCandidates.join(', ')}`
              : '*No specific candidates identified yet*',
          ].join('\n')
        : 'No exploration data available';

      const pkg = stash.packageData;
      const packageView = pkg
        ? [
            render.table(
              [...(pkg.packages?.ninetailed ?? []), ...(pkg.packages?.optimization ?? []),
               ...(pkg.packages?.contentful ?? []), ...(pkg.packages?.framework ?? [])].map(
                (p: { name: string; version: string }) => ({ Package: p.name, Version: p.version })
              ),
              { columns: ['Package', 'Version'] }
            ) || '*No packages found*',
            '',
            render.table(
              (pkg.envVars ?? []).map((ev: { name: string; status: string; maskedValue?: string }) => ({
                Variable: ev.name, Status: ev.status, Value: ev.maskedValue ?? '—',
              })),
              { columns: ['Variable', 'Status', 'Value'] }
            ),
          ].join('\n')
        : 'No package data available';

      return [
        prompt`
          Combine the exploration findings with the deterministic package/env data below
          to produce a readiness assessment. Assess these five areas:

          | Area | What to evaluate |
          |------|-----------------|
          | **Framework** | Supported framework? Version adequate? |
          | **Contentful SDK** | Installed? Client configured? Include depth? |
          | **Personalization SDK** | Current state of Ninetailed/Optimization setup |
          | **Component architecture** | Mapper present? Components isolated? |
          | **Rendering pipeline** | Page-level fetching? Include depth adequate? |

          For each area, give a status and explain **why** it matters — not just pass/fail.
          Be conversational and helpful.

          Overall status: "ready", "minor-changes", "needs-work", or "not-ready".

          Do NOT make SDK or architecture recommendations — that happens in the next step.
          Do NOT ask the user any questions.

          ${stash.readinessOnly ? 'The user is only asking about readiness, not requesting a full setup. Set readinessOnly to true.' : 'Set readinessOnly to false unless the exploration data suggests the user only wanted a readiness check.'}
        `,
        view('Readiness Rubric', refs.load('readiness-criteria.md')),
        view('Exploration Findings', explorationView),
        view('Package & Environment Data', packageView),
      ];
    },
    output: z.object({
      readinessStatus: ReadinessStatus,
      report: z.string(),
      prerequisites: z.array(z.string()),
      readinessOnly: z.boolean(),
    }),
    stash: ({ output }) => ({ readinessStatus: output.readinessStatus }),
    next: ({ output }) => {
      const status = output.readinessStatus;
      if (status === 'not-ready' || status === 'needs-work') return 'gate';
      if (output.readinessOnly) return 'gate';
      return 'recommend';
    },
  })

  .step('gate', {
    prompt: ({ stash, getStep }) => {
      const assess = getStep<{ readinessStatus: string; report: string; prerequisites: string[] }>('assess');
      if (!assess?.output) {
        return [
          'Present a brief message explaining that assessment data was unavailable.',
          view('⚠️ No assessment data available. Please re-run the readiness check.'),
        ];
      }

      const statusConfig: Record<string, { icon: string; label: string; detail: string }> = {
        'ready': { icon: '✅', label: 'Ready', detail: 'All systems go' },
        'minor-changes': { icon: '🟡', label: 'Almost Ready', detail: 'A few small things to address' },
        'needs-work': { icon: '🟠', label: 'Needs Work', detail: 'Moderate changes required before setup' },
        'not-ready': { icon: '🔴', label: 'Not Ready', detail: 'Significant work needed first' },
      };
      const status = statusConfig[stash.readinessStatus ?? 'not-ready'] ?? statusConfig['not-ready'];

      const sections: string[] = [];
      sections.push(`# ${status.icon} Readiness Report: ${status.label}\n`);
      sections.push(`*${status.detail}*\n`);
      sections.push('---\n');
      sections.push(assess.output.report);

      if (assess.output.prerequisites.length > 0) {
        sections.push(render.section('📋 Prerequisites',
          assess.output.prerequisites.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')
        ));
      }

      if (stash.readinessStatus === 'ready' || stash.readinessStatus === 'minor-changes') {
        sections.push('\n---\n\n🎉 Your project is ready for personalization! Run this skill again when you want to start setup.');
      } else {
        sections.push('\n---\n\n💡 Address the items above, then run this skill again to re-check readiness.');
      }

      return [
        'Present the readiness report below to the user exactly as rendered. Add a brief, warm closing sentence.',
        view('Readiness Report', sections.join('\n\n')),
      ];
    },
    output: z.object({ message: z.string() }),
    next: terminal,
  })

  .step('recommend', {
    prompt: ({ stash, getStep, refs }) => {
      const explore = getStep('explore');

      return [
        prompt`
          Recommend a specific SDK and architecture for this project.
          Explain your reasoning conversationally — help the user understand WHY
          this choice fits their project, not just WHAT the choice is.

          ## Project Context
          ${render.kv({
            'Framework': stash.framework,
            'Router': stash.routerType,
          })}
          ${explore?.output ? `\n${(explore.output as { explorationSummary: string }).explorationSummary}` : ''}

          ## Your two decisions

          **SDK choice:**
          - \`ninetailed\` — @ninetailed/experience.js (current, battle-tested, more plugins)
          - \`optimization\` — @contentful/optimization (modern, Contentful-native, simpler API)

          **Architecture:**
          - \`client-only\` — All personalization runs in the browser
          - \`hybrid-ssr\` — Server-side preflight + client hydration
          - \`server-only\` — Full server-side personalization (advanced)

          Present your recommendation clearly but do NOT ask the user to confirm —
          that happens automatically in the next step.
          Do NOT start implementing anything or install packages.
        `,
        view('SDK Selection Guide', refs.load('sdk-selection.md')),
      ];
    },
    output: z.object({
      sdkChoice: z.enum(['ninetailed', 'optimization']),
      architecture: z.enum(['client-only', 'hybrid-ssr', 'server-only']),
      reasoning: z.string(),
    }),
    stash: ({ output }) => ({
      sdkChoice: output.sdkChoice,
      architecture: output.architecture,
    }),
    next: 'confirm-choice',
  })

  .step('confirm-choice', {
    prompt: ({ stash, act }) => [
      prompt`
        Present the SDK and architecture recommendation below, then ask the user
        to confirm. Keep it brief — the reasoning was already explained.

        ## 📦 Recommendation Summary

        ${render.kv({
          'SDK': stash.sdkChoice === 'ninetailed'
            ? '@ninetailed/experience.js (legacy, proven)'
            : '@contentful/optimization (modern, Contentful-native)',
          'Architecture': stash.architecture === 'client-only'
            ? 'Client-only (browser-side personalization)'
            : stash.architecture === 'hybrid-ssr'
              ? 'Hybrid SSR (server preflight + client hydration)'
              : 'Server-only (full server-side)',
          'Framework': stash.framework,
        })}
      `,
      act.confirm({
        message: 'Proceed with this SDK and architecture choice?',
        defaultAnswer: 'yes',
      }),
    ],
    output: z.object({ approved: z.boolean() }),
    next: ({ output }) => (output.approved ? 'cms-setup' : 'recommend'),
  })

  .step('cms-setup', {
    prompt: ({ refs, act }) => [
      prompt`
        Guide the user through the Contentful app installation. These are steps
        the user must perform in the Contentful web UI — you cannot do them.

        Present the setup guide below as a clear, friendly walkthrough. Emphasize
        that this is a one-time setup they do in their browser.

        Do NOT skip ahead to coding. Wait for the user's response.
      `,
      view('🏗️ Contentful App Setup Guide', refs.load('contentful-app-setup.md')),
      act.askUser({
        type: 'structured',
        question: 'Have you completed the Contentful app setup?',
        options: [
          { value: 'done', label: '✅ Yes, setup is complete' },
          { value: 'help', label: '❓ I need more guidance' },
        ],
      }),
    ],
    output: z.object({ choice: z.enum(['done', 'help']) }),
    next: ({ output, attempts }) => {
      if (output.choice === 'done') return 'plan';
      if (attempts >= 3) return 'plan';
      return 'cms-setup';
    },
  })

  .step('plan', {
    prompt: ({ stash, act, refs }) => {
      const refSections: Array<{ label: string; content: string }> = [
        { label: 'Environment Variables', content: refs.load('env-var-spec.md') },
        { label: 'Provider Patterns', content: refs.load('provider-patterns.md') },
        { label: 'Rendering Pipeline', content: refs.load('rendering-pipeline.md') },
      ];

      if (stash.architecture === 'hybrid-ssr') {
        refSections.push({ label: 'Middleware Patterns', content: refs.load('middleware-patterns.md') });
        refSections.push({ label: 'SSR Guide', content: refs.load('ssr-guide.md') });
      }

      refSections.push({ label: 'Analytics & Preview', content: refs.load('analytics-and-preview.md') });
      refSections.push({ label: 'Implementation Examples', content: refs.load('implementation-examples.md') });

      const steps = [
        `📦 Install packages: ${stash.sdkChoice === 'ninetailed' ? '@ninetailed/experience.js + plugins' : '@contentful/optimization + plugins'}`,
        '🔑 Configure environment variables with placeholder values',
        '🔌 Add provider wrapper to the appropriate layout/app file',
        '🧩 Wire components with Experience/Personalize wrappers and update component mapper',
        ...(stash.architecture === 'hybrid-ssr' ? ['⚡ Set up middleware with preflight, cookie management, and matcher config'] : []),
        ...(stash.architecture !== 'server-only' ? ['📊 Configure analytics/insights plugin'] : []),
        '✅ Verify setup and fix any issues',
      ];

      return [
        prompt`
          Review the implementation plan below and present it to the user for approval.
          Expand each step with specific file paths based on what was found during exploration.
          Be concrete — name the actual files that will be created or modified.

          Do NOT begin implementing. This is the planning step only.

          ${render.kv({
            'SDK': stash.sdkChoice ?? 'TBD',
            'Architecture': stash.architecture ?? 'TBD',
            'Framework': `${stash.framework} (${stash.routerType} router)`,
          })}
        `,
        act.plan({
          summary: `Implement ${stash.sdkChoice} personalization with ${stash.architecture} architecture`,
          steps,
        }),
        ...refSections.map(r => view(`Reference: ${r.label}`, r.content)),
      ];
    },
    output: z.object({
      approved: z.boolean(),
      packagesToInstall: z.array(z.string()),
      envVars: z.record(z.string(), z.string()),
      plan: z.string(),
    }),
    stash: ({ output }) => ({
      packagesToInstall: output.packagesToInstall,
      envVars: output.envVars,
    }),
    next: ({ output }) => (output.approved ? 'install' : 'recommend'),
  })

  .step('install', {
    prompt: 'Installing packages now.',
    output: z.object({
      projectPath: z.string(),
      packages: z.array(z.string()),
      packageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun']),
    }),
    action: {
      input: ({ stash }) => ({
        projectPath: stash.projectPath,
        packages: stash.packagesToInstall ?? [],
        packageManager: stash.packageData?.packageManager ?? 'npm',
      }),
      run: installPackages,
    },
    next: 'write-env',
  })

  .step('write-env', {
    prompt: 'Writing environment variables now.',
    output: z.object({
      projectPath: z.string(),
      variables: z.record(z.string(), z.string()),
      fileName: z.string(),
    }),
    action: {
      input: ({ stash }) => ({
        projectPath: stash.projectPath,
        variables: stash.envVars ?? {},
        fileName: '.env.local',
      }),
      run: writeEnvFile,
    },
    next: 'implement',
  })

  .step('implement', {
    prompt: ({ stash, act, system, refs }) => {
      const refSections: Array<{ label: string; content: string }> = [
        { label: 'Provider Patterns', content: refs.load('provider-patterns.md') },
        { label: 'Rendering Pipeline', content: refs.load('rendering-pipeline.md') },
        { label: 'Component Patterns', content: refs.load('component-patterns.md') },
      ];

      if (stash.architecture === 'hybrid-ssr') {
        refSections.push({ label: 'Middleware Patterns', content: refs.load('middleware-patterns.md') });
      }

      if (stash.sdkChoice === 'ninetailed') {
        refSections.push({ label: 'SDK Reference (Legacy)', content: refs.load('sdk-legacy-guide.md') });
      } else {
        refSections.push({ label: 'SDK Reference (Modern)', content: refs.load('sdk-next-guide.md') });
      }

      refSections.push({ label: 'Implementation Examples', content: refs.load('implementation-examples.md') });

      return [
        system`Work through each checklist item methodically. After completing each one, update its status. Adapt all code to match the project's existing style — do not introduce a different coding style.`,
        prompt`
          Implement the personalization setup for this project.

          ${render.kv({
            'SDK': stash.sdkChoice ?? 'unknown',
            'Architecture': stash.architecture ?? 'unknown',
            'Framework': `${stash.framework} (${stash.routerType} router)`,
          })}

          Work through the checklist below. For each item, read the relevant
          reference material, make the code changes, then mark it complete.

          Do NOT ask the user questions during implementation.
          If you hit an ambiguous decision, use the reference material to make the best choice.
        `,
        act.checklist({
          create: [
            { title: '🔌 Provider wrapper setup', status: 'pending' as const },
            { title: '🧩 Component wiring (Experience/Personalize wrappers)', status: 'pending' as const },
            ...(stash.architecture === 'hybrid-ssr'
              ? [{ title: '⚡ Middleware (preflight, cookies, matcher)', status: 'pending' as const }] : []),
            { title: '📊 Analytics plugin configuration', status: 'pending' as const },
            { title: '🔄 Rendering pipeline adjustments', status: 'pending' as const },
          ],
        }),
        ...refSections.map(r => view(`Reference: ${r.label}`, r.content)),
      ];
    },
    output: z.object({
      filesModified: z.array(z.string()),
      summary: z.string(),
    }),
    next: 'verify',
  })

  .step('verify', {
    prompt: ({ stash, refs }) => [
      prompt`
        Verify the personalization setup. Confirm the project path so the
        automated validation can run, then also manually check these items:

        ## 🔍 Manual Verification Checklist

        - [ ] Provider wraps the correct subtree (not too broad, not too narrow)
        - [ ] No hydration mismatch patterns (client/server content divergence)
        - [ ] Page tracking fires once per navigation (not on re-renders)
        - [ ] Include depth is adequate for personalization entries
        - [ ] Middleware matcher excludes static assets (/_next, images, etc.)

        If you find issues, just report them — do NOT fix them here.
        The fix step handles repairs.

        Project path: ${stash.projectPath}
      `,
      view('Reference: Common Errors', refs.load('common-errors.md')),
    ],
    output: z.object({ projectPath: z.string() }),
    action: { run: validateSetup },
    next: ({ action, attempts }) => {
      const result = action as { overallStatus: string } | undefined;
      if (result?.overallStatus === 'pass') return 'report';
      if (attempts >= 3) return 'report';
      return 'fix';
    },
  })

  .step('fix', {
    prompt: ({ stash, refs }) => [
      prompt`
        Fix the issues found during verification. Work through them systematically:

        ## Fix Strategy

        - **Package issues** → Use the installPackages action
        - **Env var issues** → Use the writeEnvFile action
        - **Code issues** (provider, components, middleware) → Edit files directly
        - **Configuration issues** (include depth, matcher) → Edit config files

        For each fix, explain briefly what was wrong and what you changed.
        After all fixes, the setup will be re-verified automatically.

        ${render.kv({
          'Framework': stash.framework,
          'Project': stash.projectPath,
        })}
      `,
      view('Reference: Common Errors & Fixes', refs.load('common-errors.md')),
    ],
    output: z.object({
      fixesMade: z.array(z.string()),
    }),
    next: 'verify',
  })

  .step('report', {
    prompt: ({ stash, getStep }) => {
      const impl = getStep<{ filesModified: string[]; summary: string }>('implement');
      const verify = getStep('verify');

      const sections: string[] = [];
      sections.push('# 🎉 Personalization Setup Complete\n');

      if (impl?.output) {
        sections.push(render.section('📝 What Was Done', impl.output.summary));
        if (impl.output.filesModified.length > 0) {
          sections.push(render.section('📁 Files Modified',
            render.table(
              impl.output.filesModified.map((f: string) => ({ File: f })),
              { columns: ['File'] }
            )
          ));
        }
      }

      sections.push(render.section('⚙️ Configuration',
        render.kv({
          'SDK': stash.sdkChoice === 'ninetailed'
            ? '@ninetailed/experience.js'
            : '@contentful/optimization',
          'Architecture': stash.architecture ?? 'unknown',
          'Framework': `${stash.framework} (${stash.routerType})`,
        })
      ));

      if (verify?.action) {
        const v = verify.action as { overallStatus: string; summary: string };
        const statusIcon = v.overallStatus === 'pass' ? '✅' : v.overallStatus === 'warn' ? '⚠️' : '❌';
        sections.push(render.section(`🔍 Verification: ${statusIcon} ${v.overallStatus.toUpperCase()}`, v.summary));
      }

      sections.push(render.section('🚀 Next Steps', [
        '1. **Create experiences** — Open the Personalization app in Contentful and create your first audience + experience',
        '2. **Publish content** — Add personalization variants to your content entries',
        '3. **Test in preview** — Use preview mode to verify experiences render correctly',
        '4. **Go live & monitor** — Publish and watch analytics for experiment results',
      ].join('\n')));

      return [
        'Present the setup completion report below to the user exactly as rendered. Add a brief, celebratory closing message.',
        view('Setup Report', sections.join('\n\n')),
      ];
    },
    output: z.object({ summary: z.string() }),
    next: terminal,
  })

  .build();
