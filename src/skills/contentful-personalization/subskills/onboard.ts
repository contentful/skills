import { skill, type, prompt, render, act, view, terminal } from '@contentful/skill-kit';
import { checkPackages } from '../actions/check-packages.js';
import { checkApiConnectivity } from '../actions/check-api.js';
import { checkOptimizationDoctor } from '../actions/check-optimization-doctor.js';
import { surveyContent } from '../actions/survey-content.js';
import { validateLocalSetup } from '../actions/validate-local-setup.js';
import { buildInstallCommand, derivePackagesToInstall, installPackages } from '../actions/install-packages.js';
import { writeEnvFile } from '../actions/write-env-file.js';
import { getOptimizationReferenceFiles } from '../optimization-references.js';
import {
  PackagesResult,
  ReadinessStatus,
  ValidationSummary,
  type PackagesResult as PackagesResultData,
  type ValidationStageEvidence,
} from '../schemas.js';
import { VERSION } from '../version.js';
import {
  aggregateLiveEventsEvidence,
  buildLiveEventsUrl,
  cmsGraphEvidence,
  connectivityEvidence,
  localSetupEvidence,
  liveEventsDeltaRows,
  manualRuntimeEvidence,
} from '../validation/evidence.js';
import {
  CredentialReviewResponse,
  credentialReviewPrompt,
  managementTokenSource,
  optimizationDoctorRequestRows,
} from '../validation/credentials.js';
import {
  deriveValidationFinalState,
  describeValidationFinalState,
  getEvidenceRerunStages,
} from '../validation/policy.js';

export { buildLiveEventsUrl } from '../validation/evidence.js';

export function hasInventoriedOutcomeScenario(scenario?: {
  kind: 'all-visitors' | 'existing-targeted' | 'preview-only' | 'fixture-needed' | 'unavailable';
}): boolean {
  return scenario !== undefined && scenario.kind !== 'fixture-needed' && scenario.kind !== 'unavailable';
}

type InstallableFramework =
  | 'nextjs-app'
  | 'nextjs-pages'
  | 'nextjs-hybrid'
  | 'gatsby'
  | 'remix'
  | 'react'
  | 'react-native'
  | 'other';

type SdkChoice = 'ninetailed' | 'optimization';

function getInstallableFramework(framework: string): InstallableFramework {
  if (
    framework === 'nextjs-app' ||
    framework === 'nextjs-pages' ||
    framework === 'nextjs-hybrid' ||
    framework === 'gatsby' ||
    framework === 'remix' ||
    framework === 'react' ||
    framework === 'react-native'
  ) {
    return framework;
  }

  return 'other';
}

function getInstallPackageManager(packageManager: PackagesResultData['packageManager'] | undefined) {
  return packageManager === 'unknown' || !packageManager ? 'npm' : packageManager;
}

// Summarize which personalization SDK (if any) is already installed, so the recommendation
// can distinguish a new recommended setup from maintenance of an existing legacy deployment.
function describeInstalledSdk(packages?: {
  packages?: {
    ninetailed?: ReadonlyArray<{ name?: string } | undefined>;
    optimization?: ReadonlyArray<{ name?: string } | undefined>;
  };
}): string {
  const names = (list: ReadonlyArray<{ name?: string } | undefined> | undefined): string[] =>
    (list ?? []).map((p) => p?.name).filter((n): n is string => !!n);
  const ninetailed = names(packages?.packages?.ninetailed);
  const optimization = names(packages?.packages?.optimization);
  if (ninetailed.length > 0 && optimization.length > 0) {
    return 'Both @ninetailed/experience.js AND @contentful/optimization packages are present — treat @contentful/optimization as the active default and inspect legacy usage only where the older deployment is still being maintained or migrated.';
  }
  if (optimization.length > 0) {
    return `Already using the recommended @contentful/optimization SDK (${optimization.join(', ')}). Continue with this SDK.`;
  }
  if (ninetailed.length > 0) {
    return `Already using the legacy @ninetailed/experience.js SDK (${ninetailed.join(', ')}). It is valid to repair or extend this existing deployment in place. For a new integration or an intentional migration, recommend @contentful/optimization and state the migration scope separately.`;
  }
  return 'No personalization SDK is installed yet — this is a greenfield choice, so recommend @contentful/optimization.';
}

export function resolveRecommendedSdkChoice({
  requestedChoice,
  framework,
  packages,
  maintainsExistingLegacyDeployment,
}: {
  requestedChoice: SdkChoice;
  framework: string;
  packages?: {
    packages?: {
      ninetailed?: ReadonlyArray<unknown>;
      optimization?: ReadonlyArray<unknown>;
    };
  };
  maintainsExistingLegacyDeployment: boolean;
}): SdkChoice {
  const hasLegacySdk = (packages?.packages?.ninetailed?.length ?? 0) > 0;

  if (
    requestedChoice === 'ninetailed' &&
    framework !== 'react-native' &&
    hasLegacySdk &&
    maintainsExistingLegacyDeployment
  ) {
    return 'ninetailed';
  }

  return 'optimization';
}

function getDerivedPackages(store: {
  project: { framework: string; packages?: { packageManager?: PackagesResultData['packageManager'] } };
  setup?: {
    sdkChoice?: 'ninetailed' | 'optimization';
    architecture?: 'client-only' | 'hybrid-ssr' | 'server-only';
  };
}) {
  return derivePackagesToInstall({
    sdkChoice: store.setup?.sdkChoice ?? 'optimization',
    framework: getInstallableFramework(store.project.framework),
    architecture: store.setup?.architecture ?? 'client-only',
  });
}

export default skill({
  name: 'onboard',
  version: VERSION,
  description:
    'Default workflow for implementing, setting up, or enabling Contentful personalization ' +
    'project-wide, including when the existing setup state is unknown. Explores the codebase, ' +
    'checks readiness, chooses SDK and architecture, installs packages, implements, and validates. ' +
    'Use extend-existing only for a scoped change to an explicitly working integration.',
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
    prompt: ({ params }) => prompt`
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

      `,
    response: type({
      framework:
        "'nextjs-app' | 'nextjs-pages' | 'nextjs-hybrid' | 'gatsby' | 'remix' | 'react' | 'react-native' | 'other'",
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
      const installedSdkNote = describeInstalledSdk(store.project.packages);

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

          ## Installed personalization SDK
          ${installedSdkNote}

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
      const installedSdkNote = describeInstalledSdk(store.project.packages);
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

          ## Installed personalization SDK
          ${installedSdkNote}

          Apply this product policy:

          - \`@contentful/optimization\` is the recommended default for every new setup.
          - Choose \`ninetailed\` only to debug, repair, or extend a detected existing
            \`@ninetailed/experience.js\` deployment.
          - Do not recommend a fresh legacy installation, including for Pages Router, SSR, plugin
            availability, or familiarity with older examples.
          - If an existing legacy project is intentionally migrating, recommend \`optimization\`
            and name the migration cost explicitly. Do not make migration a prerequisite for an
            urgent repair or a scoped extension of the existing deployment.
          - Set \`maintainsExistingLegacyDeployment\` to true only when the requested change acts
            on the detected Ninetailed integration itself. An unrelated new integration in the
            same repository is not legacy maintenance.

          ## Your two decisions

          **SDK choice:**
          - \`optimization\` — @contentful/optimization (recommended default; runtime-specific APIs)
          - \`ninetailed\` — @ninetailed/experience.js (maintenance of detected legacy deployments only)

          **Architecture:**
          - \`client-only\` — All personalization runs in the browser
          - \`hybrid-ssr\` — Server-side preflight + client hydration
          - \`server-only\` — Full server-side personalization (advanced)

          React Native is a fixed exception: choose \`optimization\` with \`client-only\` because
          this installer does not apply the legacy browser SDK or server-only architectures to a
          native application.

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
      maintainsExistingLegacyDeployment: 'boolean',
      reasoning: 'string',
    }),
    save: ({ response, store }) => ({
      setup: {
        sdkChoice: resolveRecommendedSdkChoice({
          requestedChoice: response.sdkChoice,
          framework: store.project.framework,
          packages: store.project.packages,
          maintainsExistingLegacyDeployment: response.maintainsExistingLegacyDeployment,
        }),
        architecture: store.project.framework === 'react-native' ? 'client-only' : response.architecture,
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
              ? '@ninetailed/experience.js (existing legacy deployment)'
              : '@contentful/optimization (recommended default)',
          Architecture:
            store.setup?.architecture === 'client-only'
              ? 'Client-only (browser-side personalization)'
              : store.setup?.architecture === 'hybrid-ssr'
                ? 'Hybrid SSR (server evaluation + browser takeover)'
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

        Before the walkthrough, mention that the runtime setup needs a Delivery API token and
        Optimization SDK credential. A Preview API token and a server-only Management token are
        optional, but having them available in the project or process environment makes draft
        graph checks and automated Live Events validation much smoother. Do not request either
        optional token and never suggest exposing a Management token through a public env prefix.

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
      const isOptimization = store.setup?.sdkChoice === 'optimization';
      const refSections: Array<{ label: string; content: string }> = [
        {
          label: 'Environment Variables',
          content: refs.load('env-var-spec.md'),
        },
      ];

      if (isOptimization) {
        getOptimizationReferenceFiles({
          framework: store.project.framework,
          routerType: store.project.routerType,
          architecture: store.setup?.architecture,
        }).forEach((file) => {
          refSections.push({
            label: file === 'optimization-shared.md' ? 'Shared SDK Contract' : 'Runtime SDK Contract',
            content: refs.load(file),
          });
        });
      } else {
        refSections.push(
          {
            label: 'Provider Patterns',
            content: refs.load('provider-patterns.md'),
          },
          {
            label: 'Rendering Pipeline',
            content: refs.load('rendering-pipeline.md'),
          },
        );

        if (store.setup?.architecture === 'hybrid-ssr') {
          refSections.push(
            {
              label: 'Middleware Patterns',
              content: refs.load('middleware-patterns.md'),
            },
            {
              label: 'SSR Guide',
              content: refs.load('ssr-guide.md'),
            },
          );
        }

        refSections.push(
          {
            label: 'Analytics & Preview',
            content: refs.load('analytics-and-preview.md'),
          },
          {
            label: 'Implementation Examples',
            content: refs.load('implementation-examples.md'),
          },
        );
      }

      const steps = isOptimization
        ? [
            '📦 Install the application-facing Optimization SDK package',
            '🔑 Configure environment variables with placeholder values',
            '🔌 Create one runtime root or process-level factory at the correct boundary',
            '🧩 Fetch and resolve one Contentful entry with baseline fallback',
            ...(store.setup?.architecture === 'hybrid-ssr'
              ? ['⚡ Wire server evaluation, request continuity, and browser takeover']
              : []),
            '🧭 Connect consent, identity, and page or screen tracking',
            '✅ Verify accepted events, profile continuity, selected variants, and fallback',
          ]
        : [
            '📦 Install any missing packages for the existing @ninetailed/experience.js deployment',
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
        view(
          'Package Install',
          [
            render.kv({
              SDK: store.setup?.sdkChoice ?? 'unknown',
              Architecture: store.setup?.architecture ?? 'unknown',
              Framework: `${store.project.framework} (${store.project.routerType} router)`,
              'Package manager': getInstallPackageManager(store.project?.packages?.packageManager),
            }),
            `Packages: ${packages.map((name) => `\`${name}\``).join(', ')}`,
            `Exact command: \`${command}\``,
          ].join('\n\n'),
        ),
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
    next: 'validate-prerequisites',
  })

  .step('validate-prerequisites', {
    action: {
      mapInput: ({ store }) => ({ projectPath: store.project?.projectPath ?? '.' }),
      run: validateLocalSetup,
    },
    next: ({ actionResult }) => (actionResult?.status === 'pass' ? 'implement' : 'fix-prerequisites'),
  })

  .step('fix-prerequisites', {
    prompt: ({ store }) => prompt`
      The package installation and environment checkpoint found blocking local issues.
      Fix only those package, environment, or credential-exposure problems now, before editing
      the personalization implementation. Do not begin the main implementation yet.

      Project: ${store.project.projectPath}

      Findings:
      ${render.table(
        (store.steps['validate-prerequisites']?.findings ?? []).map((finding) => ({
          Check: finding.item,
          Status: finding.status,
          Detail: finding.detail,
        })),
        { columns: ['Check', 'Status', 'Detail'] },
      )}
    `,
    next: 'validate-prerequisites',
  })

  .step('implement', {
    prompt: ({ store, system, refs }) => {
      const isOptimization = store.setup?.sdkChoice === 'optimization';
      const refSections: Array<{ label: string; content: string }> = [];

      if (isOptimization) {
        getOptimizationReferenceFiles({
          framework: store.project.framework,
          routerType: store.project.routerType,
          architecture: store.setup?.architecture,
        }).forEach((file) => {
          refSections.push({
            label: file === 'optimization-shared.md' ? 'Shared SDK Contract' : 'Runtime SDK Contract',
            content: refs.load(file),
          });
        });
      } else {
        refSections.push(
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
        );

        if (store.setup?.architecture === 'hybrid-ssr') {
          refSections.push({
            label: 'Middleware Patterns',
            content: refs.load('middleware-patterns.md'),
          });
        }

        refSections.push(
          {
            label: 'Existing Legacy Deployment Reference',
            content: refs.load('sdk-legacy-guide.md'),
          },
          {
            label: 'Implementation Examples',
            content: refs.load('implementation-examples.md'),
          },
        );
      }

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
          create: isOptimization
            ? [
                { title: '🔌 Runtime root or factory setup', status: 'pending' as const },
                {
                  title: '🧩 Managed or manual OptimizedEntry wiring',
                  status: 'pending' as const,
                },
                ...(store.setup?.architecture === 'hybrid-ssr'
                  ? [
                      {
                        title: '⚡ Server evaluation and browser takeover',
                        status: 'pending' as const,
                      },
                    ]
                  : []),
                {
                  title: '🧭 Consent, identity, and route tracking',
                  status: 'pending' as const,
                },
                {
                  title: '✅ Accepted-event and baseline-fallback verification',
                  status: 'pending' as const,
                },
              ]
            : [
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
    next: 'verify-code',
  })

  .step('verify-code', {
    prompt: ({ store, refs }) => prompt`
      Validate the implementation you just made. Use the project's own non-destructive commands
      when available: build, typecheck, tests, and lint. Also inspect the changed code against the
      SDK checklist below. Do not fix failures in this step; report them precisely so the next step
      can repair them.

      Required static checks:
      - exactly one SDK runtime owner at the correct boundary
      - correct runtime-specific package and factory/provider
      - environment variables flow into the intended server or browser runtime without exposing CMA credentials
      - content fetching preserves locale and resolves experience/variant links
      - page or screen tracking has one owner
      - baseline fallback remains valid when no optimization is selected

      Project path: ${store.project.projectPath}

      Common failure reference:
      ${refs.load('common-errors.md')}
    `,
    response: type({
      projectPath: 'string',
      status: "'pass' | 'fail'",
      summary: 'string',
      checksRun: 'string[]',
      failures: 'string[]',
    }),
    next: ({ response }) => (response.status === 'pass' ? 'verify' : 'fix'),
  })

  .step('verify', {
    action: {
      mapInput: ({ store }) => ({
        projectPath: store.project?.projectPath ?? '.',
      }),
      run: validateLocalSetup,
    },
    next: ({ actionResult }) => (actionResult?.status === 'pass' ? 'review-credentials' : 'fix'),
  })

  .step('review-credentials', {
    prompt: ({ store }) => credentialReviewPrompt(store.steps.verify?.credentials),
    response: CredentialReviewResponse,
    next: ({ response }) =>
      response.choice === 'rescan'
        ? 'verify'
        : response.choice === 'manual-only'
          ? 'runtime-validation'
          : 'check-connectivity',
  })

  .step('check-connectivity', {
    action: {
      mapInput: ({ store }) => ({
        ...(store.steps.verify?.credentials?.personalization?.apiKey
          ? { apiKey: store.steps.verify.credentials.personalization.apiKey }
          : {}),
        ninetailedEnvironment: store.steps.verify?.credentials?.personalization?.environment ?? 'main',
        ...(store.steps.verify?.credentials?.optimization?.clientId
          ? { optimizationClientId: store.steps.verify.credentials.optimization.clientId }
          : {}),
        optimizationEnvironment: store.steps.verify?.credentials?.optimization?.environment ?? 'main',
      }),
      run: checkApiConnectivity,
    },
    next: 'survey-content',
  })

  .step('survey-content', {
    action: {
      mapInput: ({ store }) => ({
        spaceId: store.steps.verify?.credentials?.contentful?.spaceId ?? '',
        environment: store.steps.verify?.credentials?.contentful?.environment ?? 'master',
        ...(store.steps.verify?.credentials?.contentful?.accessToken
          ? { accessToken: store.steps.verify.credentials.contentful.accessToken }
          : {}),
        ...(store.steps.verify?.credentials?.contentful?.previewToken
          ? { previewToken: store.steps.verify.credentials.contentful.previewToken }
          : {}),
      }),
      run: surveyContent,
    },
    next: 'verify-live-events',
  })

  .step('verify-live-events', {
    action: {
      mapInput: ({ store }) => {
        const credentials = store.steps.verify?.credentials?.contentful;
        const spaceId = credentials?.spaceId ?? '';
        const environmentId = credentials?.environment ?? 'master';
        const managementToken = credentials?.managementToken;

        return {
          spaceId,
          environmentId,
          ...(managementToken ? { managementToken } : {}),
          ...(managementTokenSource(store.steps.verify?.credentials)
            ? { managementTokenSource: managementTokenSource(store.steps.verify?.credentials) }
            : {}),
        };
      },
      run: checkOptimizationDoctor,
    },
    next: 'runtime-validation',
  })

  .step('runtime-validation', {
    prompt: ({ store }) => {
      const result = store.steps['verify-live-events'];
      const credentials = store.steps.verify?.credentials?.contentful;
      const spaceId = credentials?.spaceId;
      const environmentId = credentials?.environment ?? 'master';
      const liveEventsUrl = buildLiveEventsUrl(spaceId, environmentId);
      const findings = result?.findings ?? [];
      const scenario = store.steps['survey-content']?.testScenario;

      const statusMessage = !result
        ? 'Automated API validation was skipped by request. Use the Live Events view for manual runtime evidence.'
        : result.status === 'pass'
          ? 'Recent events exist in the space-wide 15-minute window. Treat this only as a baseline: it is not yet correlated to this validation run.'
          : result?.status === 'warn'
            ? 'The endpoint is reachable, but it has not observed any events in the last 15 minutes.'
            : result?.status === 'skip'
              ? 'The automated live-event check was skipped because no management token was available.'
              : 'The automated live-event check failed. Compare the masked credential, source, and target below, then use Live Events as independent runtime evidence.';

      const requestRows = optimizationDoctorRequestRows(result);
      const sections = [
        statusMessage,
        requestRows.length > 0
          ? render.section('Automated Live Events request', render.table(requestRows, { columns: ['Field', 'Value'] }))
          : '',
        findings.length > 0
          ? render.table(
              findings.map((finding) => ({
                Check: finding.item,
                Status: finding.status,
                Detail: finding.detail,
              })),
              { columns: ['Check', 'Status', 'Detail'] },
            )
          : '*No automated live-event findings are available.*',
        liveEventsUrl
          ? `[Open Contentful Live Events](${liveEventsUrl})`
          : 'Open the Contentful Personalization app and navigate to **Analytics → Live Events**.',
        scenario
          ? render.kv({
              'Suggested scenario': scenario.kind,
              Experience: scenario.experienceName ?? scenario.experienceId ?? 'none',
              Audience:
                scenario.audienceName ??
                scenario.audienceId ??
                (scenario.kind === 'all-visitors' ? 'All visitors' : 'unknown'),
              Guidance: scenario.summary,
            })
          : 'No CMS scenario inventory is available.',
        scenario?.kind === 'fixture-needed'
          ? [
              '**To enable deterministic end-to-end validation:**',
              '1. In the Contentful Personalization app, create a test audience with an explicit query-parameter condition such as `ctfl_personalization_test=<unique-value>`.',
              '2. Create one obvious variant and attach the experience to a known baseline entry.',
              '3. Publish dependencies in order: variant, audience, experience, then the baseline entry.',
              '4. Return here and choose **Fixture published — resurvey CMS** before claiming an outcome.',
            ].join('\n')
          : scenario?.kind === 'unavailable'
            ? 'CMS requests were unavailable, so this workflow cannot conclude that the space is empty. Fix API access or use a known scenario, and do not claim an inventoried outcome from this survey.'
            : '',
        [
          '1. Enable streaming in Live Events.',
          '2. Open the application at the known baseline route. Use a query parameter only when that existing audience is actually authored for it.',
          '3. Confirm a page event for this run.',
          '4. When a usable experience exists, confirm the expected audience or all-visitors experience, selected variant, and rendered entry metadata.',
          '5. Grant consent, navigate, or interact only when you intend those side effects.',
        ].join('\n'),
      ];

      const hasInventoriedOutcome = hasInventoriedOutcomeScenario(scenario);
      const automatedApiChecksRan = result !== undefined || store.steps['survey-content'] !== undefined;
      const needsCmsSurvey = !hasInventoriedOutcome && automatedApiChecksRan;
      const validationOptions = [
        ...(hasInventoriedOutcome
          ? [
              {
                value: 'confirmed-end-to-end',
                label: '✅ Variant confirmed end to end',
                description:
                  'A correlated page event, expected experience or audience, selected variant, and rendered result were confirmed',
              },
            ]
          : []),
        ...(needsCmsSurvey
          ? [
              {
                value: 'resurvey-content',
                label:
                  scenario?.kind === 'fixture-needed'
                    ? '🧩 Fixture published — resurvey CMS'
                    : '🔄 Retry CMS inventory',
                description:
                  scenario?.kind === 'fixture-needed'
                    ? 'Inventory the newly authored audience, experience, variants, and baseline link before validation'
                    : 'Retry the GET-only inventory before claiming a CMS-backed outcome',
              },
            ]
          : []),
        {
          value: 'confirmed-transport',
          label: '📡 Page event confirmed',
          description: 'Runtime transport works, but no specific personalization outcome could be confirmed',
        },
        ...(result
          ? [
              {
                value: 'check-again',
                label: '🔄 I triggered traffic — compare counts',
                description: 'Rerun the optional automated Live Events endpoint after the baseline snapshot',
              },
            ]
          : []),
        {
          value: 'unavailable',
          label: '⏸️ Cannot validate now',
          description: 'Choose whether live validation is deferred or blocked in the next step',
        },
      ];

      return [
        prompt`
          Present the runtime verification instructions below exactly as rendered, then ask how to
          proceed. If the automated check returned HTTP 401, state only that the endpoint rejected
          the exact request shown. Do not say the token is expired, incorrectly scoped, or missing
          access unless separate evidence establishes that diagnosis.
        `,
        view('📡 Runtime Verification', sections.join('\n\n')),
        act.askUser({
          type: 'structured',
          question: 'How far did the live validation get?',
          options: validationOptions,
        }),
      ];
    },
    response: type({
      choice: "'confirmed-end-to-end' | 'confirmed-transport' | 'check-again' | 'resurvey-content' | 'unavailable'",
    }),
    next: ({ response, store }) => {
      const scenario = store.steps['survey-content']?.testScenario;
      const hasInventoriedOutcome = hasInventoriedOutcomeScenario(scenario);
      if (response.choice === 'confirmed-end-to-end' && !hasInventoriedOutcome) return 'runtime-validation';
      if (response.choice === 'resurvey-content') return 'survey-content';
      return response.choice === 'check-again'
        ? 'verify-live-events-after'
        : response.choice === 'unavailable'
          ? 'validation-disposition'
          : 'report';
    },
  })

  .step('verify-live-events-after', {
    action: {
      mapInput: ({ store }) => {
        const credentials = store.steps.verify?.credentials;
        return {
          spaceId: credentials?.contentful?.spaceId ?? '',
          environmentId: credentials?.contentful?.environment ?? 'master',
          ...(credentials?.contentful?.managementToken
            ? { managementToken: credentials.contentful.managementToken }
            : {}),
          ...(managementTokenSource(credentials) ? { managementTokenSource: managementTokenSource(credentials) } : {}),
        };
      },
      run: checkOptimizationDoctor,
    },
    next: 'runtime-confirmation',
  })

  .step('runtime-confirmation', {
    prompt: ({ store }) => {
      const before = store.steps['verify-live-events']?.liveEvents;
      const after = store.steps['verify-live-events-after']?.liveEvents;
      const rows = liveEventsDeltaRows(before, after);
      const scenario = store.steps['survey-content']?.testScenario;
      const hasInventoriedOutcome = hasInventoriedOutcomeScenario(scenario);
      const needsCmsSurvey = !hasInventoriedOutcome;

      return [
        prompt`
          Present the before/after aggregate counts below. Explain that a positive delta is useful
          supporting evidence but still needs the user's correlation with the page they just loaded.
          Ask for the strongest result they actually observed; do not infer an outcome from counts.
        `,
        view('Live Events comparison', render.table(rows, { columns: ['Event', 'Baseline', 'Current', 'Delta'] })),
        act.askUser({
          type: 'structured',
          question: 'What did this run confirm?',
          options: [
            ...(hasInventoriedOutcome
              ? [{ value: 'confirmed-end-to-end', label: '✅ Variant confirmed end to end' }]
              : []),
            { value: 'confirmed-transport', label: '📡 Page event confirmed' },
            { value: 'retry', label: '🔄 Try one more run' },
            ...(needsCmsSurvey
              ? [
                  {
                    value: 'resurvey-content',
                    label:
                      scenario?.kind === 'fixture-needed'
                        ? '🧩 Fixture published — resurvey CMS'
                        : '🔄 Retry CMS inventory',
                  },
                ]
              : []),
            { value: 'unavailable', label: '⏸️ Cannot validate now' },
          ],
        }),
      ];
    },
    response: type({
      choice: "'confirmed-end-to-end' | 'confirmed-transport' | 'retry' | 'resurvey-content' | 'unavailable'",
    }),
    next: ({ response, attempts, store }) => {
      const scenario = store.steps['survey-content']?.testScenario;
      const hasInventoriedOutcome = hasInventoriedOutcomeScenario(scenario);
      if (response.choice === 'confirmed-end-to-end' && !hasInventoriedOutcome) return 'runtime-confirmation';
      return response.choice === 'retry' && attempts < 3
        ? 'verify-live-events'
        : response.choice === 'resurvey-content'
          ? 'survey-content'
          : response.choice === 'unavailable'
            ? 'validation-disposition'
            : 'report';
    },
  })

  .step('validation-disposition', {
    prompt: act.askUser({
      type: 'structured',
      question: 'Why is live validation unavailable?',
      options: [
        {
          value: 'defer',
          label: '⏭️ Defer by choice',
          description: 'Implementation can finish while live evidence remains explicitly unresolved',
        },
        {
          value: 'blocked',
          label: '🚧 Authoring or publishing blocked',
          description: 'Permissions, ownership, publishing, or organizational constraints prevent the test',
        },
      ],
    }),
    response: type({ choice: "'defer' | 'blocked'" }),
    next: 'report',
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
    next: 'verify-code',
  })

  .step('report', {
    prompt: ({ store }) => {
      const sections: string[] = [];
      const evidence: ValidationStageEvidence[] = [];

      if (store.steps.verify) {
        const local = localSetupEvidence(store.steps.verify);
        const code = store.steps['verify-code'];
        if (code) {
          local.findings.push({
            item: 'Project build and static wiring',
            status: code.status,
            detail: code.summary,
          });
          local.summary = `${local.summary.replace(/[.!?]+$/, '')}. ${code.summary}`;
          if (code.status === 'fail') local.status = 'fail';
        }
        evidence.push(local);
      }
      if (store.steps['check-connectivity']) {
        evidence.push(connectivityEvidence(store.steps['check-connectivity']));
      }
      if (store.steps['survey-content']) {
        evidence.push(cmsGraphEvidence(store.steps['survey-content']));
      }

      const runtimeChoice =
        store.steps['validation-disposition']?.choice ??
        store.steps['runtime-confirmation']?.choice ??
        store.steps['runtime-validation']?.choice;
      if (runtimeChoice === 'confirmed-end-to-end') {
        evidence.push(...manualRuntimeEvidence('end-to-end', 'full-setup'));
      } else if (runtimeChoice === 'confirmed-transport') {
        evidence.push(...manualRuntimeEvidence('transport-only', 'full-setup'));
      } else if (runtimeChoice === 'defer') {
        evidence.push(...manualRuntimeEvidence('deferred', 'full-setup'));
      } else if (runtimeChoice === 'blocked') {
        evidence.push(...manualRuntimeEvidence('blocked', 'full-setup'));
      } else {
        const aggregate = store.steps['verify-live-events-after'] ?? store.steps['verify-live-events'];
        if (aggregate) evidence.push(aggregateLiveEventsEvidence(aggregate));
        evidence.push({
          stage: 'personalization-outcome',
          status: 'unavailable',
          source: 'manual-confirmation',
          summary: 'No correlated personalization outcome was confirmed.',
          findings: [],
        });
      }

      const decision =
        runtimeChoice === 'blocked'
          ? ('cannot-author-or-trigger' as const)
          : runtimeChoice === 'defer'
            ? ('defer-live-validation' as const)
            : ('continue' as const);
      const finalState = deriveValidationFinalState({ profile: 'full-setup', evidence, decision });
      const finalLabel = describeValidationFinalState(finalState);
      const stateIcon =
        finalState === 'validated-end-to-end'
          ? '✅'
          : finalState === 'validation-failed'
            ? '❌'
            : finalState === 'blocked-by-cms-authoring-or-publishing' ||
                finalState === 'blocked-by-validation-constraints'
              ? '🚧'
              : '⏳';

      sections.push(`# ${stateIcon} ${finalLabel}\n`);

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

      sections.push(
        render.section(
          '🔍 Validation evidence',
          render.table(
            evidence.map((item) => ({
              Stage: item.stage,
              Status: item.status,
              Source: item.source,
              Summary: item.summary,
            })),
            { columns: ['Stage', 'Status', 'Source', 'Summary'] },
          ),
        ),
      );

      const credentials = store.steps.verify?.credentials?.contentful;
      const liveEventsUrl = buildLiveEventsUrl(credentials?.spaceId, credentials?.environment ?? 'master');
      const scenario = store.steps['survey-content']?.testScenario;

      sections.push(
        render.section(
          '🚀 Next Steps',
          [
            liveEventsUrl
              ? `1. [Open Contentful Live Events](${liveEventsUrl}) whenever you resume runtime validation.`
              : '1. Open the Personalization app and navigate to Analytics → Live Events when runtime validation is possible.',
            scenario && scenario.kind !== 'fixture-needed' && scenario.kind !== 'unavailable'
              ? `2. Resume with this CMS scenario: ${scenario.summary}`
              : '2. Inventory a usable published experience or publish the deterministic fixture before outcome validation.',
            finalState === 'validation-failed'
              ? '3. Run the doctor workflow against the failed evidence stage, then rerun that stage and its downstream checks.'
              : finalState === 'blocked-by-cms-authoring-or-publishing'
                ? '3. Resume after the required authoring, publishing, permission, or organizational decision is available.'
                : finalState === 'validated-end-to-end'
                  ? '3. Keep the deterministic validation route and expected IDs documented for future regression checks.'
                  : '3. When practical, confirm a correlated page event, expected experience or audience, selected variant, and rendered result.',
          ].join('\n'),
        ),
      );

      const machineResult = {
        profile: 'full-setup' as const,
        finalState,
        evidence,
        rerunStages: getEvidenceRerunStages('full-setup', evidence),
        summary: finalLabel,
      };

      return [
        'Present the evidence-based setup report below exactly as rendered. Do not describe the setup as fully validated unless the final state says so.',
        view('Setup and validation report', sections.join('\n\n')),
        `After presenting the report, return this exact structured result to the workflow protocol without changing its values:\n${JSON.stringify(machineResult)}`,
      ];
    },
    response: ValidationSummary,
    next: terminal,
  })

  .build();
