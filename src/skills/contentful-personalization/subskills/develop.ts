import { skill, type, prompt, terminal, render, act, view } from '@contentful/skill-kit';
import { checkApiConnectivity } from '../actions/check-api.js';
import { checkOptimizationDoctor } from '../actions/check-optimization-doctor.js';
import { surveyContent } from '../actions/survey-content.js';
import { validateLocalSetup } from '../actions/validate-local-setup.js';
import { getOptimizationReferenceFiles } from '../optimization-references.js';
import { implementationGuidance } from '../implementation-guidance.js';
import { ValidationSummary, type ValidationProfile, type ValidationStageEvidence } from '../schemas.js';
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
  filterValidationEvidence,
  getEvidenceRerunStages,
  getValidationRequirements,
} from '../validation/policy.js';
import { VERSION } from '../version.js';

type DetectedSdk = 'ninetailed' | 'optimization' | 'both' | 'unknown';
type DevelopmentSdk = 'ninetailed' | 'optimization';
type DevelopmentScope = 'existing-integration' | 'new-integration';
type DevelopmentTaskType = 'personalize-component' | 'create-experiment' | 'add-analytics' | 'add-merge-tag' | 'other';

export function resolveDevelopmentValidationProfile(
  taskType: DevelopmentTaskType,
  mergeTagAuthoring: 'cms' | 'code' | 'unknown' = 'unknown',
): ValidationProfile {
  switch (taskType) {
    case 'personalize-component':
      return 'component-extension';
    case 'create-experiment':
      return 'experiment-authoring';
    case 'add-analytics':
      return 'analytics-extension';
    case 'add-merge-tag':
      return mergeTagAuthoring === 'code' ? 'merge-tag-code-extension' : 'merge-tag-extension';
    default:
      return 'full-setup';
  }
}

function firstRemoteValidationStage(
  taskType: DevelopmentTaskType,
  mergeTagAuthoring: 'cms' | 'code' | 'unknown',
): string {
  if (taskType === 'add-analytics' || taskType === 'other') return 'check-connectivity';
  if (taskType === 'add-merge-tag' && mergeTagAuthoring === 'code') return 'runtime-validation';
  return 'survey-content';
}

export function resolveDevelopmentSdk({
  sdkInUse,
  targetSdk,
  workScope,
}: {
  sdkInUse: DetectedSdk;
  targetSdk: DevelopmentSdk;
  workScope: DevelopmentScope;
}): DevelopmentSdk {
  if (
    workScope === 'existing-integration' &&
    targetSdk === 'ninetailed' &&
    (sdkInUse === 'ninetailed' || sdkInUse === 'both')
  ) {
    return 'ninetailed';
  }

  return 'optimization';
}

export default skill({
  name: 'extend-existing',
  version: VERSION,
  description:
    'Extend an explicitly existing, working Contentful personalization integration. ' +
    'Use only for scoped changes such as personalizing another component, adding an experiment, ' +
    'or wiring analytics into the installed SDK. Not for first-time, project-wide, or unknown-state ' +
    'implementation requests; use onboard for those.',
  entry: 'analyze',

  params: type({
    'userQuery?': 'string',
  }),
})
  .step('analyze', {
    prompt: ({ params }) => prompt`
      Analyze the codebase to understand the existing personalization setup
      and determine what the user wants to accomplish.

      ## What to investigate

      1. **SDKs in use** — Is the repository using @ninetailed/experience.js,
         @contentful/optimization, both, or neither?
      2. **Work scope and target SDK** — Does the request modify an existing integration, or create
         a new independent integration? Which SDK owns the target files?
      3. **Component mapper** — How does the project map content types to components?
         (ContentTypeMap, BlockRenderer, etc.)
      4. **Provider configuration** — Where is it? What plugins are registered?
      5. **User's task** — What do they want? (personalize a component, add analytics,
         create an experiment, add a merge tag)
      6. **Target files** — Which specific files need to change?
      7. **Target merge tag** — For a CMS-authored merge-tag task, identify the exact Contentful
         entry ID or nt_mergetag_id when the request or existing code makes it knowable. Do not
         substitute the ID of some other merge tag merely because it already exists.
      8. **Analytics contract** — For analytics tasks, list every event that this change must emit
         and every destination that must receive it. Keep SDK admission and third-party delivery
         as separate checks.

      Focus on understanding the existing patterns so your changes will be consistent.
      Choose a Ninetailed target only when the requested change acts on an existing Ninetailed
      integration. If neither SDK is installed, or the work is a new independent integration, the
      target is @contentful/optimization. When both families are present, use the target files to
      identify which existing integration the task actually changes.
      Spend no more than a few minutes exploring — get the key facts and move on.

      Do NOT start making changes or create a plan. Do NOT ask the user questions.
      Just analyze and report what you find.

      ${params?.userQuery ? `\nUser's request: "${params.userQuery}"` : ''}
    `,
    response: type({
      taskType: "'personalize-component' | 'create-experiment' | 'add-analytics' | 'add-merge-tag' | 'other'",
      sdkInUse: "'ninetailed' | 'optimization' | 'both' | 'unknown'",
      targetSdk: "'ninetailed' | 'optimization'",
      workScope: "'existing-integration' | 'new-integration'",
      optimizationRuntime:
        "'react-web' | 'nextjs-app-router' | 'nextjs-pages-router' | 'web' | 'node' | 'react-native' | 'unknown'",
      optimizationArchitecture: "'client-only' | 'hybrid-ssr' | 'server-only' | 'unknown'",
      framework: 'string',
      projectPath: 'string',
      mergeTagAuthoring: "'cms' | 'code' | 'unknown'",
      'targetMergeTagId?': 'string',
      analyticsEvents: 'string[]',
      analyticsDestinations: 'string[]',
      targetFiles: 'string[]',
      analysis: 'string',
    }),
    next: 'capture-local-baseline',
  })

  .step('capture-local-baseline', {
    action: {
      mapInput: ({ store }) => ({
        projectPath: store.steps.analyze?.projectPath ?? '.',
        profile: resolveDevelopmentValidationProfile(
          store.steps.analyze?.taskType ?? 'other',
          store.steps.analyze?.mergeTagAuthoring ?? 'unknown',
        ),
      }),
      run: validateLocalSetup,
    },
    // This is a baseline, not a gate. A scoped extension may be able to proceed even when the
    // local shell lacks optional credentials; the final profile decides which evidence matters.
    next: 'plan',
  })

  .step('plan', {
    prompt: ({ store, act, refs }) => {
      const targetSdk = resolveDevelopmentSdk({
        sdkInUse: store.steps.analyze.sdkInUse,
        targetSdk: store.steps.analyze.targetSdk,
        workScope: store.steps.analyze.workScope,
      });
      const isOptimization = targetSdk === 'optimization';
      const sdkReferenceFiles = isOptimization
        ? getOptimizationReferenceFiles({
            framework: store.steps.analyze.framework,
            runtime: store.steps.analyze.optimizationRuntime,
            architecture: store.steps.analyze.optimizationArchitecture,
          })
        : ['sdk-legacy-guide.md'];
      const sdkRefs = sdkReferenceFiles.map((file) => refs.load(file)).join('\n\n---\n\n');

      const taskDescriptions: Record<string, string> = isOptimization
        ? {
            'personalize-component': 'Resolve the entry through the runtime Optimization SDK',
            'create-experiment': 'Wire variant resolution and verified interaction tracking',
            'add-analytics': 'Forward accepted Optimization events with message-id deduplication',
            'add-merge-tag': 'Resolve guarded merge-tag entries against the current profile',
            other: 'Implement the requested Optimization SDK changes',
          }
        : {
            'personalize-component': 'Add Experience/Personalize wrapper and update mapper',
            'create-experiment': 'Set up A/B test with variant components and tracking',
            'add-analytics': 'Wire analytics plugin and event tracking',
            'add-merge-tag': 'Add merge tag support for dynamic content',
            other: 'Implement the requested changes',
          };
      const taskDesc = taskDescriptions[store.steps.analyze.taskType] ?? taskDescriptions['other'];

      return [
        prompt`
          Create an implementation plan for this task. For each file that needs
          to change, explain WHAT will change and WHY — not just the filename.

          Do NOT start implementing. This is the planning step only.

          ## Source and scope rules
          ${implementationGuidance({ sdk: isOptimization ? 'optimization' : 'ninetailed' })}

          ${render.kv({
            Task: store.steps.analyze.taskType.replace(/-/g, ' '),
            SDK: targetSdk,
            Framework: store.steps.analyze.framework,
          })}

          ## SDK Reference
          ${sdkRefs}

          ${isOptimization ? '' : `## Contentful Integration\n${refs.load('contentful-integration-guide.md')}`}
        `,
        act.plan({
          summary: `${taskDesc} in ${store.steps.analyze.framework} project`,
          steps: store.steps.analyze.targetFiles.map((f) => `📝 ${f} — ${taskDesc}`),
        }),
      ];
    },
    response: type({
      approved: 'boolean',
      plan: 'string',
      filesToModify: 'string[]',
    }),
    next: ({ response }) => (response.approved ? 'implement' : 'declined'),
  })

  .step('declined', {
    prompt: prompt`
      The user declined the implementation plan. Thank them briefly and mention
      they can re-run this skill anytime or adjust the approach. Keep it to
      2-3 sentences — friendly but concise. Do NOT re-explain the plan.
    `,
    next: terminal,
  })

  .step('implement', {
    prompt: ({ store, refs }) => {
      const targetSdk = resolveDevelopmentSdk({
        sdkInUse: store.steps.analyze.sdkInUse,
        targetSdk: store.steps.analyze.targetSdk,
        workScope: store.steps.analyze.workScope,
      });
      const isOptimization = targetSdk === 'optimization';
      const refSections: Array<{ label: string; content: string }> = [];

      if (isOptimization) {
        getOptimizationReferenceFiles({
          framework: store.steps.analyze.framework,
          runtime: store.steps.analyze.optimizationRuntime,
          architecture: store.steps.analyze.optimizationArchitecture,
        }).forEach((file) => {
          refSections.push({
            label: file === 'optimization-shared.md' ? 'Shared SDK Contract' : 'Runtime SDK Contract',
            content: refs.load(file),
          });
        });
      } else {
        refSections.push({
          label: 'Existing Legacy Deployment Reference',
          content: refs.load('sdk-legacy-guide.md'),
        });
        refSections.push({
          label: 'Implementation Examples',
          content: refs.load('implementation-examples.md'),
        });
        if (store.steps.analyze.taskType === 'add-analytics') {
          refSections.push({
            label: 'Analytics & Preview',
            content: refs.load('analytics-and-preview.md'),
          });
        }
        if (store.steps.analyze.taskType === 'personalize-component') {
          refSections.push({
            label: 'Component Patterns',
            content: refs.load('component-patterns.md'),
          });
        }
      }

      return prompt`
        Implement the approved plan. Match the project's existing code style
        and patterns — do not introduce a different convention.

        ${render.kv({
          Task: store.steps.analyze.taskType.replace(/-/g, ' '),
          SDK: targetSdk,
          Files: store.steps.analyze.targetFiles.join(', '),
        })}

        ${store.steps.plan?.plan ? `\n**Plan:** ${store.steps.plan.plan}` : ''}

        ## Source and scope rules
        ${implementationGuidance({ sdk: isOptimization ? 'optimization' : 'ninetailed' })}

        After making changes, briefly summarize what you did and list all modified files.

        ## Reference Material
        ${refSections.map((r) => `### ${r.label}\n${r.content}`).join('\n\n---\n\n')}
      `;
    },
    response: type({
      filesModified: 'string[]',
      summary: 'string',
    }),
    next: 'verify-code',
  })

  .step('verify-code', {
    prompt: ({ store, refs }) => prompt`
      Validate the scoped implementation with the project's existing build, typecheck, test, and
      lint commands where available. Then inspect the exact changed path against the relevant SDK
      runtime contract. Do not fix failures in this step.

      ${render.kv({
        Project: store.steps.analyze.projectPath,
        Task: store.steps.analyze.taskType,
        Files: store.steps.implement?.filesModified?.join(', ') ?? store.steps.analyze.targetFiles.join(', '),
      })}

      Check only obligations relevant to this change, but include baseline/fallback behavior and
      one event owner whenever the task affects rendered personalization or tracking.

      ${refs.load('common-errors.md')}
    `,
    response: type({
      status: "'pass' | 'fail'",
      summary: 'string',
      checksRun: 'string[]',
      failures: 'string[]',
    }),
    next: ({ response }) => (response.status === 'pass' ? 'validate-local' : 'fix-validation'),
  })

  .step('fix-validation', {
    prompt: ({ store, refs }) => prompt`
      Repair the failed validation evidence for this scoped change, then return to the same checks.
      Do not broaden the implementation beyond the approved task.

      Static failures: ${(store.steps['verify-code']?.failures ?? []).join('; ') || 'none'}
      ${refs.load('common-errors.md')}
    `,
    next: 'verify-code',
  })

  .step('validate-local', {
    action: {
      mapInput: ({ store }) => ({
        projectPath: store.steps.analyze?.projectPath ?? '.',
        profile: resolveDevelopmentValidationProfile(
          store.steps.analyze?.taskType ?? 'other',
          store.steps.analyze?.mergeTagAuthoring ?? 'unknown',
        ),
      }),
      run: validateLocalSetup,
    },
    next: ({ actionResult, attempts }) => {
      if (actionResult?.status !== 'pass' && attempts < 3) return 'fix-local-validation';
      return 'review-credentials';
    },
  })

  .step('review-credentials', {
    prompt: ({ store }) => credentialReviewPrompt(store.steps['validate-local']?.credentials),
    response: CredentialReviewResponse,
    next: ({ response, store }) =>
      response.choice === 'rescan'
        ? 'validate-local'
        : response.choice === 'manual-only'
          ? 'runtime-validation'
          : firstRemoteValidationStage(
              store.steps.analyze?.taskType ?? 'other',
              store.steps.analyze?.mergeTagAuthoring ?? 'unknown',
            ),
  })

  .step('fix-local-validation', {
    prompt: ({ store, refs }) => prompt`
      Repair the local package, environment, or credential-exposure failures below without
      broadening the approved scoped implementation. Then rerun build/static and local checks.

      ${render.table(
        (store.steps['validate-local']?.findings ?? []).map((finding) => ({
          Check: finding.item,
          Status: finding.status,
          Detail: finding.detail,
        })),
        { columns: ['Check', 'Status', 'Detail'] },
      )}

      ${refs.load('common-errors.md')}
    `,
    next: 'verify-code',
  })

  .step('check-connectivity', {
    action: {
      mapInput: ({ store }) => ({
        ...(store.steps['validate-local']?.credentials?.personalization?.apiKey
          ? { apiKey: store.steps['validate-local'].credentials.personalization.apiKey }
          : {}),
        ninetailedEnvironment: store.steps['validate-local']?.credentials?.personalization?.environment ?? 'main',
        ...(store.steps['validate-local']?.credentials?.optimization?.clientId
          ? { optimizationClientId: store.steps['validate-local'].credentials.optimization.clientId }
          : {}),
        optimizationEnvironment: store.steps['validate-local']?.credentials?.optimization?.environment ?? 'main',
      }),
      run: checkApiConnectivity,
    },
    next: ({ store }) => (store.steps.analyze?.taskType === 'other' ? 'survey-content' : 'capture-live-events'),
  })

  .step('survey-content', {
    action: {
      mapInput: ({ store }) => ({
        spaceId: store.steps['validate-local']?.credentials?.contentful?.spaceId ?? '',
        environment: store.steps['validate-local']?.credentials?.contentful?.environment ?? 'master',
        ...(store.steps['validate-local']?.credentials?.contentful?.accessToken
          ? { accessToken: store.steps['validate-local'].credentials.contentful.accessToken }
          : {}),
        ...(store.steps['validate-local']?.credentials?.contentful?.previewToken
          ? { previewToken: store.steps['validate-local'].credentials.contentful.previewToken }
          : {}),
      }),
      run: surveyContent,
    },
    next: 'capture-live-events',
  })

  .step('capture-live-events', {
    action: {
      mapInput: ({ store }) => {
        const credentials = store.steps['validate-local']?.credentials;
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
    next: 'runtime-validation',
  })

  .step('runtime-validation', {
    prompt: ({ store }) => {
      const profile = resolveDevelopmentValidationProfile(
        store.steps.analyze.taskType,
        store.steps.analyze.mergeTagAuthoring,
      );
      const credentials = store.steps['validate-local']?.credentials?.contentful;
      const liveEventsUrl = buildLiveEventsUrl(credentials?.spaceId, credentials?.environment ?? 'master');
      const scenario = store.steps['survey-content']?.testScenario;
      const requirements = getValidationRequirements(profile);
      const requiresRuntimeTransport = requirements['runtime-transport'] !== 'not-applicable';
      const analyticsEvents = store.steps.analyze.analyticsEvents ?? [];
      const analyticsDestinations = store.steps.analyze.analyticsDestinations ?? [];
      const liveEvents = store.steps['capture-live-events'];
      const requestRows = optimizationDoctorRequestRows(liveEvents);
      const targetEvidence: Record<ValidationProfile, string> = {
        'full-setup': 'a correlated page event plus the selected experience and rendered variant',
        'component-extension':
          'the target component, selected experience/variant, rendered entry metadata, and component exposure after intentional consent',
        'analytics-extension': 'every expected accepted event and each intended analytics destination',
        'experiment-authoring':
          'the authored experience, audience or all-visitors qualification, selected variant, rendered result, and configured metric event',
        'merge-tag-extension': 'the CMS merge tag resolving against the current profile and its fallback',
        'merge-tag-code-extension':
          'the code-authored merge tag resolving against the current profile and its fallback',
        'diagnostic-repair': 'the repaired symptom and its downstream regression evidence',
      };

      return [
        prompt`
          Present this validation target and ask the user to run the strongest practical check.
          ${requiresRuntimeTransport ? 'Use Live Events as runtime context even when no Management token is available.' : 'Do not use Live Events for this profile because runtime event transport is not part of its evidence target.'}
          Do not imply that recent aggregate counts belong to this run, and do not force consent,
          navigation, clicks, audience changes, or CMS authoring. For merge tags, require both the
          target-profile value and the missing-value fallback before accepting outcome confirmation.
          If the automated check returned HTTP 401, state only that the endpoint rejected the exact
          request shown. Do not say the token is expired, incorrectly scoped, or missing access
          unless separate evidence establishes that diagnosis.
        `,
        view(
          'Scoped personalization validation',
          [
            render.kv({
              Profile: profile,
              'Evidence target': targetEvidence[profile],
              Scenario: scenario?.summary ?? 'Use the existing target and its known trigger or preview panel.',
            }),
            profile === 'analytics-extension'
              ? render.section(
                  'Analytics checklist',
                  [
                    `SDK admission / Live Events: ${analyticsEvents.join(', ') || 'every event named in the approved task'}`,
                    `External delivery: ${analyticsDestinations.join(', ') || 'every destination named in the approved task'}`,
                    'Confirm both the SDK-side event and the destination-side receipt (network request, destination debugger, or analytics dashboard) before selecting full confirmation.',
                  ].join('\n'),
                )
              : '',
            requiresRuntimeTransport
              ? liveEventsUrl
                ? `[Open Contentful Live Events](${liveEventsUrl})`
                : 'Open the Personalization app and navigate to Analytics → Live Events.'
              : 'Live Events is not applicable. Validate both the resolved value and fallback in the rendered application.',
            liveEvents
              ? render.section(
                  'Automated Live Events check',
                  [
                    render.table(requestRows, { columns: ['Field', 'Value'] }),
                    render.table(
                      liveEvents.findings.map((finding) => ({
                        Check: finding.item,
                        Status: finding.status,
                        Detail: finding.detail,
                      })),
                      { columns: ['Check', 'Status', 'Detail'] },
                    ),
                  ].join('\n\n'),
                )
              : 'Automated API validation was skipped by request.',
          ].join('\n\n'),
        ),
        act.askUser({
          type: 'structured',
          question: 'What did the scoped validation confirm?',
          options: requiresRuntimeTransport
            ? profile === 'analytics-extension'
              ? [
                  { value: 'confirmed-end-to-end', label: '✅ All events + destinations confirmed' },
                  { value: 'confirmed-transport', label: '📡 SDK events only' },
                  ...(liveEvents ? [{ value: 'check-again', label: '🔄 Triggered traffic — compare counts' }] : []),
                  { value: 'unavailable', label: '⏸️ Cannot validate now' },
                ]
              : [
                  { value: 'confirmed-end-to-end', label: '✅ Expected outcome confirmed' },
                  { value: 'confirmed-transport', label: '📡 Runtime event only' },
                  ...(liveEvents ? [{ value: 'check-again', label: '🔄 Triggered traffic — compare counts' }] : []),
                  { value: 'unavailable', label: '⏸️ Cannot validate now' },
                ]
            : [
                { value: 'confirmed-end-to-end', label: '✅ Value and fallback confirmed' },
                { value: 'unavailable', label: '⏸️ Cannot validate both paths now' },
              ],
        }),
      ];
    },
    response: type({
      choice: "'confirmed-end-to-end' | 'confirmed-transport' | 'check-again' | 'unavailable'",
    }),
    next: ({ response }) =>
      response.choice === 'check-again'
        ? 'capture-live-events-after'
        : response.choice === 'unavailable'
          ? 'validation-disposition'
          : 'report',
  })

  .step('capture-live-events-after', {
    action: {
      mapInput: ({ store }) => {
        const credentials = store.steps['validate-local']?.credentials;
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
      const before = store.steps['capture-live-events']?.liveEvents;
      const after = store.steps['capture-live-events-after']?.liveEvents;
      const rows = liveEventsDeltaRows(before, after);

      return [
        'Explain that these space-wide deltas are supporting evidence and require correlation with the run the user just performed.',
        view('Live Events comparison', render.table(rows, { columns: ['Event', 'Baseline', 'Current', 'Delta'] })),
        act.askUser({
          type: 'structured',
          question: 'What did this run confirm?',
          options: [
            { value: 'confirmed-end-to-end', label: '✅ Expected outcome confirmed' },
            { value: 'confirmed-transport', label: '📡 Runtime event only' },
            { value: 'retry', label: '🔄 Try one more run' },
            { value: 'unavailable', label: '⏸️ Cannot validate now' },
          ],
        }),
      ];
    },
    response: type({
      choice: "'confirmed-end-to-end' | 'confirmed-transport' | 'retry' | 'unavailable'",
    }),
    next: ({ response, attempts }) =>
      response.choice === 'retry' && attempts < 3
        ? 'capture-live-events'
        : response.choice === 'unavailable'
          ? 'validation-disposition'
          : 'report',
  })

  .step('validation-disposition', {
    prompt: ({ store }) => {
      const profile = resolveDevelopmentValidationProfile(
        store.steps.analyze.taskType,
        store.steps.analyze.mergeTagAuthoring,
      );
      const cmsApplies = getValidationRequirements(profile)['cms-graph'] !== 'not-applicable';
      return act.askUser({
        type: 'structured',
        question: 'Why is scoped validation unavailable?',
        options: [
          {
            value: 'defer',
            label: '⏭️ Defer by choice',
            description: 'Finish the scoped change while retaining unresolved validation evidence',
          },
          {
            value: 'blocked',
            label: cmsApplies ? '🚧 Authoring or publishing blocked' : '🚧 Validation blocked',
            description: cmsApplies
              ? 'Permissions, ownership, publishing, or organizational constraints prevent the test'
              : 'Permissions, traffic, ownership, or organizational constraints prevent the test',
          },
        ],
      });
    },
    response: type({ choice: "'defer' | 'blocked'" }),
    next: 'report',
  })

  .step('report', {
    prompt: ({ store }) => {
      const profile = resolveDevelopmentValidationProfile(
        store.steps.analyze.taskType,
        store.steps.analyze.mergeTagAuthoring,
      );
      const evidence: ValidationStageEvidence[] = [];
      if (store.steps['validate-local']) {
        const local = localSetupEvidence(store.steps['validate-local']);
        local.findings.push({
          item: 'Scoped build and static wiring',
          status: store.steps['verify-code'].status,
          detail: store.steps['verify-code'].summary,
        });
        if (store.steps['verify-code'].status === 'fail') local.status = 'fail';
        evidence.push(local);
      }
      if (store.steps['check-connectivity']) {
        evidence.push(connectivityEvidence(store.steps['check-connectivity']));
      }
      if (store.steps['survey-content']) {
        evidence.push(cmsGraphEvidence(store.steps['survey-content'], profile, store.steps.analyze.targetMergeTagId));
      }

      const runtimeChoice =
        store.steps['validation-disposition']?.choice ??
        store.steps['runtime-confirmation']?.choice ??
        store.steps['runtime-validation']?.choice;
      if (runtimeChoice === 'confirmed-end-to-end') {
        evidence.push(...manualRuntimeEvidence('end-to-end', profile));
      } else if (runtimeChoice === 'confirmed-transport') {
        evidence.push(...manualRuntimeEvidence('transport-only', profile));
      } else if (runtimeChoice === 'defer') {
        evidence.push(...manualRuntimeEvidence('deferred', profile));
      } else if (runtimeChoice === 'blocked') {
        evidence.push(...manualRuntimeEvidence('blocked', profile));
      } else {
        const aggregate = store.steps['capture-live-events-after'] ?? store.steps['capture-live-events'];
        if (aggregate) evidence.push(aggregateLiveEventsEvidence(aggregate));
        evidence.push({
          stage: 'personalization-outcome',
          status: 'unavailable',
          source: 'manual-confirmation',
          summary: 'The task-specific personalization outcome was not confirmed.',
          findings: [],
        });
      }

      const requirements = getValidationRequirements(profile);
      const decision =
        runtimeChoice === 'blocked'
          ? requirements['cms-graph'] === 'not-applicable'
            ? ('cannot-complete-validation' as const)
            : ('cannot-author-or-trigger' as const)
          : runtimeChoice === 'defer'
            ? ('defer-live-validation' as const)
            : ('continue' as const);
      const applicableEvidence = filterValidationEvidence(profile, evidence);
      const finalState = deriveValidationFinalState({ profile, evidence: applicableEvidence, decision });
      const credentials = store.steps['validate-local']?.credentials?.contentful;
      const liveEventsUrl = buildLiveEventsUrl(credentials?.spaceId, credentials?.environment ?? 'master');

      const sections = [
        `# ${describeValidationFinalState(finalState)}`,
        store.steps.implement?.summary ?? 'The scoped implementation was completed.',
        render.section(
          'Validation evidence',
          render.table(
            applicableEvidence.map((item) => ({
              Stage: item.stage,
              Status: item.status,
              Source: item.source,
              Summary: item.summary,
            })),
            { columns: ['Stage', 'Status', 'Source', 'Summary'] },
          ),
        ),
        render.section(
          'Resume point',
          [
            requirements['runtime-transport'] !== 'not-applicable'
              ? liveEventsUrl
                ? `[Open Contentful Live Events](${liveEventsUrl})`
                : 'Open Analytics → Live Events.'
              : 'Resume by checking both the target-profile result and fallback in the rendered application.',
            profile === 'analytics-extension'
              ? `Also confirm destination-side receipt in: ${store.steps.analyze.analyticsDestinations?.join(', ') || 'the external analytics destinations named in the task'}.`
              : '',
            finalState === 'validated-end-to-end'
              ? 'Keep the target, trigger, and expected IDs as a regression fixture.'
              : finalState === 'validation-failed'
                ? 'Run doctor against the failed stage and rerun its downstream evidence.'
                : 'Resume the same task profile when authoring, traffic, or organizational access is available.',
          ].join('\n\n'),
        ),
      ];

      const machineResult = {
        profile,
        finalState,
        evidence: applicableEvidence,
        rerunStages: getEvidenceRerunStages(profile, applicableEvidence),
        summary: describeValidationFinalState(finalState),
      };

      return [
        'Present the scoped implementation and validation report exactly as rendered. Do not collapse deferred or unavailable evidence into success.',
        view('Scoped implementation report', sections.join('\n\n')),
        `After presenting the report, return this exact structured result to the workflow protocol without changing its values:\n${JSON.stringify(machineResult)}`,
      ];
    },
    response: ValidationSummary,
    next: terminal,
  })

  .build();
