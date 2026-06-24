import { skill, type, prompt, render, act, view, terminal } from '@contentful/skill-kit';
import { checkPackages } from '../actions/check-packages.js';
import { validateSetup } from '../actions/validate-setup.js';
import { buildInstallCommand, derivePackagesToInstall, installPackages } from '../actions/install-packages.js';
import { writeEnvFile } from '../actions/write-env-file.js';
import { PackagesResult, ReadinessStatus, type PackagesResult as PackagesResultData } from '../schemas.js';
import { VERSION } from '../version.js';

type InstallableFramework = 'nextjs-app' | 'nextjs-pages' | 'nextjs-hybrid' | 'gatsby' | 'remix' | 'react' | 'other';

function getInstallableFramework(framework: string): InstallableFramework {
  if (
    framework === 'nextjs-app' ||
    framework === 'nextjs-pages' ||
    framework === 'nextjs-hybrid' ||
    framework === 'gatsby' ||
    framework === 'remix' ||
    framework === 'react'
  ) {
    return framework;
  }

  return 'other';
}

function getInstallPackageManager(packageManager: PackagesResultData['packageManager'] | undefined) {
  return packageManager === 'unknown' || !packageManager ? 'npm' : packageManager;
}

function getDerivedPackages(store: {
  project: { framework: string; packages?: { packageManager?: PackagesResultData['packageManager'] } };
  setup?: {
    sdkChoice?: 'ninetailed' | 'optimization';
    architecture?: 'client-only' | 'hybrid-ssr' | 'server-only';
  };
}) {
  return derivePackagesToInstall({
    sdkChoice: store.setup?.sdkChoice ?? 'ninetailed',
    framework: getInstallableFramework(store.project.framework),
    architecture: store.setup?.architecture ?? 'client-only',
  });
}

export default skill({
  name: 'onboard',
  version: VERSION,
  description:
    'Assess readiness and guide Contentful personalization setup end-to-end. ' +
    'Explores the codebase, checks readiness, helps choose SDK and architecture, ' +
    'installs packages, and guides implementation.',
  entry: 'explore',

  params: type({
    'userQuery?': 'string',
    'readinessOnly?': 'boolean',
  }),

  stores: {
    project: type({
      framework: 'string',
      routerType: "'app' | 'pages' | 'hybrid' | 'none'",
      projectPath: 'string',
      'explorationSummary?': 'string',
      'personalizableCandidates?': 'string[]',
      'existingSetup?': "'none' | 'partial' | 'configured'",
      'packages?': PackagesResult,
    }),
    setup: type({
      'sdkChoice?': "'ninetailed' | 'optimization'",
      'architecture?': "'client-only' | 'hybrid-ssr' | 'server-only'",
      'envVars?': 'Record<string, string>',
    }),
  },
})
  .step('explore', {
    prompt: ({ params, refs }) => prompt`
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

        ${params?.userQuery ? `\nUser's request: "${params.userQuery}"` : ''}
        ${params?.readinessOnly ? '\nNote: The user only asked about readiness — keep that in mind but still explore fully.' : ''}

        ## Reference Material
        ${refs.load('how-personalization-works.md')}

        ${refs.load('component-patterns.md')}

        ${refs.load('framework-notes.md')}
      `,
    response: type({
      framework: "'nextjs-app' | 'nextjs-pages' | 'nextjs-hybrid' | 'gatsby' | 'remix' | 'react' | 'other'",
      'frameworkVersion?': 'string',
      routerType: "'app' | 'pages' | 'hybrid' | 'none'",
      projectPath: 'string',
      explorationSummary: 'string',
      personalizableCandidates: 'string[]',
      existingSetup: "'none' | 'partial' | 'configured'",
      readinessOnly: 'boolean',
    }),
    save: ({ response, actionResult }) => ({
      step: response,
      project: {
        framework: response.framework,
        routerType: response.routerType,
        projectPath: response.projectPath,
        explorationSummary: response.explorationSummary,
        personalizableCandidates: response.personalizableCandidates,
        existingSetup: response.existingSetup,
        packages: actionResult,
      },
    }),
    action: {
      mapInput: ({ response }) => ({ projectPath: response.projectPath }),
      run: checkPackages,
    },
    next: 'assess',
  })

  .step('assess', {
    prompt: ({ store, refs }) => {
      const explorationView = store.project.explorationSummary
        ? [
            render.kv({
              Framework: store.project.framework,
              Router: store.project.routerType,
              'Existing setup': store.project.existingSetup ?? 'unknown',
            }),
            '',
            store.project.explorationSummary,
            '',
            (store.project.personalizableCandidates?.length ?? 0) > 0
              ? `**Personalization candidates:** ${store.project.personalizableCandidates!.join(', ')}`
              : '*No specific candidates identified yet*',
          ].join('\n')
        : 'No exploration data available';

      const pkg = store.project.packages;
      const packageView = pkg
        ? render.table(
            [
              ...(pkg.packages?.ninetailed ?? []),
              ...(pkg.packages?.optimization ?? []),
              ...(pkg.packages?.contentful ?? []),
              ...(pkg.packages?.framework ?? []),
            ].map((p: { name: string; version: string }) => ({
              Package: p.name,
              Version: p.version,
            })),
            { columns: ['Package', 'Version'] },
          ) || '*No packages found*'
        : 'No package data available';

      const readinessOnly = store.steps.explore.readinessOnly;

      return prompt`
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

          ${readinessOnly ? 'The user is only asking about readiness, not requesting a full setup. Set readinessOnly to true.' : 'Set readinessOnly to false unless the exploration data suggests the user only wanted a readiness check.'}

          ## Readiness Rubric
          ${refs.load('readiness-criteria.md')}

          ## Exploration Findings
          ${explorationView}

          ## Package & Environment Data
          ${packageView}
        `;
    },
    response: type({
      readinessStatus: ReadinessStatus,
      report: 'string',
      prerequisites: 'string[]',
      readinessOnly: 'boolean',
    }),
    next: ({ response }) => {
      const status = response.readinessStatus;
      if (status === 'not-ready' || status === 'needs-work') return 'gate';
      if (response.readinessOnly) return 'gate';
      return 'recommend';
    },
  })

  .step('gate', {
    prompt: ({ store }) => {
      const assessReport = store.steps.assess.report;
      if (!assessReport) {
        return [
          'Present a brief message explaining that assessment data was unavailable.',
          view('⚠️ No assessment data available. Please re-run the readiness check.'),
        ];
      }

      const readinessStatus = store.steps.assess.readinessStatus;
      const statusConfig: Record<string, { icon: string; label: string; detail: string }> = {
        ready: { icon: '✅', label: 'Ready', detail: 'All systems go' },
        'minor-changes': {
          icon: '🟡',
          label: 'Almost Ready',
          detail: 'A few small things to address',
        },
        'needs-work': {
          icon: '🟠',
          label: 'Needs Work',
          detail: 'Moderate changes required before setup',
        },
        'not-ready': {
          icon: '🔴',
          label: 'Not Ready',
          detail: 'Significant work needed first',
        },
      };
      const status = statusConfig[readinessStatus ?? 'not-ready'] ?? statusConfig['not-ready'];

      const sections: string[] = [];
      sections.push(`# ${status.icon} Readiness Report: ${status.label}\n`);
      sections.push(`*${status.detail}*\n`);
      sections.push('---\n');
      sections.push(assessReport);

      const prerequisites = store.steps.assess.prerequisites;
      if ((prerequisites?.length ?? 0) > 0) {
        sections.push(
          render.section('📋 Prerequisites', prerequisites.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')),
        );
      }

      if (readinessStatus === 'ready' || readinessStatus === 'minor-changes') {
        sections.push(
          '\n---\n\n🎉 Your project is ready for personalization! Run this skill again when you want to start setup.',
        );
      } else {
        sections.push('\n---\n\n💡 Address the items above, then run this skill again to re-check readiness.');
      }

      return [
        'Present the readiness report below to the user exactly as rendered. Add a brief, warm closing sentence.',
        view('Readiness Report', sections.join('\n\n')),
      ];
    },
    next: terminal,
  })

  .step('recommend', {
    prompt: ({ store, refs }) => {
      return prompt`
          Recommend a specific SDK and architecture for this project.
          Explain your reasoning conversationally — help the user understand WHY
          this choice fits their project, not just WHAT the choice is.

          ## Project Context
          ${render.kv({
            Framework: store.project.framework,
            Router: store.project.routerType,
          })}
          ${store.project.explorationSummary ? `\n${store.project.explorationSummary}` : ''}

          ## Your two decisions

          **SDK choice:**
          - \`ninetailed\` — @ninetailed/experience.js (current default; battle-tested, more plugins)
          - \`optimization\` — @contentful/optimization (modern, Contentful-native, simpler API; pre-release/alpha)

          **Architecture:**
          - \`client-only\` — All personalization runs in the browser
          - \`hybrid-ssr\` — Server-side preflight + client hydration
          - \`server-only\` — Full server-side personalization (advanced)

          Present your recommendation clearly but do NOT ask the user to confirm —
          that happens automatically in the next step.
          Do NOT start implementing anything or install packages.

          ## SDK Selection Guide
          ${refs.load('sdk-selection.md')}
        `;
    },
    response: type({
      sdkChoice: "'ninetailed' | 'optimization'",
      architecture: "'client-only' | 'hybrid-ssr' | 'server-only'",
      reasoning: 'string',
    }),
    save: ({ response }) => ({
      setup: {
        sdkChoice: response.sdkChoice,
        architecture: response.architecture,
      },
    }),
    next: 'confirm-choice',
  })

  .step('confirm-choice', {
    prompt: ({ store }) => [
      prompt`
        Present the SDK and architecture recommendation below, then ask the user
        to confirm. Keep it brief — the reasoning was already explained.

        ## 📦 Recommendation Summary

        ${render.kv({
          SDK:
            store.setup?.sdkChoice === 'ninetailed'
              ? '@ninetailed/experience.js (current default)'
              : '@contentful/optimization (modern, Contentful-native)',
          Architecture:
            store.setup?.architecture === 'client-only'
              ? 'Client-only (browser-side personalization)'
              : store.setup?.architecture === 'hybrid-ssr'
                ? 'Hybrid SSR (server preflight + client hydration)'
                : 'Server-only (full server-side)',
          Framework: store.project.framework,
        })}
      `,
      act.confirm({
        message: 'Proceed with this SDK and architecture choice?',
        defaultAnswer: 'yes',
      }),
    ],
    response: type({ approved: 'boolean' }),
    next: ({ response }) => (response.approved ? 'cms-setup' : 'recommend'),
  })

  .step('cms-setup', {
    prompt: ({ refs }) => [
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
    response: type({ choice: "'done' | 'help'" }),
    next: ({ response, attempts }) => {
      if (response.choice === 'done') return 'plan';
      if (attempts >= 3) return 'plan';
      return 'cms-setup';
    },
  })

  .step('plan', {
    prompt: ({ store, refs }) => {
      const refSections: Array<{ label: string; content: string }> = [
        {
          label: 'Environment Variables',
          content: refs.load('env-var-spec.md'),
        },
        {
          label: 'Provider Patterns',
          content: refs.load('provider-patterns.md'),
        },
        {
          label: 'Rendering Pipeline',
          content: refs.load('rendering-pipeline.md'),
        },
      ];

      if (store.setup?.architecture === 'hybrid-ssr') {
        refSections.push({
          label: 'Middleware Patterns',
          content: refs.load('middleware-patterns.md'),
        });
        refSections.push({
          label: 'SSR Guide',
          content: refs.load('ssr-guide.md'),
        });
      }

      refSections.push({
        label: 'Analytics & Preview',
        content: refs.load('analytics-and-preview.md'),
      });
      refSections.push({
        label: 'Implementation Examples',
        content: refs.load('implementation-examples.md'),
      });

      const steps = [
        `📦 Install packages: ${store.setup?.sdkChoice === 'ninetailed' ? '@ninetailed/experience.js + plugins' : '@contentful/optimization SDK packages'}`,
        '🔑 Configure environment variables with placeholder values',
        '🔌 Add provider wrapper to the appropriate layout/app file',
        '🧩 Wire components with Experience/Personalize wrappers and update component mapper',
        ...(store.setup?.architecture === 'hybrid-ssr'
          ? ['⚡ Set up middleware with preflight, cookie management, and matcher config']
          : []),
        ...(store.setup?.architecture !== 'server-only' ? ['📊 Configure analytics/insights plugin'] : []),
        '✅ Verify setup and fix any issues',
      ];

      return [
        prompt`
          Review the implementation plan below and present it to the user for approval.
          Expand each step with specific file paths based on what was found during exploration.
          Be concrete — name the actual files that will be created or modified.

          Package installation is derived automatically from the selected SDK,
          framework, and architecture. Do NOT ask to install specific package names
          and do NOT include package lists in your response.

          Do NOT begin implementing. This is the planning step only.

          ${render.kv({
            SDK: store.setup?.sdkChoice ?? 'TBD',
            Architecture: store.setup?.architecture ?? 'TBD',
            Framework: `${store.project.framework} (${store.project.routerType} router)`,
          })}

          ## Reference Material
          ${refSections.map((r) => `### ${r.label}\n${r.content}`).join('\n\n---\n\n')}
        `,
        act.plan({
          summary: `Implement ${store.setup?.sdkChoice} personalization with ${store.setup?.architecture} architecture`,
          steps,
        }),
      ];
    },
    response: type({
      approved: 'boolean',
      envVars: 'Record<string, string>',
      plan: 'string',
    }),
    save: ({ response }) => ({
      setup: {
        envVars: response.envVars,
      },
    }),
    next: ({ response }) => (response.approved ? 'confirm-install' : 'recommend'),
  })

  .step('confirm-install', {
    prompt: ({ store }) => {
      const packages = getDerivedPackages(store);
      const { command } = buildInstallCommand(
        getInstallPackageManager(store.project?.packages?.packageManager),
        packages,
      );

      return [
        'Present the install details below, then ask the user to approve the exact install command. Do not change the package list.',
        view('Package Install', [
          render.kv({
            SDK: store.setup?.sdkChoice ?? 'unknown',
            Architecture: store.setup?.architecture ?? 'unknown',
            Framework: `${store.project.framework} (${store.project.routerType} router)`,
            'Package manager': getInstallPackageManager(store.project?.packages?.packageManager),
          }),
          `Packages: ${packages.map((name) => `\`${name}\``).join(', ')}`,
          `Exact command: \`${command}\``,
        ].join('\n\n')),
        act.confirm({
          message: 'Run this exact package install command?',
          defaultAnswer: 'yes',
        }),
      ];
    },
    response: type({ approved: 'boolean' }),
    next: ({ response }) => (response.approved ? 'install' : 'plan'),
  })

  .step('install', {
    action: {
      mapInput: ({ store }) => ({
        projectPath: store.project?.projectPath ?? '.',
        packages: getDerivedPackages(store),
        packageManager: getInstallPackageManager(store.project?.packages?.packageManager),
      }),
      run: installPackages,
    },
    next: 'write-env',
  })

  .step('write-env', {
    action: {
      mapInput: ({ store }) => ({
        projectPath: store.project?.projectPath ?? '.',
        variables: store.setup?.envVars ?? {},
        fileName: '.env.local',
      }),
      run: writeEnvFile,
    },
    next: 'implement',
  })

  .step('implement', {
    prompt: ({ store, system, refs }) => {
      const refSections: Array<{ label: string; content: string }> = [
        {
          label: 'Provider Patterns',
          content: refs.load('provider-patterns.md'),
        },
        {
          label: 'Rendering Pipeline',
          content: refs.load('rendering-pipeline.md'),
        },
        {
          label: 'Component Patterns',
          content: refs.load('component-patterns.md'),
        },
      ];

      if (store.setup?.architecture === 'hybrid-ssr') {
        refSections.push({
          label: 'Middleware Patterns',
          content: refs.load('middleware-patterns.md'),
        });
      }

      if (store.setup?.sdkChoice === 'ninetailed') {
        refSections.push({
          label: 'SDK Reference (Legacy)',
          content: refs.load('sdk-legacy-guide.md'),
        });
      } else {
        refSections.push({
          label: 'SDK Reference (Modern)',
          content: refs.load('sdk-next-guide.md'),
        });
      }

      refSections.push({
        label: 'Implementation Examples',
        content: refs.load('implementation-examples.md'),
      });

      return [
        system`Work through each checklist item methodically. After completing each one, update its status. Adapt all code to match the project's existing style — do not introduce a different coding style.`,
        prompt`
          Implement the personalization setup for this project.

          ${render.kv({
            SDK: store.setup?.sdkChoice ?? 'unknown',
            Architecture: store.setup?.architecture ?? 'unknown',
            Framework: `${store.project.framework} (${store.project.routerType} router)`,
          })}

          Work through the checklist below. For each item, read the relevant
          reference material, make the code changes, then mark it complete.

          Do NOT ask the user questions during implementation.
          If you hit an ambiguous decision, use the reference material to make the best choice.

          ## Reference Material
          ${refSections.map((r) => `### ${r.label}\n${r.content}`).join('\n\n---\n\n')}
        `,
        act.checklist({
          create: [
            { title: '🔌 Provider wrapper setup', status: 'pending' as const },
            {
              title: '🧩 Component wiring (Experience/Personalize wrappers)',
              status: 'pending' as const,
            },
            ...(store.setup?.architecture === 'hybrid-ssr'
              ? [
                  {
                    title: '⚡ Middleware (preflight, cookies, matcher)',
                    status: 'pending' as const,
                  },
                ]
              : []),
            {
              title: '📊 Analytics plugin configuration',
              status: 'pending' as const,
            },
            {
              title: '🔄 Rendering pipeline adjustments',
              status: 'pending' as const,
            },
          ],
        }),
      ];
    },
    response: type({
      filesModified: 'string[]',
      summary: 'string',
    }),
    next: 'verify',
  })

  .step('verify', {
    prompt: ({ store, refs }) => prompt`
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

        ## Reference: Common Errors
        ${refs.load('common-errors.md')}

        Project path: ${store.project.projectPath}
      `,
    action: {
      run: validateSetup,
    },
    save: ({ actionResult }) => ({
      step: actionResult,
    }),
    next: ({ actionResult, attempts }) => {
      if (actionResult?.overallStatus === 'pass') return 'report';
      if (attempts >= 3) return 'report';
      return 'fix';
    },
  })

  .step('fix', {
    prompt: ({ store, refs }) => prompt`
        Fix the issues found during verification. Work through them systematically:

        ## Fix Strategy

        - **Package issues** → Use the installPackages action
        - **Env var issues** → Use the writeEnvFile action
        - **Code issues** (provider, components, middleware) → Edit files directly
        - **Configuration issues** (include depth, matcher) → Edit config files

        For each fix, explain briefly what was wrong and what you changed.
        After all fixes, the setup will be re-verified automatically.

        ${render.kv({
          Framework: store.project.framework,
          Project: store.project.projectPath,
        })}

        ## Reference: Common Errors & Fixes
        ${refs.load('common-errors.md')}
      `,
    next: 'verify',
  })

  .step('report', {
    prompt: ({ store }) => {
      const sections: string[] = [];
      sections.push('# 🎉 Personalization Setup Complete\n');

      const implementResult = store.steps.implement;
      if (implementResult?.summary) {
        sections.push(render.section('📝 What Was Done', implementResult.summary));
        if ((implementResult.filesModified?.length ?? 0) > 0) {
          sections.push(
            render.section(
              '📁 Files Modified',
              render.table(
                implementResult.filesModified.map((f: string) => ({ File: f })),
                { columns: ['File'] },
              ),
            ),
          );
        }
      }

      sections.push(
        render.section(
          '⚙️ Configuration',
          render.kv({
            SDK: store.setup?.sdkChoice === 'ninetailed' ? '@ninetailed/experience.js' : '@contentful/optimization',
            Architecture: store.setup?.architecture ?? 'unknown',
            Framework: `${store.project.framework} (${store.project.routerType})`,
          }),
        ),
      );

      const verifyResult = store.steps.verify;
      if (verifyResult?.overallStatus) {
        const statusIcon =
          verifyResult.overallStatus === 'pass' ? '✅' : verifyResult.overallStatus === 'warn' ? '⚠️' : '❌';
        sections.push(
          render.section(
            `🔍 Verification: ${statusIcon} ${verifyResult.overallStatus.toUpperCase()}`,
            verifyResult.summary ?? '',
          ),
        );
      }

      sections.push(
        render.section(
          '🚀 Next Steps',
          [
            '1. **Create experiences** — Open the Personalization app in Contentful and create your first audience + experience',
            '2. **Publish content** — Add personalization variants to your content entries',
            '3. **Test in preview** — Use preview mode to verify experiences render correctly',
            '4. **Go live & monitor** — Publish and watch analytics for experiment results',
          ].join('\n'),
        ),
      );

      return [
        'Present the setup completion report below to the user exactly as rendered. Add a brief, celebratory closing message.',
        view('Setup Report', sections.join('\n\n')),
      ];
    },
    next: terminal,
  })

  .build();
