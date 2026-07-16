import { skill, type, prompt, render, act, view, terminal } from '@contentful/skill-kit';
import { checkPackages } from '../actions/check-packages.js';
import { scanCredentials } from '../actions/scan-credentials.js';
import { checkApiConnectivity } from '../actions/check-api.js';
import { checkOptimizationDoctor } from '../actions/check-optimization-doctor.js';
import { surveyContent } from '../actions/survey-content.js';
import { validateLocalSetup } from '../actions/validate-local-setup.js';
import { buildInstallCommand, derivePackagesToInstall, installPackages } from '../actions/install-packages.js';
import { writeEnvFile } from '../actions/write-env-file.js';
import { getOptimizationReferenceFiles } from '../optimization-references.js';
import { implementationGuidance, planPresentationGuidance } from '../implementation-guidance.js';
import { finishedApplicationSummary, runtimePresentationInstructions } from '../runtime-presentation.js';
import {
  PackagesResult,
  ReadinessStatus,
  RuntimePresentationResult,
  ValidationSummary,
  type CredentialsScanResult,
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
  manualRuntimeEvidence,
} from '../validation/evidence.js';
import {
  CredentialReviewResponse,
  credentialScansDiffer,
  credentialReviewPrompt,
  detectedCredentialRows,
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

// The credential scan the review should reflect: a user-triggered rescan wins over the initial
// automatic scan, so a corrected environment is shown after "I corrected the environment".
function effectiveScannedCredentials(steps: {
  'scan-credentials'?: CredentialsScanResult;
  'rescan-credentials'?: CredentialsScanResult;
}): CredentialsScanResult | undefined {
  return steps['rescan-credentials'] ?? steps['scan-credentials'];
}

interface ReadinessStatusPresentation {
  icon: string;
  label: string;
  detail: string;
}

function readinessStatusPresentation(readinessStatus: string | undefined): ReadinessStatusPresentation {
  const statusConfig: Record<string, ReadinessStatusPresentation> = {
    ready: { icon: '✅', label: 'Ready', detail: 'All systems go' },
    'minor-changes': { icon: '🟡', label: 'Almost Ready', detail: 'A few small things to address' },
    'needs-work': { icon: '🟠', label: 'Needs Work', detail: 'Moderate changes required before setup' },
    'not-ready': { icon: '🔴', label: 'Not Ready', detail: 'Significant work needed first' },
  };
  return statusConfig[readinessStatus ?? 'not-ready'] ?? statusConfig['not-ready'];
}

// Build the readiness report body shared by the terminal gate and the setup review. Returns
// undefined when no assessment is available so callers can present a fallback message.
function renderReadinessReport(assess?: {
  report?: string;
  readinessStatus?: string;
  prerequisites?: string[];
}): string | undefined {
  if (!assess?.report) return undefined;

  const status = readinessStatusPresentation(assess.readinessStatus);
  const sections: string[] = [
    `# ${status.icon} Readiness Report: ${status.label}\n`,
    `*${status.detail}*\n`,
    '---\n',
    assess.report,
  ];

  if ((assess.prerequisites?.length ?? 0) > 0) {
    sections.push(
      render.section('📋 Prerequisites', assess.prerequisites!.map((p, i) => `${i + 1}. ${p}`).join('\n')),
    );
  }

  return sections.join('\n\n');
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
      'renderingBoundaries?': 'string[]',
      'existingSetup?': "'none' | 'partial' | 'configured'",
      'packages?': PackagesResult,
    }),
    setup: type({
      'sdkChoice?': "'ninetailed' | 'optimization'",
      'architecture?': "'client-only' | 'hybrid-ssr' | 'server-only'",
      'envVars?': 'Record<string, string>',
      // Free-text steering the user gave when rejecting the recommendation or the plan, so the
      // re-prompt can actually change instead of regenerating the same output.
      'choiceFeedback?': 'string',
      'planFeedback?': 'string',
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

        3. **Content rendering boundaries** — Find every shared boundary that turns Contentful
           content into UI: component or block mappers, section or page dispatchers, rich-text
           renderers, and any direct entry renderers. Record the file and the content that passes
           through each boundary. Are components isolated (props in, JSX out) or do they fetch data?

        4. **Rendering pipeline** — Page-level or component-level fetching? SSR, SSG, ISR, client?
           Any existing middleware?

        5. **Existing personalization** — Any NinetailedProvider, Experience components,
           ExperienceMapper, or @contentful/optimization code already present?

        6. **Env var approach** — .env files? Vercel env? Framework-prefixed vars?

        Do not open or read .env files and do not inspect, print, or repeat raw environment
        variable values. You may identify variable names from source code, config, and example
        files. A dedicated credential scanner runs immediately after this step so the workflow can
        present a consistent masked summary before continuing.

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
      renderingBoundaries: 'string[]',
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
        renderingBoundaries: response.renderingBoundaries,
        existingSetup: response.existingSetup,
        packages: actionResult,
      },
    }),
    action: {
      mapInput: ({ response }) => ({ projectPath: response.projectPath }),
      run: checkPackages,
    },
    next: 'scan-credentials',
  })

  .step('scan-credentials', {
    action: {
      mapInput: ({ store }) => ({ projectPath: store.project?.projectPath ?? '.' }),
      run: scanCredentials,
    },
    next: 'assess',
  })

  .step('assess', {
    prompt: ({ store, refs, params }) => {
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
            (store.project.renderingBoundaries?.length ?? 0) > 0
              ? `**Shared rendering boundaries:** ${store.project.renderingBoundaries!.join(', ')}`
              : '**Shared rendering boundaries:** none found',
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

      const readinessOnly = params?.readinessOnly === true || store.steps.explore.readinessOnly;
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

          ${readinessOnly ? 'The user is only asking about readiness, not requesting a full setup. Set readinessOnly to true.' : 'The user asked to set personalization up, not merely to check readiness. Set readinessOnly to false unless the exploration data clearly shows they only wanted a readiness check.'}

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
      return 'review-readiness';
    },
  })

  .step('gate', {
    prompt: ({ store }) => {
      const report = renderReadinessReport(store.steps.assess);
      if (!report) {
        return [
          'Present a brief message explaining that assessment data was unavailable.',
          view('⚠️ No assessment data available. Please re-run the readiness check.'),
        ];
      }

      const readinessStatus = store.steps.assess.readinessStatus;
      const closing =
        readinessStatus === 'ready' || readinessStatus === 'minor-changes'
          ? '\n---\n\n🎉 Your project is ready for personalization! Run this skill again when you want to start setup.'
          : '\n---\n\n💡 Address the items above, then run this skill again to re-check readiness.';

      return [
        'Present the readiness report below to the user exactly as rendered. Add a brief, warm closing sentence.',
        view('Readiness Report', `${report}\n\n${closing}`),
      ];
    },
    next: terminal,
  })

  // First user-facing interaction of a real setup: present the readiness report and the credentials
  // we'll validate with together, so the user is oriented before any decision. Also the natural
  // place to surface a browser-exposed management-token warning early.
  .step('review-readiness', {
    prompt: ({ store }) => {
      const report =
        renderReadinessReport(store.steps.assess) ??
        '# ✅ Readiness Report\n\nExploration completed. Continuing with setup.';
      const scanned = effectiveScannedCredentials(store.steps);
      const credentialRows = detectedCredentialRows(scanned);
      const exposureWarning = scanned?.envVars?.find((variable) => variable.warning)?.warning;

      const credentialsView =
        credentialRows.length > 0
          ? render.table(credentialRows, { columns: ['Credential', 'Variable', 'Value', 'Source'] })
          : '*No credentials were detected yet. You can add them before setup, or continue and skip the automated API checks later.*';

      return [
        prompt`
          This is the first decision point of setup. Present the readiness report and the detected
          credentials below exactly as rendered, in that order. Give a short, warm one-sentence
          orientation before the report (what you found and that you're ready to set personalization
          up), and one sentence between the report and the credential table explaining that these are
          the credentials you'll use for the automated validation checks later. Secret values are
          masked. Do not explain the table columns or add other caveats.
          ${
            exposureWarning
              ? `\nCall out this credential-exposure warning clearly as something to fix: "${exposureWarning}"`
              : ''
          }
          Then ask the user how they'd like to proceed.
        `,
        view(
          '🚦 Readiness & credentials',
          [report, render.section('🔑 Credentials for validation', credentialsView)].join('\n\n'),
        ),
        act.askUser({
          type: 'structured',
          question: 'Ready to set up personalization with these credentials?',
          options: [
            {
              value: 'continue',
              label: '✅ Continue setup',
              description: 'Proceed with these detected credentials for later validation',
            },
            {
              value: 'rescan',
              label: '🔄 I corrected the environment',
              description: 'Rescan credentials before continuing',
            },
            {
              value: 'manual-only',
              label: '⏭️ Continue, skip automated API checks',
              description: 'Set up without automated connectivity and content checks',
            },
          ],
        }),
      ];
    },
    response: CredentialReviewResponse,
    next: ({ response }) => (response.choice === 'rescan' ? 'rescan-credentials' : 'recommend'),
  })

  // Re-scan the environment after the user reports a correction, then return to the review.
  .step('rescan-credentials', {
    action: {
      mapInput: ({ store }) => ({ projectPath: store.project?.projectPath ?? '.' }),
      run: scanCredentials,
    },
    next: 'review-readiness',
  })

  .step('recommend', {
    prompt: ({ store, refs }) => {
      const installedSdkNote = describeInstalledSdk(store.project.packages);
      const priorFeedback = store.setup?.choiceFeedback;
      return prompt`
          Recommend a specific SDK and architecture for this project.
          Explain your reasoning conversationally — help the user understand WHY
          this choice fits their project, not just WHAT the choice is.
          ${
            priorFeedback
              ? `\nThe user rejected the previous recommendation with this feedback — take it into account and address it directly:\n"${priorFeedback}"\n`
              : ''
          }

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
    // Both confirm-choice rejection and a plan-level "revisit the SDK" rewind land here. Bound the
    // re-recommendation loop so repeated back-and-forth moves forward with the last recommendation
    // instead of ping-ponging with confirm-choice or tripping the engine's cycle guard.
    maxVisits: 5,
    onMaxVisits: 'cms-setup',
  })

  .step('confirm-choice', {
    prompt: ({ store }) => [
      prompt`
        Present the SDK and architecture recommendation below, then ask the user
        to confirm. Keep it brief — the reasoning was already explained.
        If the user declines and says why (e.g. they want a different architecture),
        capture their reason verbatim in the \`feedback\` field so the next recommendation
        can address it.

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
    // When the user declines, capture what they said in `feedback` so the next recommendation can
    // respond to it instead of repeating the same choice.
    response: type({ approved: 'boolean', 'feedback?': 'string' }),
    save: ({ response }) => ({
      setup: { choiceFeedback: response.approved ? undefined : (response.feedback ?? '') },
    }),
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
            '🧩 Wrap every compatible shared content-rendering boundary with baseline fallback',
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
            '🧩 Wire every compatible shared content-rendering boundary with Experience/Personalize',
            ...(store.setup?.architecture === 'hybrid-ssr'
              ? ['⚡ Set up middleware with preflight, cookie management, and matcher config']
              : []),
            ...(store.setup?.architecture !== 'server-only' ? ['📊 Configure analytics/insights plugin'] : []),
            '✅ Verify setup and fix any issues',
          ];

      const priorFeedback = store.setup?.planFeedback;

      return [
        prompt`
          Review the implementation plan below and present it to the user for approval.
          Expand each step with specific file paths based on what was found during exploration.
          Be concrete — name the actual files that will be created or modified.
          ${
            priorFeedback
              ? `\nThe user rejected the previous plan with this feedback — revise the plan to address it directly:\n"${priorFeedback}"\n`
              : ''
          }

          ## Plan presentation
          ${planPresentationGuidance()}

          The SDK and architecture were already chosen and approved. If the user's feedback is about
          the plan's approach, revise the plan here. Only if they want to change the SDK or
          architecture itself should they revisit that earlier decision — capture that intent in
          \`revisitChoice\` when they reject.

          Package installation is derived automatically from the selected SDK,
          framework, and architecture. Do NOT ask to install specific package names
          and do NOT include package lists in your response.

          ## Source and scope rules
          ${implementationGuidance({
            sdk: isOptimization ? 'optimization' : 'ninetailed',
            workflowOwnsSetup: true,
          })}

          Do NOT begin implementing. This is the planning step only.

          ${render.kv({
            SDK: store.setup?.sdkChoice ?? 'TBD',
            Architecture: store.setup?.architecture ?? 'TBD',
            Framework: `${store.project.framework} (${store.project.routerType} router)`,
            'Rendering boundaries': store.project.renderingBoundaries?.join(', ') || 'none found',
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
      // On rejection: what the user wants changed, and whether that means revisiting the
      // already-approved SDK/architecture (revisitChoice) rather than just re-planning.
      'feedback?': 'string',
      'revisitChoice?': 'boolean',
    }),
    save: ({ response }) => ({
      setup: {
        envVars: response.envVars,
        ...(response.approved
          ? { planFeedback: undefined }
          : response.revisitChoice
            ? // Revisiting the SDK/architecture: route the note to the recommendation, clear plan note.
              { choiceFeedback: response.feedback ?? '', planFeedback: undefined }
            : { planFeedback: response.feedback ?? '' }),
      },
    }),
    // A rejected plan re-plans by default (keeping the approved SDK/architecture). Only a request to
    // change the SDK/architecture itself rewinds to the recommendation step.
    next: ({ response }) => (response.approved ? 'confirm-install' : response.revisitChoice ? 'recommend' : 'plan'),
    // Bound the re-plan loop so repeated rejections eventually move forward to the install
    // confirmation (which the user still gates) instead of tripping the engine's cycle guard.
    maxVisits: 5,
    onMaxVisits: 'confirm-install',
  })

  .step('confirm-install', {
    prompt: ({ store }) => {
      const packages = getDerivedPackages(store);
      const { command } = buildInstallCommand(
        getInstallPackageManager(store.project?.packages?.packageManager),
        packages,
      );

      return [
        'Present the install details below, then ask the user to approve the exact install command. Approval runs the command through the workflow action, so do not run it yourself before or after advancing. Do not change the package list.',
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
    // Fix blocking local issues, but do not loop forever on something the workflow cannot repair
    // (e.g. a credential exposure the model cannot move). After a few attempts, proceed to the
    // implementation anyway — the later verify step and final report record any residual failure.
    next: ({ actionResult, attempts }) =>
      actionResult?.status === 'pass' ? 'implement' : attempts < 3 ? 'fix-prerequisites' : 'implement',
  })

  .step('fix-prerequisites', {
    prompt: ({ store }) => prompt`
      The package installation and environment checkpoint found blocking local issues.
      Fix only those package, environment, or credential-exposure problems now, before editing
      the personalization implementation. Do not begin the main implementation yet.
      The workflow actions have already attempted package installation and environment-file updates.
      Work only from the findings below; do not repeat a successful action or inspect SDK internals.
      If a finding cannot be resolved from here (for example a credential you cannot access), say so
      briefly rather than retrying the same action — the workflow will continue and record it.

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

          ## Source and scope rules
          ${implementationGuidance({
            sdk: isOptimization ? 'optimization' : 'ninetailed',
            workflowOwnsSetup: true,
          })}

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
                  title: '🧩 OptimizedEntry wiring across compatible rendering boundaries',
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
                  title: '🧩 Rendering-boundary wiring (Experience/Personalize wrappers)',
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
    // Repair static failures, but bound the fix loop: after a few attempts, move on to the local
    // verify action so the run can still reach the runtime steps and report the residual failure
    // instead of looping on an unfixable build/wiring error.
    next: ({ response, attempts }) =>
      response.status === 'pass' ? 'verify' : attempts < 3 ? 'fix' : 'verify',
  })

  .step('verify', {
    action: {
      mapInput: ({ store }) => ({
        projectPath: store.project?.projectPath ?? '.',
      }),
      run: validateLocalSetup,
    },
    next: ({ actionResult, store, attempts }) => {
      // Bound the verify ↔ fix ↔ verify-code triangle. Once local integrity cannot be repaired in
      // a few attempts, proceed to the runtime presentation; the final report captures the failure.
      if (actionResult?.status !== 'pass') return attempts < 3 ? 'fix' : 'present-runtime';
      if (store.steps['review-readiness']?.choice === 'manual-only') return 'present-runtime';
      return credentialScansDiffer(effectiveScannedCredentials(store.steps), actionResult.credentials)
        ? 'review-validation-credentials'
        : 'check-connectivity';
    },
  })

  .step('review-validation-credentials', {
    prompt: ({ store }) => credentialReviewPrompt(store.steps.verify?.credentials),
    response: CredentialReviewResponse,
    next: ({ response }) =>
      response.choice === 'rescan'
        ? 'verify'
        : response.choice === 'manual-only'
          ? 'present-runtime'
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
    next: 'present-runtime',
  })

  .step('present-runtime', {
    prompt: ({ store }) => {
      const credentials = store.steps.verify?.credentials?.contentful;
      const liveEventsUrl = buildLiveEventsUrl(credentials?.spaceId, credentials?.environment ?? 'master');
      const scenario = store.steps['survey-content']?.testScenario;

      return prompt`
        ${runtimePresentationInstructions({
          projectPath: store.project?.projectPath ?? '.',
          packageManager: store.project?.packages?.packageManager ?? 'the detected package manager',
          liveEventsUrl,
          scenario: scenario?.summary ?? 'Use the known baseline route without inventing an audience trigger.',
          evidenceTarget:
            'The finished page, one correlated page event, baseline fallback, and a selected variant when a usable experience exists.',
        })}
      `;
    },
    response: RuntimePresentationResult,
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
      const presentation = store.steps['present-runtime'];

      const requestRows = optimizationDoctorRequestRows(result);
      const canCompareLiveEvents = result?.liveEvents !== undefined;

      const sections = [
        presentation
          ? render.section(
              'Your app is running',
              [
                render.kv({
                  URL: presentation.applicationUrl || 'unavailable',
                  Server: presentation.serverStatus,
                  Browser: presentation.browserStatus,
                  'Live Events': presentation.liveEventsStatus,
                }),
                presentation.summary,
                presentation.checks.length > 0
                  ? `Checks:\n${presentation.checks.map((check) => `- ${check}`).join('\n')}`
                  : '',
                presentation.issues.length > 0
                  ? `Issues:\n${presentation.issues.map((issue) => `- ${issue}`).join('\n')}`
                  : '',
              ]
                .filter(Boolean)
                .join('\n\n'),
            )
          : 'The app has not been opened yet.',
        // A failed automated check is worth showing; a healthy/skipped one is internal plumbing the
        // user does not need to reason about, so keep the happy path free of aggregate jargon.
        result?.status === 'fail'
          ? [
              "⚠️ The optional automated Live Events check couldn't run (details below). This does not block you — you can still verify personalization directly in the browser and the Live Events dashboard.",
              requestRows.length > 0
                ? render.section('Automated check request', render.table(requestRows, { columns: ['Field', 'Value'] }))
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
                : '',
            ]
              .filter(Boolean)
              .join('\n\n')
          : '',
        liveEventsUrl
          ? `**Live Events dashboard:** [open it here](${liveEventsUrl}) — this is where you'll watch events arrive in real time.`
          : 'Open the Contentful Personalization app and go to **Analytics → Live Events** to watch events arrive.',
        scenario && scenario.kind !== 'unavailable' && scenario.kind !== 'fixture-needed'
          ? render.section(
              'What to look for',
              render.kv({
                Experience: scenario.experienceName ?? scenario.experienceId ?? 'none',
                Audience:
                  scenario.audienceName ??
                  scenario.audienceId ??
                  (scenario.kind === 'all-visitors' ? 'All visitors' : 'unknown'),
                How: scenario.summary,
              }),
            )
          : '',
        scenario?.kind === 'fixture-needed'
          ? [
              "**Heads up:** there's no published experience to test against yet, so you can confirm events flow but not that a variant renders. To test a full variant end to end, set up a quick throwaway experience:",
              '1. In the Contentful Personalization app, create a test audience with a query-parameter condition such as `ctfl_personalization_test=<unique-value>`.',
              '2. Create one obvious variant and attach the experience to a known page entry.',
              '3. Publish in order: variant, audience, experience, then the page entry.',
              '4. Come back and choose **I published a test experience** to re-check.',
            ].join('\n')
          : scenario?.kind === 'unavailable'
            ? "The CMS inventory couldn't be read, so I can't suggest a specific thing to look for. Fix API access or use a page you already know personalizes, and I won't assume the space is empty."
            : '',
        render.section(
          'Do this, then come back',
          [
            '1. Open your app at the URL above (or reload it if it is already open).',
            '2. Open the Live Events dashboard in another tab and turn on streaming.',
            '3. Reload the app page once so it sends a fresh event.',
            '4. Watch for the page load to show up in Live Events.',
            '5. Only click, accept consent, or navigate if you actually want those things to happen.',
          ].join('\n'),
        ),
      ].filter(Boolean);

      const hasInventoriedOutcome = hasInventoriedOutcomeScenario(scenario);
      const automatedApiChecksRan = result !== undefined || store.steps['survey-content'] !== undefined;
      const needsCmsSurvey = !hasInventoriedOutcome && automatedApiChecksRan;
      const validationOptions = [
        {
          value: 'ready',
          label: '✅ Done — I reloaded the app',
          description: canCompareLiveEvents
            ? "I'll check what changed in Live Events and ask what you saw"
            : "I'll ask what you saw in the browser and Live Events",
        },
        ...(needsCmsSurvey
          ? [
              {
                value: 'resurvey-content',
                label:
                  scenario?.kind === 'fixture-needed'
                    ? '🧩 I published a test experience'
                    : '🔄 Re-check the CMS for experiences',
                description:
                  scenario?.kind === 'fixture-needed'
                    ? 'Re-read the audience, experience, variants, and page link you just published'
                    : 'Look again for a published experience to test against',
              },
            ]
          : []),
        {
          value: 'retry-page',
          label: '🖥️ Re-open the app for me',
          description: 'Start or reuse the dev server and open the page again',
        },
        {
          value: 'unavailable',
          label: "⏸️ I can't test right now",
          description: 'Pause live testing — the setup stays in place',
        },
      ];

      return [
        prompt`
          The finished app has already been started and opened, and a silent pre-reload snapshot of
          the Live Events counts was already captured for later comparison — do NOT mention that
          snapshot mechanism to the user; it is internal. Present the view below as-is and wait for
          the user to actually reload the page before continuing.

          Keep your own words plain and encouraging. This step only asks the user to open, stream,
          and reload — the "what did you see" question comes next, so do not ask them to judge the
          outcome yet.

          If the automated check failed with HTTP 401, say only that the endpoint rejected the
          request; do not claim the token is expired, wrongly scoped, or missing access unless other
          evidence shows that.
        `,
        view('📡 Let’s watch it work', sections.join('\n\n')),
        act.askUser({
          type: 'structured',
          question: 'Have you opened the app and reloaded the page?',
          options: validationOptions,
        }),
      ];
    },
    response: type({
      choice: "'ready' | 'retry-page' | 'resurvey-content' | 'unavailable'",
    }),
    next: ({ response, store }) => {
      if (response.choice === 'resurvey-content') return 'survey-content';
      return response.choice === 'retry-page'
        ? 'present-runtime'
        : response.choice === 'unavailable'
          ? 'validation-disposition'
          : store.steps['verify-live-events']?.liveEvents
            ? 'verify-live-events-after'
            : 'runtime-confirmation';
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
      const scenario = store.steps['survey-content']?.testScenario;
      const hasInventoriedOutcome = hasInventoriedOutcomeScenario(scenario);
      const needsCmsSurvey = !hasInventoriedOutcome;
      const presentation = store.steps['present-runtime'];
      const hasComparison = before !== undefined && after !== undefined;

      // Interpret the before/after delta for the user rather than handing them the raw table.
      const pageDelta = hasComparison ? (after?.numPageEvents ?? 0) - (before?.numPageEvents ?? 0) : undefined;
      const deltaReading =
        pageDelta === undefined
          ? 'No automated event comparison was available, so rely on what you saw in the browser and Live Events.'
          : pageDelta > 0
            ? `Live Events recorded ${pageDelta} new page event(s) since you reloaded — a good sign the app is sending data. It confirms events are flowing, though not on its own which page produced them, so tell me what you actually saw.`
            : 'Live Events did not record a new page event since the reload. That can happen with timing or consent — tell me what you saw in the browser and dashboard.';

      return [
        prompt`
          You already asked the user to reload the app; now find out what they actually observed.
          Present the plain-language reading of the Live Events change below and the app link. Ask
          what they saw and map it to one option. Do not conclude an outcome from event counts alone
          — the user's observation is what decides it. Keep the dev server running for them.
          ${
            hasComparison
              ? '\nThe exact before/after counts are available if the user asks, but lead with the plain reading, not the raw table.'
              : ''
          }
        `,
        view(
          'What did you see?',
          [
            presentation?.applicationUrl
              ? `[Open your app again](${presentation.applicationUrl}) if you want another look.`
              : 'The app URL is unavailable.',
            deltaReading,
          ].join('\n\n'),
        ),
        act.askUser({
          type: 'structured',
          question: 'What happened when you loaded the page?',
          options: [
            ...(hasInventoriedOutcome
              ? [
                  {
                    value: 'confirmed-end-to-end',
                    label: '✅ I saw the personalized variant',
                    description: 'The expected experience/variant rendered on the page',
                  },
                ]
              : []),
            {
              value: 'confirmed-transport',
              label: '📡 The page load showed up in Live Events',
              description: 'Events are reaching Contentful, even if no variant was visible',
            },
            { value: 'retry', label: '🔄 Nothing yet — let me try again' },
            ...(needsCmsSurvey
              ? [
                  {
                    value: 'resurvey-content',
                    label:
                      scenario?.kind === 'fixture-needed'
                        ? '🧩 I published a test experience'
                        : '🔄 Re-check the CMS for experiences',
                  },
                ]
              : []),
            { value: 'unavailable', label: "⏸️ I can't test right now" },
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
      // An end-to-end claim is only meaningful when a CMS scenario backs it. If it comes back
      // without one, re-ask once or twice, then fall through to the report (which downgrades the
      // unsupported claim) rather than looping forever on an option that was never offered.
      if (response.choice === 'confirmed-end-to-end' && !hasInventoriedOutcome) {
        return attempts < 3 ? 'runtime-confirmation' : 'report';
      }
      return response.choice === 'retry' && attempts < 3
        ? store.steps['verify-live-events']?.liveEvents
          ? 'verify-live-events'
          : 'present-runtime'
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

      const presentation = store.steps['present-runtime'];
      if (presentation) {
        sections.push(render.section('🖥️ Finished application', finishedApplicationSummary(presentation)));
      }

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
