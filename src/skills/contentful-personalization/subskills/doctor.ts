import { skill, type, prompt, render, act, view, terminal } from '@contentful/skill-kit';
import { checkPackages } from '../actions/check-packages.js';
import { scanCredentials } from '../actions/scan-credentials.js';
import { checkApiConnectivity } from '../actions/check-api.js';
import { checkOptimizationDoctor } from '../actions/check-optimization-doctor.js';
import { surveyContent } from '../actions/survey-content.js';
import { inspectContent } from '../actions/inspect-content.js';
import { validateLocalSetup } from '../actions/validate-local-setup.js';
import { getOptimizationReferenceFiles } from '../optimization-references.js';
import { implementationGuidance } from '../implementation-guidance.js';
import {
  PackagesResult,
  Recommendation,
  ValidationStage,
  ValidationSummary,
  type CredentialsScanResult,
  type Finding,
  type ValidationStageEvidence,
} from '../schemas.js';
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
  detectedCredentialRows,
  managementTokenSource,
  optimizationDoctorRequestRows,
} from '../validation/credentials.js';
import {
  deriveValidationFinalState,
  describeValidationFinalState,
  getRerunStages,
  VALIDATION_STAGES,
} from '../validation/policy.js';
import { VERSION } from '../version.js';

export function resolveDoctorRerunStages(changedStages: ValidationStage[]): ValidationStage[] {
  const affected = new Set(changedStages.flatMap((stage) => getRerunStages(stage)));
  return VALIDATION_STAGES.filter((stage) => affected.has(stage));
}

function beginDoctorRerunStep(stages: ValidationStage[]): string {
  const first = VALIDATION_STAGES.find((stage) => stages.includes(stage));
  switch (first) {
    case 'local-integrity':
      return 'begin-local-rerun';
    case 'credential-connectivity':
      return 'begin-connectivity-rerun';
    case 'cms-graph':
      return 'begin-cms-rerun';
    case 'runtime-transport':
      return 'begin-runtime-rerun';
    case 'personalization-outcome':
      return 're-confirm-runtime';
    default:
      return 'validation-report';
  }
}

function recordedDoctorChangedStages(steps: unknown): ValidationStage[] {
  const records = steps as {
    fix?: { changedStages?: ValidationStage[] };
    'fix-infra'?: { changedStages?: ValidationStage[] };
  };
  const changed = records.fix?.changedStages ?? records['fix-infra']?.changedStages;
  return changed && changed.length > 0 ? changed : ['local-integrity'];
}

function recordedDoctorFixSummary(steps: unknown): string {
  const records = steps as {
    fix?: { summary?: string };
    'fix-infra'?: { summary?: string };
  };
  return records.fix?.summary ?? records['fix-infra']?.summary ?? 'No fix summary was captured.';
}

// Shape of credentials extracted by scan-credentials and (optionally) corrected by the user.
export interface CredentialBlocks {
  personalization?: { apiKey?: string; environment?: string };
  optimization?: { clientId?: string; environment?: string };
  contentful?: {
    spaceId?: string;
    accessToken?: string;
    previewToken?: string;
    managementToken?: string;
    environment?: string;
  };
}

export interface ResolvedCredentials {
  personalization: { apiKey: string; environment: string };
  optimization: { clientId: string; environment: string };
  contentful: {
    spaceId: string;
    accessToken: string;
    previewToken?: string;
    managementToken?: string;
    environment: string;
  };
}

// Merge scanned credentials with user corrections without accepting masked previews as values.
//
// `scanned` is the source of truth — it came straight from the .env files and never passed
// through the LLM. A correction only wins when the user supplied a real, non-masked override.
// This makes it structurally impossible for a masked/truncated preview that the agent echoed
// back (e.g. "KXNnMDBy****") to overwrite a real secret. When `runCredentialChecks` is false
// the user declined deeper diagnostics, so we return empty credentials and the downstream
// API/content checks skip cleanly.
export function resolveCredentials({
  scanned,
  runCredentialChecks,
  corrections,
}: {
  /** Credentials extracted from .env files — the trusted source of truth. */
  scanned: CredentialBlocks | undefined;
  /** Whether the user opted into the checks that need credentials (API connectivity + content survey). */
  runCredentialChecks: boolean;
  /** User-supplied overrides only; masked previews are ignored. */
  corrections: CredentialBlocks | undefined;
}): ResolvedCredentials {
  if (!runCredentialChecks) {
    return {
      personalization: { apiKey: '', environment: 'main' },
      optimization: { clientId: '', environment: 'main' },
      contentful: { spaceId: '', accessToken: '', environment: 'master' },
    };
  }

  const override = (corrected: string | undefined, scannedValue: string | undefined): string | undefined => {
    if (corrected && corrected.trim() && !corrected.includes('****')) return corrected.trim();
    return scannedValue;
  };

  const previewToken = override(corrections?.contentful?.previewToken, scanned?.contentful?.previewToken);
  const managementToken = override(corrections?.contentful?.managementToken, scanned?.contentful?.managementToken);

  return {
    personalization: {
      apiKey: override(corrections?.personalization?.apiKey, scanned?.personalization?.apiKey) ?? '',
      environment: override(corrections?.personalization?.environment, scanned?.personalization?.environment) ?? 'main',
    },
    optimization: {
      clientId: override(corrections?.optimization?.clientId, scanned?.optimization?.clientId) ?? '',
      environment: override(corrections?.optimization?.environment, scanned?.optimization?.environment) ?? 'main',
    },
    contentful: {
      spaceId: override(corrections?.contentful?.spaceId, scanned?.contentful?.spaceId) ?? '',
      accessToken: override(corrections?.contentful?.accessToken, scanned?.contentful?.accessToken) ?? '',
      ...(previewToken ? { previewToken } : {}),
      ...(managementToken ? { managementToken } : {}),
      environment: override(corrections?.contentful?.environment, scanned?.contentful?.environment) ?? 'master',
    },
  };
}

// SDK-specific facts used to keep prompts and reports accurate for whichever SDK
// the project actually uses. 'legacy' = @ninetailed/experience.js,
// 'modern' = @contentful/optimization.
function sdkProfile(family: string | undefined): {
  name: string;
  provider: string;
  component: string;
  clientEnv: string;
  guide: string;
} {
  switch (family) {
    case 'modern':
      return {
        name: '@contentful/optimization',
        provider: 'OptimizationRoot, createNextjs* factory, or ContentfulOptimization singleton',
        component: 'OptimizedEntry / resolveOptimizedEntry()',
        clientEnv: 'the project-specific OPTIMIZATION_CLIENT_ID alias passed to runtime config',
        guide: 'optimization-overview.md',
      };
    case 'legacy':
      return {
        name: '@ninetailed/experience.js (legacy SDK)',
        provider: 'NinetailedProvider',
        component: '<Experience> / <Personalize>',
        clientEnv: 'the project-specific NINETAILED_API_KEY or NINETAILED_CLIENT_ID alias',
        guide: 'sdk-legacy-guide.md',
      };
    case 'both':
      return {
        name: 'both @ninetailed/experience.js and @contentful/optimization',
        provider: 'NinetailedProvider and/or the runtime-specific Optimization root or factory',
        component: '<Experience> and/or OptimizedEntry',
        clientEnv: 'the SDK-specific client credential alias used by each runtime config',
        guide: 'optimization-overview.md',
      };
    default:
      return {
        name: 'no personalization SDK detected',
        provider: 'NinetailedProvider or a runtime-specific Optimization root or factory',
        component: 'Experience or OptimizedEntry',
        clientEnv: 'the SDK-specific client credential alias used by the runtime config',
        guide: 'optimization-overview.md',
      };
  }
}

function loadSdkReferences(
  family: string | undefined,
  framework: string,
  load: (file: string) => string,
  optimizationPackages?: ReadonlyArray<{ name?: string } | undefined>,
): string {
  const packageNames = new Set(
    (optimizationPackages ?? []).map((pkg) => pkg?.name).filter((name): name is string => !!name),
  );
  const runtime = packageNames.has('@contentful/optimization-nextjs')
    ? /hybrid/.test(framework)
      ? ('unknown' as const)
      : /pages/.test(framework)
        ? ('nextjs-pages-router' as const)
        : ('nextjs-app-router' as const)
    : packageNames.has('@contentful/optimization-react-native')
      ? ('react-native' as const)
      : packageNames.has('@contentful/optimization-react-web')
        ? ('react-web' as const)
        : packageNames.has('@contentful/optimization-web')
          ? ('web' as const)
          : packageNames.has('@contentful/optimization-node')
            ? ('node' as const)
            : ('unknown' as const);
  const modernFiles = getOptimizationReferenceFiles({ framework, runtime });

  if (
    packageNames.has('@contentful/optimization-node') &&
    !packageNames.has('@contentful/optimization-nextjs') &&
    !modernFiles.includes('optimization-node.md')
  ) {
    modernFiles.push('optimization-node.md');
  }

  const modernReference = modernFiles.map((file) => load(file)).join('\n\n---\n\n');

  if (family === 'legacy') return load('sdk-legacy-guide.md');
  if (family === 'modern') return modernReference;
  if (family === 'both') {
    return `${load('sdk-legacy-guide.md')}\n\n---\n\n${modernReference}`;
  }

  return `${load('sdk-selection.md')}\n\n---\n\n${load('optimization-overview.md')}`;
}

function findingsTable(findings: Finding[] | undefined): string {
  if (!findings || findings.length === 0) return '*No findings*';
  return render.table(
    findings.map((f) => ({ Check: f.item, Status: f.status, Detail: f.detail })),
    { columns: ['Check', 'Status', 'Detail'] },
  );
}

export default skill({
  name: 'doctor',
  version: VERSION,
  description:
    'Diagnose and fix Contentful personalization issues. ' +
    'Runs programmatic checks first (credentials, API connectivity, content state), ' +
    'fixes infrastructure problems, and only then explores the codebase.',
  entry: 'detect-sdk',

  params: type({
    'userQuery?': 'string',
  }),

  stores: {
    project: type({
      framework: 'string',
      projectPath: 'string',
      'sdkFamily?': "'legacy' | 'modern' | 'both' | 'none'",
      'explorationSummary?': 'string',
      'concerns?': 'string[]',
      'personalizableCandidates?': 'string[]',
      'renderingBoundaries?': 'string[]',
      packages: PackagesResult,
    }),
    credentials: type({
      personalization: {
        apiKey: 'string',
        environment: 'string',
      },
      optimization: {
        clientId: 'string',
        environment: 'string',
      },
      contentful: {
        spaceId: 'string',
        accessToken: 'string',
        'previewToken?': 'string',
        'managementToken?': 'string',
        environment: 'string',
      },
    }),
    diagnosis: type({
      overallStatus: "'pass' | 'warn' | 'fail'",
      recommendations: Recommendation.array(),
      summary: 'string',
    }),
  },
})
  // --- Programmatic phase: cheap checks before any code exploration ---

  .step('detect-sdk', {
    prompt: () => prompt`
        Identify the project so the programmatic checks can run. This is a lightweight
        first pass — do NOT analyze provider wiring, middleware, or components yet
        (that happens later, only if needed).

        1. Determine the project root directory (where package.json lives).
        2. Read package.json to identify the framework and router type.

        Report the framework and the absolute or relative project path. Nothing else.
      `,
    response: type({
      framework:
        "'nextjs-app' | 'nextjs-pages' | 'nextjs-hybrid' | 'gatsby' | 'remix' | 'react' | 'react-native' | 'other'",
      'frameworkVersion?': 'string',
      projectPath: 'string',
    }),
    action: {
      mapInput: ({ response }) => ({ projectPath: response.projectPath }),
      run: checkPackages,
    },
    save: ({ response, actionResult }) => {
      const pkgs = actionResult?.packages;
      const hasNt = (pkgs?.ninetailed?.length ?? 0) > 0;
      const hasOpt = (pkgs?.optimization?.length ?? 0) > 0;
      const sdkFamily = hasNt && hasOpt ? 'both' : hasOpt ? 'modern' : hasNt ? 'legacy' : 'none';
      return {
        step: response,
        project: {
          framework: response.framework,
          projectPath: response.projectPath,
          packages: actionResult,
          sdkFamily,
        },
      };
    },
    next: 'scan-credentials',
  })

  .step('scan-credentials', {
    action: {
      mapInput: ({ store }) => ({ projectPath: store.project?.projectPath ?? '.' }),
      run: scanCredentials,
    },
    next: 'confirm-credentials',
  })

  .step('confirm-credentials', {
    prompt: ({ store }) => {
      const scanned = store.steps['scan-credentials'];
      const envVars = scanned?.envVars ?? [];
      const family = store.project?.sdkFamily;
      const profile = sdkProfile(family);

      const envTable = render.table(
        envVars.map((ev: { name: string; status: string; maskedValue?: string }) => ({
          Variable: ev.name,
          Status: ev.status,
          Value: ev.maskedValue ?? '—',
        })),
        { columns: ['Variable', 'Status', 'Value'] },
      );

      const hasAnyCreds = detectedCredentialRows(scanned).length > 0;

      if (hasAnyCreds) {
        const credTable = render.table(detectedCredentialRows(scanned), {
          columns: ['Credential', 'Variable', 'Value', 'Source'],
        });

        return [
          prompt`
            This project uses ${profile.name}. Present the credential scan results below to the
            user — show the environment variable table and the detected credentials table exactly
            as rendered. Then let the user confirm, correct, or skip.

            The table shows masked previews. Do not repeat raw credential values in prose:

            - If the user confirms the detected values are correct → set runCredentialChecks = true
              and DO NOT include any corrections. The real scanned values will be used automatically.
            - If the user needs to change something → set runCredentialChecks = true and put ONLY the
              changed fields in corrections, using the actual new values the user gives you. Never copy
              a masked value (anything containing "****") from the table into corrections.
            - If the user skips → set runCredentialChecks = false.
          `,
          view(
            '🔑 Credential Scan Results',
            [
              render.section('Environment Variables', envTable),
              render.section('Auto-Detected Credentials', credTable),
            ].join('\n\n'),
          ),
          act.askUser({
            type: 'structured',
            question: 'Are these credentials correct?',
            options: [
              {
                value: 'confirm',
                label: '✅ Yes, these look correct',
                description: 'Confirm the auto-detected credentials and proceed with API checks',
              },
              {
                value: 'correct',
                label: '✏️ I need to correct some values',
                description: 'Provide updated credentials before proceeding',
              },
              {
                value: 'decline',
                label: '⏭️ Skip API checks',
                description: 'Proceed without testing API connectivity or content state',
              },
            ],
          }),
        ];
      }

      // No credentials auto-detected. Tailor the "where to find it" hint to the SDK in use.
      const personalizationCredHint =
        family === 'legacy'
          ? '- **Ninetailed API Key** (`NEXT_PUBLIC_NINETAILED_CLIENT_ID`) — Contentful Organization settings > Optimization > Data sources and metrics > SDK keys'
          : family === 'modern'
            ? '- **Optimization Client ID** (`NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID`) — Contentful Organization settings > Optimization > Data sources and metrics > SDK keys'
            : '- **Client ID / API key** — Contentful Organization settings > Optimization > Data sources and metrics > SDK keys';

      return [
        prompt`
          This project uses ${profile.name}. Present the environment variable scan results below
          to the user. No API credentials were found automatically.

          Explain that we can run deeper diagnostics (API connectivity, content state) if they
          provide credentials. Tell them where to find each value:
          ${personalizationCredHint}
          - **Contentful Space ID** — Contentful Settings > General settings
          - **CDA Token** (Content Delivery API) — Contentful Settings > API keys
          - **CPA Token** (Content Preview API) — Same location, optional but recommended
          - **CMA Token / CFPAT** (Content Management, Personal Access Token) — Contentful Account settings > CMA tokens. Optional; only used to hit the /optimization-doctor endpoint for a live-events check.
          - **Environment** — Usually "master" for Contentful, "main" for the personalization SDK

          If the user provides credentials, set runCredentialChecks = true and put the values they
          give you into corrections. If the user skips, set runCredentialChecks = false.
        `,
        view('🔍 Environment Variable Scan', envTable),
        act.askUser({
          type: 'structured',
          question: 'Can you provide credentials for a full diagnostic?',
          options: [
            {
              value: 'provide',
              label: '🔑 Yes, I can provide credentials',
              description: 'Paste your Contentful and/or personalization credentials',
            },
            {
              value: 'decline',
              label: '⏭️ Skip — code-only diagnostic',
              description: 'Proceed without API connectivity or content checks',
            },
          ],
        }),
      ];
    },
    response: type({
      // Whether to run the checks that need credentials (API connectivity + content survey).
      runCredentialChecks: 'boolean',
      // ONLY user-supplied overrides go here — never the auto-scanned values, and never a
      // masked preview. Each field, if present, replaces the scanned value in apply-credentials.
      'corrections?': {
        'personalization?': {
          'apiKey?': 'string',
          'environment?': 'string',
        },
        'optimization?': {
          'clientId?': 'string',
          'environment?': 'string',
        },
        'contentful?': {
          'spaceId?': 'string',
          'accessToken?': 'string',
          'previewToken?': 'string',
          'managementToken?': 'string',
          'environment?': 'string',
        },
      },
    }),
    next: 'apply-credentials',
  })

  .step('apply-credentials', {
    save: ({ store }) => {
      const confirmed = store.steps['confirm-credentials'] as
        | { runCredentialChecks?: boolean; corrections?: CredentialBlocks }
        | undefined;
      const scanned = store.steps['scan-credentials'] as CredentialBlocks | undefined;
      return {
        credentials: resolveCredentials({
          scanned,
          runCredentialChecks: confirmed?.runCredentialChecks !== false,
          corrections: confirmed?.corrections,
        }),
      };
    },
    next: 'check-api',
  })

  .step('check-api', {
    action: {
      mapInput: ({ store }) => {
        const creds = store.credentials;
        return {
          ...(creds?.personalization?.apiKey ? { apiKey: creds.personalization.apiKey } : {}),
          ninetailedEnvironment: creds?.personalization?.environment ?? 'main',
          ...(creds?.optimization?.clientId ? { optimizationClientId: creds.optimization.clientId } : {}),
          optimizationEnvironment: creds?.optimization?.environment ?? 'main',
        };
      },
      run: checkApiConnectivity,
    },
    next: 'survey-content',
  })

  .step('survey-content', {
    action: {
      mapInput: ({ store }) => {
        const creds = store.credentials;
        return {
          spaceId: creds?.contentful?.spaceId ?? '',
          environment: creds?.contentful?.environment ?? 'master',
          ...(creds?.contentful?.accessToken ? { accessToken: creds.contentful.accessToken } : {}),
          ...(creds?.contentful?.previewToken ? { previewToken: creds.contentful.previewToken } : {}),
        };
      },
      run: surveyContent,
    },
    next: 'check-optimization-doctor',
  })

  .step('check-optimization-doctor', {
    action: {
      mapInput: ({ store }) => {
        const creds = store.credentials;
        const confirmed = store.steps['confirm-credentials'] as { corrections?: CredentialBlocks } | undefined;
        const scanned = store.steps['scan-credentials'] as CredentialsScanResult | undefined;
        const tokenSource = confirmed?.corrections?.contentful?.managementToken
          ? 'user-provided correction'
          : managementTokenSource(scanned);
        return {
          spaceId: creds?.contentful?.spaceId ?? '',
          environmentId: creds?.contentful?.environment ?? 'master',
          ...(creds?.contentful?.managementToken ? { managementToken: creds.contentful.managementToken } : {}),
          ...(tokenSource ? { managementTokenSource: tokenSource } : {}),
        };
      },
      run: checkOptimizationDoctor,
    },
    next: 'programmatic-gate',
  })

  // --- Gate: decide what to do based on the programmatic findings ---

  .step('programmatic-gate', {
    prompt: ({ store }) => {
      const creds = store.credentials;
      const apiData = store.steps['check-api'];
      const survey = store.steps['survey-content'];
      const optimizationDoctor = store.steps['check-optimization-doctor'];
      const profile = sdkProfile(store.project?.sdkFamily);

      const hasPersonalizationCred = !!(creds?.personalization?.apiKey || creds?.optimization?.clientId);
      const hasContentfulTokens = !!(
        creds?.contentful?.spaceId &&
        (creds?.contentful?.accessToken || creds?.contentful?.previewToken)
      );

      const apiFailed = apiData?.status === 'fail';
      const surveyFailed = survey?.status === 'fail';
      const surveyWarned = survey?.status === 'warn';
      const optimizationDoctorFailed = optimizationDoctor?.status === 'fail';

      // Note: Current choice is to have zero live-events (`warn` from
      // optimizationDoctor) NOT be an infra problem — a quiet 15-minute window is
      // not necessarily broken infra
      const missingCreds = !hasPersonalizationCred;
      const hasInfraProblem = missingCreds || apiFailed || surveyFailed || surveyWarned || optimizationDoctorFailed;

      const credNote = hasPersonalizationCred
        ? `✅ ${profile.name} credentials are available.`
        : `❌ No personalization credentials found — the connectivity and content checks could not run. The most likely problem is a missing or misnamed value for ${profile.clientEnv}.`;

      const apiNote =
        apiData?.status === 'pass'
          ? '✅ Experience API connectivity is healthy.'
          : apiData?.status === 'skip'
            ? '⏭️ Experience API check was skipped (no personalization credential).'
            : '❌ Experience API connectivity failed.';

      const surveyNote =
        survey?.testScenario.kind === 'unavailable'
          ? '❌ The CMS survey could not retrieve content. No graph, authoring, or publishing conclusion can be drawn until Content API connectivity is restored.'
          : survey?.status === 'pass'
            ? '✅ The published inventory and baseline-link checks passed.'
            : survey?.status === 'skip'
              ? '⏭️ Content survey was skipped (no Contentful tokens).'
              : survey?.status === 'warn'
                ? '⚠️ Content survey found something worth attention.'
                : '❌ Content survey found published/preview inconsistencies.';

      const optimizationDoctorNote =
        optimizationDoctor?.status === 'pass'
          ? '✅ Optimization-doctor returned recent space-wide counts. They are not correlated to this diagnostic run.'
          : optimizationDoctor?.status === 'warn'
            ? '⚠️ Optimization-doctor endpoint reachable but no live events observed in the last 15 minutes.'
            : optimizationDoctor?.status === 'skip'
              ? '⏭️ Optimization-doctor check skipped (no CONTENTFUL_MANAGEMENT_TOKEN available).'
              : '❌ Optimization-doctor endpoint call failed.';
      const optimizationDoctorRequest = optimizationDoctorRequestRows(optimizationDoctor);

      const sections: string[] = [];
      sections.push(render.kv({ SDK: profile.name }));
      sections.push(render.section('🔑 Credentials', credNote));
      sections.push(render.section('🌐 Experience API', `${apiNote}\n\n${findingsTable(apiData?.findings)}`));
      sections.push(render.section('📄 Content survey', `${surveyNote}\n\n${findingsTable(survey?.findings)}`));
      sections.push(
        render.section(
          '🩺 Optimization doctor (live events last 15m)',
          [
            optimizationDoctorNote,
            optimizationDoctorRequest.length > 0
              ? render.table(optimizationDoctorRequest, { columns: ['Field', 'Value'] })
              : '',
            findingsTable(optimizationDoctor?.findings),
          ].join('\n\n'),
        ),
      );

      const options: Array<{ value: string; label: string; description?: string }> = [];
      if (hasInfraProblem) {
        options.push({
          value: 'fix-infra',
          label: '🔧 Fix the infrastructure issues first',
          description: 'Correct env vars / credentials and get content publishing guidance',
        });
      }
      if (hasContentfulTokens) {
        options.push({
          value: 'inspect-entry',
          label: '🔍 Inspect a specific entry in depth',
          description: 'Deep-dive one Contentful entry (published vs preview)',
        });
      }
      options.push({
        value: 'explore-code',
        label: '🧭 Investigate the codebase',
        description: 'Look at provider, middleware, and component wiring',
      });
      options.push({
        value: 'done',
        label: '📋 Stop here — the findings are enough',
      });

      const guidance = hasInfraProblem
        ? 'There are clear infrastructure problems above. Recommend fixing those first, since they are the most common cause of broken personalization and are cheaper to fix than code changes.'
        : 'No clear infrastructure failure was found.';

      return [
        prompt`
          Present the findings below to the user exactly as rendered, then briefly summarize the
          state of credentials, connectivity, and content (2-4 sentences).

          ${guidance}

          Be honest about the limits of these checks:
          - The content survey is **count- and link-based**. It can catch a published baseline that
            doesn't link to a published experience, but it CANNOT prove that personalization content
            is fully correct (audience targeting, variant wiring, which section renders, etc.).
          - **Never tell the user their content is healthy or rule out their concern based on these
            checks alone.** If the survey passed, say only that the checks it can run did not find a
            problem — not that content is fine.
          - A successful synthetic Experience API probe proves credential/destination connectivity,
            not that the application runtime sends events.
          - Non-zero optimization-doctor counts are space-wide aggregate evidence and cannot prove
            that this page, profile, or validation run produced them without a before/after delta
            plus user correlation.
          - An HTTP 401 proves only that the endpoint rejected this exact request. Do not say the
            token is expired, incorrectly scoped, or missing space access unless separate evidence
            establishes that diagnosis. First compare the masked token, source, space, environment,
            and endpoint shown in the request table.

          If the user has described a specific symptom (especially a content or publishing
          suspicion), take it seriously: do NOT argue it away on the strength of this summary.
          Recommend the **"Inspect a specific entry in depth"** option to confirm or refute a
          content/publishing hunch via the per-entry published-vs-preview comparison, even when the
          survey looked clean. Reserve the "fix infrastructure first" steer for clear infra failures,
          and "investigate the codebase" for when the user's symptom points at app wiring.

          Let the user choose how to proceed. Capture any symptom they describe in
          problemDescription (use an empty string if none).
        `,
        view('Health check', sections.join('\n\n')),
        act.askUser({
          type: 'structured',
          question: 'How would you like to proceed?',
          options,
        }),
      ];
    },
    response: type({
      choice: "'fix-infra' | 'inspect-entry' | 'explore-code' | 'done'",
      problemDescription: 'string',
    }),
    next: ({ response }) => {
      switch (response.choice) {
        case 'fix-infra':
          return 'fix-infra';
        case 'inspect-entry':
          return 'choose-entry';
        case 'done':
          return 'done';
        default:
          return 'explore-code';
      }
    },
  })

  .step('fix-infra', {
    prompt: ({ store, system, refs }) => {
      const profile = sdkProfile(store.project?.sdkFamily);
      const apiData = store.steps['check-api'];
      const survey = store.steps['survey-content'];
      // run-inspection is defined later in the builder chain, so its type isn't in scope here;
      // it's only present in the store when fix-infra is reached via the drill-down path.
      const inspection = (store.steps as unknown as Record<string, unknown>)['run-inspection'] as
        | { findings?: Finding[]; entry?: { id?: string; comparison?: { hasUnpublishedChanges?: boolean } } }
        | undefined;
      const scanned = store.steps['scan-credentials'];

      const envView = scanned
        ? render.table(
            (scanned.envVars ?? []).map((ev: { name: string; status: string; maskedValue?: string }) => ({
              Variable: ev.name,
              Status: ev.status,
              Value: ev.maskedValue ?? '—',
            })),
            { columns: ['Variable', 'Status', 'Value'] },
          )
        : '*No environment variable data*';

      return [
        system`Fix infrastructure problems only — do NOT touch provider/middleware/component code here. Match the project's existing style. For content publishing problems, give the user clear Contentful UI steps; you cannot publish for them.`,
        prompt`
          Fix the infrastructure problems found by the programmatic checks. This project uses
          ${profile.name}, so confirm ${profile.clientEnv}.

          Fix strategy:
          - **Missing / misnamed env vars** → use the writeEnvFile action. Confirm the correct value
            with the user before writing if you are unsure.
          - **Rejected credentials (401/403/404)** → the value is wrong; help the user get the right
            Client ID from Contentful Organization settings > Optimization > Data sources and metrics
            > SDK keys, then write it.
          - **Content publishing problems** (experiences in preview but not published) → give
            step-by-step Contentful UI instructions, including publishing order: publish variant
            entries first, then experience entries, then republish the baseline entries.

          Do NOT explore or modify application code in this step.
          In your structured result, record which shared evidence stages changed so the doctor can
          rerun that stage and its downstream dependencies.

          ## Current environment variables
          ${envView}

          ## Connectivity findings
          ${findingsTable(apiData?.findings)}

          ## Content survey findings
          ${findingsTable(survey?.findings)}
          ${
            inspection
              ? `\n          ## Inspected entry (${inspection.entry?.id ?? 'unknown'})\n          ${findingsTable(inspection.findings)}${
                  inspection.entry?.comparison?.hasUnpublishedChanges
                    ? '\n\n          🔴 This entry has changes in preview (CPA) that are not in published (CDA) content — re-publish it so the live site resolves the experience.'
                    : ''
                }`
              : ''
          }

          ## Reference: Environment Variables
          ${refs.load('env-var-spec.md')}
        `,
        act.checklist({
          create: [
            ...((apiData?.findings ?? []).some((f: Finding) => f.status === 'fail')
              ? [{ title: '🔑 Correct personalization credentials / env vars', status: 'pending' as const }]
              : []),
            ...([...(survey?.findings ?? []), ...(inspection?.findings ?? [])].some(
              (f: Finding) => f.status === 'fail' || f.status === 'warn',
            )
              ? [{ title: '📄 Resolve content publishing issues (Contentful UI)', status: 'pending' as const }]
              : []),
          ],
        }),
      ];
    },
    response: type({
      summary: 'string',
      filesModified: 'string[]',
      'changedStages?': ValidationStage.array(),
    }),
    next: 'ask-fixed',
  })

  .step('ask-fixed', {
    prompt: () => [
      prompt`
        The infrastructure fixes have been applied (or the user has the Contentful UI steps to
        complete). Ask the user to verify whether personalization is working now — for example by
        reloading the affected page or re-checking the experience. Keep it brief.
      `,
      act.confirm({
        message: 'Is personalization working now?',
        defaultAnswer: 'no',
      }),
    ],
    response: type({ working: 'boolean' }),
    next: ({ response, store }) =>
      response.working
        ? beginDoctorRerunStep(resolveDoctorRerunStages(recordedDoctorChangedStages(store.steps)))
        : 'explore-code',
  })

  // --- Optional drill-down: inspect one specific entry in depth ---

  .step('choose-entry', {
    prompt: ({ store }) => {
      const survey = store.steps['survey-content'];
      const suspicious = survey?.suspiciousEntryIds ?? [];

      return [
        prompt`
          Ask the user for the Contentful entry ID (sys.id) they want to inspect in depth.
          They can find it in the entry URL (the last segment after /entries/) or in the
          sidebar when editing an entry. If they pass a full URL, extract the entry ID.

          ${
            suspicious.length > 0
              ? `The content survey flagged these experience entries as published-state suspects:\n${suspicious.map((id: string) => `- ${id}`).join('\n')}\nThe user may want to inspect the entry that links one of these, or one of these directly.`
              : ''
          }
        `,
        act.askUser({
          type: 'open',
          question:
            'Paste the Contentful entry ID here (sys.id from the URL or sidebar), or type "skip" to continue without deep inspection:',
        }),
      ];
    },
    response: type({
      'entryId?': 'string',
      skip: 'boolean',
    }),
    next: ({ response }) => {
      if (response.skip || !response.entryId) return 'explore-code';
      return 'run-inspection';
    },
  })

  .step('run-inspection', {
    action: {
      mapInput: ({ store }) => {
        const creds = store.credentials;
        const entryId = store.steps['choose-entry']?.entryId ?? '';
        return {
          spaceId: creds?.contentful?.spaceId ?? '',
          environment: creds?.contentful?.environment ?? 'master',
          ...(creds?.contentful?.accessToken ? { accessToken: creds.contentful.accessToken } : {}),
          ...(creds?.contentful?.previewToken ? { previewToken: creds.contentful.previewToken } : {}),
          entryId,
          includeDepth: 3,
        };
      },
      run: inspectContent,
    },
    // A confirmed content problem (fail/warn, e.g. unpublished baseline link) goes through the
    // fix-first → verify loop; only a healthy or un-inspectable entry falls through to code.
    next: ({ actionResult }) =>
      actionResult?.status === 'fail' || actionResult?.status === 'warn' ? 'fix-infra' : 'explore-code',
  })

  // --- Codebase phase: only reached when programmatic checks were clean,
  //     an infra fix did not resolve the problem, or the user asked for it ---

  .step('explore-code', {
    prompt: ({ store, refs }) => {
      const profile = sdkProfile(store.project?.sdkFamily);
      const framework = store.project?.framework ?? 'other';
      const sdkReference = loadSdkReferences(
        store.project?.sdkFamily,
        framework,
        (file) => refs.load(file),
        store.project?.packages?.packages?.optimization,
      );
      const modernServerChecks = /nextjs-pages/.test(framework)
        ? 'For the Optimization Pages Router SDK, check the separate client and server createNextjsPagesRouterOptimization factories plus the getServerSideProps state handoff; it does not use middleware or proxy.'
        : /nextjs/.test(framework)
          ? 'For the Optimization App Router SDK, check createNextjsAppRouterOptimization, its bound components, and the version-appropriate proxy.ts or middleware.ts request handler.'
          : 'For the Optimization SDK, check the runtime-specific root or process singleton and its request or route boundary.';
      return prompt`
        The programmatic checks (credentials, API connectivity, content state) are done. Now
        explore the CODE to understand the personalization setup. Gather facts — do NOT diagnose
        or fix yet.

        This project uses **${profile.name}**. Look specifically for:

        1. **Provider configuration** — Search for ${profile.provider}. Where is it? How is it
           configured (clientId/environment/plugins)? Is it wrapping the right subtree?

        2. **Middleware / SSR** — Look for middleware.ts/js, edge functions, or server-side
           personalization. ${
             profile.guide === 'optimization-overview.md'
               ? modernServerChecks
               : 'Check for preflight calls, cookie handling, and matcher config.'
           }

        3. **Component wiring and rendering boundaries** — Search for ${profile.component}, then
           enumerate every shared component or block mapper, section or page dispatcher, rich-text
           renderer, and direct entry renderer. Record which boundaries are wrapped and which
           compatible content paths remain outside personalization.

        4. **Analytics** — How are page/track/identify events emitted? ${
          profile.guide === 'optimization-overview.md'
            ? 'For the Optimization SDK, check the runtime-specific auto tracker, OptimizedEntry interaction tracking, and accepted event streams.'
            : 'For the legacy SDK, look for the insights plugin.'
        }

        5. **Rendering pipeline** — How is content fetched? What include depth?

        ## 🚩 Red flags
        - Provider missing or wrapping the wrong subtree
        - Middleware matcher that catches static assets
        - Include depth too shallow for personalization entries
        - Entry fetching that bypasses the selected SDK's manual or managed resolution boundary
        - Hydration mismatch patterns

        For each area, note the specific file paths and what you found. If something looks wrong,
        describe it but do NOT fix it.

        ## Reference: How Personalization Works
        ${refs.load('how-personalization-works.md')}

        ## Reference: SDK Guide
        ${sdkReference}
      `;
    },
    response: type({
      explorationSummary: 'string',
      concerns: 'string[]',
      'personalizableCandidates?': 'string[]',
      renderingBoundaries: 'string[]',
    }),
    save: ({ response }) => ({
      step: response,
      project: {
        explorationSummary: response.explorationSummary,
        concerns: response.concerns,
        renderingBoundaries: response.renderingBoundaries,
        ...(response.personalizableCandidates ? { personalizableCandidates: response.personalizableCandidates } : {}),
      },
    }),
    next: 'review',
  })

  .step('review', {
    prompt: ({ store, refs }) => {
      const profile = sdkProfile(store.project?.sdkFamily);
      const sdkReference = loadSdkReferences(
        store.project?.sdkFamily,
        store.project?.framework ?? 'other',
        (file) => refs.load(file),
        store.project?.packages?.packages?.optimization,
      );

      const explorationView = store.project.explorationSummary
        ? [
            `**Framework:** ${store.project.framework}`,
            `**SDK:** ${profile.name}`,
            '',
            store.project.explorationSummary,
            '',
            (store.project.concerns?.length ?? 0) > 0
              ? render.section(
                  '⚠️ Concerns from Exploration',
                  (store.project.concerns ?? []).map((c, i: number) => `${i + 1}. ${c}`).join('\n'),
                )
              : '✅ No concerns noted during exploration',
          ].join('\n')
        : 'No code exploration was performed';

      const pkg = store.project.packages;
      const packageView = pkg
        ? render.table(
            [...(pkg.packages?.ninetailed ?? []), ...(pkg.packages?.optimization ?? [])].map(
              (p: { name: string; version: string }) => ({
                Package: p.name,
                Version: p.version,
              }),
            ),
            { columns: ['Package', 'Version'] },
          ) || '*No personalization SDK packages found*'
        : 'No package data available';

      const scanned = store.steps['scan-credentials'];
      const envView = scanned
        ? render.table(
            (scanned.envVars ?? []).map((ev: { name: string; status: string; maskedValue?: string }) => ({
              Variable: ev.name,
              Status: ev.status,
              Value: ev.maskedValue ?? '—',
            })),
            { columns: ['Variable', 'Status', 'Value'] },
          )
        : 'No environment variable data available';

      const apiData = store.steps['check-api'];
      const apiView = apiData ? findingsTable(apiData.findings) : 'No API data available';

      const survey = store.steps['survey-content'];
      const surveyView = survey ? findingsTable(survey.findings) : 'No content survey performed';

      const content = store.steps['run-inspection'];
      const contentView = content
        ? [
            findingsTable(content.findings),
            '',
            content.entry?.comparison?.hasUnpublishedChanges
              ? '🔴 **UNPUBLISHED CHANGES DETECTED** — The entry has changes in preview (CPA) that are not in the published (CDA) content. This is a common cause of personalization appearing broken.'
              : '',
          ].join('\n')
        : 'No single-entry inspection performed';

      return prompt`
          Synthesize ALL diagnostic findings below into prioritized recommendations. This project
          uses ${profile.name} — keep recommendations specific to that SDK.

          For each issue found, create a recommendation:
          - **priority**: "critical" (core functionality broken), "warning" (suboptimal), "info" (suggestion)
          - **message**: specific, actionable advice
          - **category**: packages, env, provider, middleware, components, analytics, api, or content

          Overall status:
          - "pass" — everything looks good
          - "warn" — warnings but nothing blocking
          - "fail" — critical issues exist

          Be conversational — explain WHY things are wrong, not just WHAT is wrong.
          Do NOT attempt fixes or modify any files. Diagnosis only.

          When content inspection reveals unpublished changes, make that a critical recommendation
          with specific guidance: which entry to republish, and the correct publishing order
          (variants first, then experiences, then the baseline entry).

          ## Code Exploration Findings
          ${explorationView}

          ## Package Data
          ${packageView}

          ## Environment Variables
          ${envView}

          ## API Connectivity Results
          ${apiView}

          ## Content Survey Results
          ${surveyView}

          ## Single-Entry Inspection Results
          ${contentView}

          ## Reference: Environment Variables
          ${refs.load('env-var-spec.md')}

          ## Reference: Common Errors
          ${refs.load('common-errors.md')}

          ## Reference: SDK Guide
          ${sdkReference}
        `;
    },
    response: type({
      overallStatus: "'pass' | 'warn' | 'fail'",
      recommendations: Recommendation.array(),
      summary: 'string',
    }),
    save: ({ response }) => ({
      diagnosis: {
        overallStatus: response.overallStatus,
        recommendations: response.recommendations,
        summary: response.summary,
      },
    }),
    next: 'report',
  })

  .step('report', {
    prompt: ({ store }) => {
      const icon = (status: string) => {
        switch (status) {
          case 'pass':
            return '✅';
          case 'warn':
            return '⚠️';
          case 'fail':
            return '❌';
          case 'skip':
            return '⏭️';
          default:
            return '❓';
        }
      };

      const statusLabel = (s: string) => {
        switch (s) {
          case 'pass':
            return 'Healthy';
          case 'warn':
            return 'Needs Attention';
          case 'fail':
            return 'Issues Found';
          default:
            return 'Unknown';
        }
      };

      const diagnosis = store.diagnosis;
      const overallStatusVal = diagnosis.overallStatus!;
      const sections: string[] = [];

      sections.push(`# 🩺 Optimization Doctor Report\n`);
      sections.push(`## ${icon(overallStatusVal)} Overall: ${statusLabel(overallStatusVal)}\n`);
      sections.push(diagnosis.summary!);
      sections.push('---');

      if (store.project.explorationSummary) {
        sections.push(render.section('🔍 Exploration Summary', store.project.explorationSummary));
      }

      const pkg = store.project.packages;
      if (pkg) {
        const allPkgs = [...(pkg.packages?.ninetailed ?? []), ...(pkg.packages?.optimization ?? [])];
        const pkgTable =
          allPkgs.length > 0
            ? render.table(
                allPkgs.map((p: { name: string; version: string }) => ({
                  Package: p.name,
                  Version: p.version,
                })),
                { columns: ['Package', 'Version'] },
              )
            : '*No personalization SDK packages found*';

        const scanned = store.steps['scan-credentials'];
        const envTable = scanned
          ? render.table(
              (scanned.envVars ?? []).map((ev: { name: string; status: string; maskedValue?: string }) => ({
                Variable: ev.name,
                Status: ev.status,
                Value: ev.maskedValue ?? '—',
              })),
              { columns: ['Variable', 'Status', 'Value'] },
            )
          : '';

        sections.push(render.section('📦 Packages & Environment', `${pkgTable}\n\n${envTable}`));
      }

      const apiData = store.steps['check-api'];
      if (apiData) {
        sections.push(render.section('🌐 API Connectivity', findingsTable(apiData.findings)));
      }

      const survey = store.steps['survey-content'];
      if (survey) {
        sections.push(render.section('📄 Content Survey', findingsTable(survey.findings)));
      }

      const optimizationDoctor = store.steps['check-optimization-doctor'];
      if (optimizationDoctor) {
        sections.push(
          render.section(
            '🩺 Optimization doctor (live events last 15m)',
            [
              render.table(optimizationDoctorRequestRows(optimizationDoctor), { columns: ['Field', 'Value'] }),
              findingsTable(optimizationDoctor.findings),
            ].join('\n\n'),
          ),
        );
      }

      const content = store.steps['run-inspection'];
      if (content) {
        const comparisonNote = content.entry?.comparison?.hasUnpublishedChanges
          ? '\n\n🔴 **Unpublished changes detected** — see recommendations below.'
          : '';
        sections.push(
          render.section('📄 Single-Entry Inspection', `${findingsTable(content.findings)}${comparisonNote}`),
        );
      }

      const recommendations = diagnosis.recommendations!.filter((r): r is Recommendation => !!r);
      if (recommendations.length) {
        const priorityIcon: Record<string, string> = {
          critical: '🔴',
          warning: '🟡',
          info: '💡',
        };
        const recs = [...recommendations]
          .sort((a, b) => {
            const order: Record<string, number> = {
              critical: 0,
              warning: 1,
              info: 2,
            };
            return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
          })
          .map(
            (r, i) => `${i + 1}. ${priorityIcon[r.priority] ?? '•'} **[${r.priority}]** ${r.message} *(${r.category})*`,
          )
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
    response: type({ choice: "'yes' | 'no'" }),
    next: ({ response }) => (response.choice === 'yes' ? 'plan-fix' : 'done'),
  })

  .step('plan-fix', {
    prompt: ({ store, refs }) => {
      const diagnosis = store.diagnosis;
      const recs = diagnosis.recommendations!.filter((r): r is Recommendation => !!r);
      const priorityIcon: Record<string, string> = {
        critical: '🔴',
        warning: '🟡',
        info: '💡',
      };

      const refSections: Array<{ label: string; content: string }> = [];
      const categories = new Set(recs.map((r) => r.category));
      const hasCodeFix = ['provider', 'middleware', 'components', 'analytics'].some((category) =>
        categories.has(category),
      );
      if (hasCodeFix) {
        refSections.push({
          label: 'SDK Contract',
          content: loadSdkReferences(
            store.project?.sdkFamily,
            store.project?.framework ?? 'other',
            (file) => refs.load(file),
            store.project?.packages?.packages?.optimization,
          ),
        });
      }
      if (categories.has('provider'))
        refSections.push({
          label: 'Provider Patterns',
          content: refs.load('provider-patterns.md'),
        });
      if (categories.has('middleware'))
        refSections.push({
          label: 'Middleware Patterns',
          content: refs.load('middleware-patterns.md'),
        });
      if (categories.has('components'))
        refSections.push({
          label: 'Component Patterns',
          content: refs.load('component-patterns.md'),
        });
      if (categories.has('analytics'))
        refSections.push({
          label: 'Analytics Patterns',
          content: refs.load('analytics-patterns.md'),
        });
      if (categories.has('middleware'))
        refSections.push({
          label: 'SSR Guide',
          content: refs.load('ssr-guide.md'),
        });

      return [
        prompt`
          Create a plan to fix the ${recs.length} issue${recs.length !== 1 ? 's' : ''} found during diagnosis.
          For each fix, explain what file(s) you'll change and why.
          Be specific about your approach.

          For **content** category issues (unpublished entries, missing nt_experiences field, etc.),
          these cannot be fixed in code — provide step-by-step instructions for what the user
          needs to do in the Contentful web UI, including publishing order.

          Do NOT start implementing — this is the planning step only.

          ## Source and scope rules
          ${implementationGuidance({
            sdk:
              store.project?.sdkFamily === 'modern'
                ? 'optimization'
                : store.project?.sdkFamily === 'legacy'
                  ? 'ninetailed'
                  : store.project?.sdkFamily === 'both'
                    ? 'mixed'
                    : 'unknown',
          })}

          ${render.kv({
            Framework: store.project.framework,
            Project: store.project.projectPath,
            SDK: sdkProfile(store.project?.sdkFamily).name,
            'Rendering boundaries': store.project.renderingBoundaries?.join(', ') || 'none found',
          })}

          ## Reference Material
          ${refSections.map((r) => `### ${r.label}\n${r.content}`).join('\n\n---\n\n')}
        `,
        act.plan({
          summary: `Fix ${recs.length} issue${recs.length !== 1 ? 's' : ''} in ${store.project.framework} personalization setup`,
          steps: recs.map((r) => `${priorityIcon[r.priority] ?? '•'} [${r.priority}] ${r.message}`),
        }),
      ];
    },
    response: type({
      approved: 'boolean',
      plan: 'string',
      filesToModify: 'string[]',
    }),
    next: ({ response }) => (response.approved ? 'fix' : 'done'),
  })

  .step('fix', {
    prompt: ({ store, system, refs }) => {
      const diagnosis = store.diagnosis;
      const recs = diagnosis.recommendations!.filter((r): r is Recommendation => !!r);
      const priorityIcon: Record<string, string> = {
        critical: '🔴',
        warning: '🟡',
        info: '💡',
      };

      const categories = new Set(recs.map((r) => r.category));
      const refSections: Array<{ label: string; content: string }> = [];
      const hasCodeFix = ['provider', 'middleware', 'components', 'analytics'].some((category) =>
        categories.has(category),
      );
      if (hasCodeFix) {
        refSections.push({
          label: 'SDK Contract',
          content: loadSdkReferences(
            store.project?.sdkFamily,
            store.project?.framework ?? 'other',
            (file) => refs.load(file),
            store.project?.packages?.packages?.optimization,
          ),
        });
      }
      if (categories.has('packages') || categories.has('env'))
        refSections.push({
          label: 'Env Var Spec',
          content: refs.load('env-var-spec.md'),
        });
      if (categories.has('provider'))
        refSections.push({
          label: 'Provider Patterns',
          content: refs.load('provider-patterns.md'),
        });
      if (categories.has('middleware'))
        refSections.push({
          label: 'Middleware Patterns',
          content: refs.load('middleware-patterns.md'),
        });
      if (categories.has('components'))
        refSections.push({
          label: 'Component Patterns',
          content: refs.load('component-patterns.md'),
        });

      const fixPlan = store.steps['plan-fix']?.plan;
      const fixFiles = store.steps['plan-fix']?.filesToModify;

      return [
        system`Apply each fix methodically. Update the checklist status as you complete each one. Match the project's existing code style. For content-category issues, provide clear step-by-step instructions for the user to follow in the Contentful UI rather than attempting code changes.`,
        prompt`
          Implement the fixes from the approved plan. For each fix:

          - **Package issues** → use the installPackages action
          - **Env var issues** → use the writeEnvFile action
          - **Code issues** → edit files directly
          - **Content issues** (unpublished entries, missing fields) → provide Contentful UI instructions

          After all fixes, the setup will be re-verified automatically.
          In your structured result, list the evidence stages changed by the fix. Environment,
          package, or source changes are local-integrity; SDK destination changes are
          credential-connectivity; Contentful entry/publish work is cms-graph; browser/event
          changes are runtime-transport; targeting/rendering changes are personalization-outcome.

          ${fixPlan ? `**Plan:** ${fixPlan}` : ''}
          ${fixFiles?.length ? `**Files to modify:** ${fixFiles.join(', ')}` : ''}

          ## Source and scope rules
          ${implementationGuidance({
            sdk:
              store.project?.sdkFamily === 'modern'
                ? 'optimization'
                : store.project?.sdkFamily === 'legacy'
                  ? 'ninetailed'
                  : store.project?.sdkFamily === 'both'
                    ? 'mixed'
                    : 'unknown',
          })}

          ## Reference Material
          ${refSections.map((r) => `### ${r.label}\n${r.content}`).join('\n\n---\n\n')}
        `,
        act.checklist({
          create: recs.map((r) => ({
            title: `${priorityIcon[r.priority] ?? '•'} [${r.priority}] ${r.message}`,
            status: 'pending' as const,
          })),
        }),
      ];
    },
    response: type({
      summary: 'string',
      changedStages: ValidationStage.array(),
    }),
    next: ({ response }) =>
      beginDoctorRerunStep(
        resolveDoctorRerunStages(response.changedStages.length > 0 ? response.changedStages : ['local-integrity']),
      ),
  })

  .step('begin-local-rerun', {
    prompt: prompt`
      Continue immediately with the affected validation ladder, beginning at local integrity.
      Do not ask the user a question. Return the acknowledgement object so the deterministic
      checks can run in sequence. Return {}.
    `,
    response: type({}),
    next: 're-verify-code',
  })

  .step('begin-connectivity-rerun', {
    prompt: prompt`
      Continue immediately with the affected validation ladder, beginning at credential and
      destination connectivity. Do not ask the user a question. Return {}.
    `,
    response: type({}),
    next: 're-check-api',
  })

  .step('begin-cms-rerun', {
    prompt: prompt`
      Continue immediately with the affected validation ladder, beginning with the GET-only CMS
      graph survey. Do not ask the user a question. Return {}.
    `,
    response: type({}),
    next: 're-survey-content',
  })

  .step('begin-runtime-rerun', {
    prompt: prompt`
      Continue immediately with the affected validation ladder, beginning with the optional
      aggregate Live Events snapshot. Do not ask the user a question. Return {}.
    `,
    response: type({}),
    next: 're-capture-live-events',
  })

  .step('re-verify-code', {
    prompt: ({ store }) => prompt`
      Re-run the project's relevant build, typecheck, test, and lint commands after the doctor fix.
      Verify the repaired static wiring and the original symptom's regression path. Do not claim
      success from code inspection alone, and do not fix failures in this step.

      Project: ${store.project?.projectPath ?? '.'}
      Fix: ${recordedDoctorFixSummary(store.steps)}
    `,
    response: type({
      status: "'pass' | 'fail'",
      summary: 'string',
      checksRun: 'string[]',
      failures: 'string[]',
    }),
    next: ({ response, attempts }) => (response.status === 'fail' && attempts < 3 ? 'fix' : 're-verify-local'),
  })

  .step('re-verify-local', {
    action: {
      mapInput: ({ store }) => ({
        projectPath: store.project?.projectPath ?? '.',
      }),
      run: validateLocalSetup,
    },
    next: 're-check-api',
  })

  .step('re-check-api', {
    action: {
      mapInput: ({ store }) => {
        const refreshed = store.steps['re-verify-local']?.credentials;
        const original = store.credentials;
        return {
          ...(refreshed?.personalization?.apiKey
            ? { apiKey: refreshed.personalization.apiKey }
            : original?.personalization?.apiKey
              ? { apiKey: original.personalization.apiKey }
              : {}),
          ninetailedEnvironment:
            refreshed?.personalization?.environment ?? original?.personalization?.environment ?? 'main',
          ...(refreshed?.optimization?.clientId
            ? { optimizationClientId: refreshed.optimization.clientId }
            : original?.optimization?.clientId
              ? { optimizationClientId: original.optimization.clientId }
              : {}),
          optimizationEnvironment:
            refreshed?.optimization?.environment ?? original?.optimization?.environment ?? 'main',
        };
      },
      run: checkApiConnectivity,
    },
    next: 're-survey-content',
  })

  .step('re-survey-content', {
    action: {
      mapInput: ({ store }) => {
        const refreshed = store.steps['re-verify-local']?.credentials?.contentful;
        const original = store.credentials?.contentful;
        return {
          spaceId: refreshed?.spaceId ?? original?.spaceId ?? '',
          environment: refreshed?.environment ?? original?.environment ?? 'master',
          ...(refreshed?.accessToken
            ? { accessToken: refreshed.accessToken }
            : original?.accessToken
              ? { accessToken: original.accessToken }
              : {}),
          ...(refreshed?.previewToken
            ? { previewToken: refreshed.previewToken }
            : original?.previewToken
              ? { previewToken: original.previewToken }
              : {}),
        };
      },
      run: surveyContent,
    },
    next: 're-capture-live-events',
  })

  .step('re-capture-live-events', {
    action: {
      mapInput: ({ store }) => {
        const refreshed = store.steps['re-verify-local']?.credentials?.contentful;
        const original = store.credentials?.contentful;
        return {
          spaceId: refreshed?.spaceId ?? original?.spaceId ?? '',
          environmentId: refreshed?.environment ?? original?.environment ?? 'master',
          ...(refreshed?.managementToken
            ? { managementToken: refreshed.managementToken }
            : original?.managementToken
              ? { managementToken: original.managementToken }
              : {}),
        };
      },
      run: checkOptimizationDoctor,
    },
    next: 're-confirm-runtime',
  })

  .step('re-confirm-runtime', {
    prompt: ({ store }) => {
      const refreshed = store.steps['re-verify-local']?.credentials?.contentful;
      const original = store.credentials?.contentful;
      const liveEventsUrl = buildLiveEventsUrl(
        refreshed?.spaceId ?? original?.spaceId,
        refreshed?.environment ?? original?.environment ?? 'master',
      );
      const scenario = store.steps['re-survey-content']?.testScenario ?? store.steps['survey-content']?.testScenario;
      const liveEventRows = liveEventsDeltaRows(
        store.steps['check-optimization-doctor']?.liveEvents,
        store.steps['re-capture-live-events']?.liveEvents,
      );
      const liveEventComparison = store.steps['re-capture-live-events']
        ? render.section(
            'Before/after aggregate counts',
            `${render.table(liveEventRows, { columns: ['Event', 'Baseline', 'Current', 'Delta'] })}\n\n${store.steps['check-optimization-doctor']?.status === 'fail' || store.steps['re-capture-live-events']?.status === 'fail' ? 'One or both aggregate endpoint calls failed, so unavailable cells are not observed zero-event counts. Fix endpoint access before comparing.' : 'These space-wide deltas are supporting evidence only; correlate them with the reproduction run.'}`,
          )
        : 'No automated before/after comparison was required for the affected evidence stages.';

      return [
        prompt`
          Ask the user to reproduce the original symptom and validate the repaired path. Keep the
          Live Events link for product context even when the automated endpoint worked. Prefer a
          known existing trigger or preview panel; do not invent a query parameter for an audience
          whose server-side rules are unknown. Consent changes, navigation, and interactions must
          remain intentional user actions.
        `,
        view(
          'Doctor regression validation',
          [
            liveEventsUrl
              ? `[Open Contentful Live Events](${liveEventsUrl})`
              : 'Open the Personalization app and navigate to Analytics → Live Events.',
            scenario?.summary ?? 'Use the same route, profile state, and trigger that reproduced the original problem.',
            liveEventComparison,
          ].join('\n\n'),
        ),
        act.askUser({
          type: 'structured',
          question: 'What did the regression run prove?',
          options: [
            { value: 'confirmed-end-to-end', label: '✅ Original symptom fixed end to end' },
            { value: 'confirmed-transport', label: '📡 Runtime event confirmed only' },
            { value: 'failed', label: '❌ Original symptom still reproduces' },
            { value: 'unavailable', label: '⏸️ Cannot validate now' },
          ],
        }),
      ];
    },
    response: type({
      choice: "'confirmed-end-to-end' | 'confirmed-transport' | 'failed' | 'unavailable'",
    }),
    next: ({ response }) => (response.choice === 'unavailable' ? 're-validation-disposition' : 'validation-report'),
  })

  .step('re-validation-disposition', {
    prompt: act.askUser({
      type: 'structured',
      question: 'Why is the regression run unavailable?',
      options: [
        {
          value: 'defer',
          label: '⏭️ Defer by choice',
          description: 'Keep the repaired implementation while live regression evidence remains unresolved',
        },
        {
          value: 'blocked',
          label: '🚧 Authoring or publishing blocked',
          description: 'Permissions, ownership, publishing, or organizational constraints prevent reproduction',
        },
      ],
    }),
    response: type({ choice: "'defer' | 'blocked'" }),
    next: 'validation-report',
  })

  .step('validation-report', {
    prompt: ({ store }) => {
      const rerunStages = resolveDoctorRerunStages(recordedDoctorChangedStages(store.steps));
      const evidence: ValidationStageEvidence[] = [];

      if (rerunStages.includes('local-integrity') && store.steps['re-verify-local']) {
        const local = localSetupEvidence(store.steps['re-verify-local']);
        if (store.steps['re-verify-code']) {
          local.findings.push({
            item: 'Doctor build and static regression',
            status: store.steps['re-verify-code'].status,
            detail: store.steps['re-verify-code'].summary,
          });
          if (store.steps['re-verify-code'].status === 'fail') local.status = 'fail';
        }
        evidence.push(local);
      }
      if (rerunStages.includes('credential-connectivity') && store.steps['re-check-api']) {
        evidence.push(connectivityEvidence(store.steps['re-check-api']));
      }
      if (rerunStages.includes('cms-graph') && store.steps['re-survey-content']) {
        evidence.push(cmsGraphEvidence(store.steps['re-survey-content']));
      }

      const choice = store.steps['re-validation-disposition']?.choice ?? store.steps['re-confirm-runtime']?.choice;
      if (choice === 'confirmed-end-to-end') {
        evidence.push(...manualRuntimeEvidence('end-to-end', 'diagnostic-repair'));
      } else if (choice === 'confirmed-transport') {
        evidence.push(...manualRuntimeEvidence('transport-only', 'diagnostic-repair'));
      } else if (choice === 'defer') {
        evidence.push(...manualRuntimeEvidence('deferred', 'diagnostic-repair'));
      } else if (choice === 'blocked') {
        evidence.push(...manualRuntimeEvidence('blocked', 'diagnostic-repair'));
      } else if (choice === 'failed') {
        evidence.push(
          {
            stage: 'runtime-transport',
            status: 'fail',
            source: 'manual-confirmation',
            summary: 'The user reproduced the original runtime symptom after the fix.',
            findings: [],
          },
          {
            stage: 'personalization-outcome',
            status: 'fail',
            source: 'manual-confirmation',
            summary: 'The expected repaired personalization outcome was not observed.',
            findings: [],
          },
        );
      } else if (store.steps['re-capture-live-events']) {
        evidence.push(aggregateLiveEventsEvidence(store.steps['re-capture-live-events']));
      }

      const decision =
        choice === 'blocked'
          ? ('cannot-author-or-trigger' as const)
          : choice === 'defer'
            ? ('defer-live-validation' as const)
            : ('continue' as const);
      const finalState = deriveValidationFinalState({
        profile: 'diagnostic-repair',
        evidence,
        decision,
        requiredStages: rerunStages,
      });
      const sections = [
        `# ${describeValidationFinalState(finalState)}`,
        render.section('Fix applied', recordedDoctorFixSummary(store.steps)),
        render.section(
          'Rerun evidence',
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
        finalState === 'validated-end-to-end'
          ? 'The original repair and its affected downstream evidence were validated.'
          : 'The report keeps the exact failed, blocked, deferred, or unavailable evidence as the resume point.',
      ];
      const machineResult = {
        profile: 'diagnostic-repair' as const,
        finalState,
        evidence,
        rerunStages,
        summary: describeValidationFinalState(finalState),
      };

      return [
        'Present the doctor validation report exactly as rendered. Do not call the repair successful when required rerun evidence is unresolved.',
        view('Doctor validation report', sections.join('\n\n')),
        `After presenting the report, return this exact structured result to the workflow protocol without changing its values:\n${JSON.stringify(machineResult)}`,
      ];
    },
    response: ValidationSummary,
    next: terminal,
  })

  .step('done', {
    prompt: ({ store }) => {
      const diagnosis = store.diagnosis;
      const askFixed = store.steps['ask-fixed'];

      if (askFixed?.working) {
        return prompt`
          The user manually confirmed that the original symptom stopped after the infrastructure
          fix. State that concrete result without upgrading it to a full end-to-end validation.
          Mention that they can run the same evidence ladder later for CMS graph, runtime transport,
          and personalization outcome proof. Keep it brief.
        `;
      }

      if (!diagnosis) {
        return prompt`
          The user has the programmatic check results and chose to stop here. Thank them warmly
          and mention they can re-run the doctor, investigate the code, or come back anytime.
          Keep it to 2-3 sentences.
        `;
      }

      const cameFromReport = !store.steps['plan-fix'];
      const cameFromPlanFix = store.steps['plan-fix'] && !store.steps['plan-fix']?.approved;

      if (cameFromReport) {
        return prompt`
          The user has the diagnostic report and chose not to proceed with fixes.
          Thank them warmly and mention they can re-run the doctor anytime if issues
          come up later. Keep it to 2-3 sentences — brief and friendly.
          Do NOT repeat the report findings.
        `;
      }

      if (cameFromPlanFix) {
        return prompt`
          The user reviewed the fix plan but chose not to proceed with implementation.
          Acknowledge their choice, remind them the diagnostic report is still available,
          and mention they can re-run the doctor anytime. Keep it to 2-3 sentences.
          Do NOT repeat the report findings.
        `;
      }

      return prompt`
        The diagnostic flow ended without applying an approved fix. State that no repair was
        validated and keep the report's unresolved evidence available as the resume point.
      `;
    },
    next: terminal,
  })

  .build();
