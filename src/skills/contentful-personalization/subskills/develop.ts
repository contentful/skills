import { skill, type, prompt, terminal, render } from '@contentful/skill-kit';
import { getOptimizationReferenceFiles } from '../optimization-references.js';
import { VERSION } from '../version.js';

type DetectedSdk = 'ninetailed' | 'optimization' | 'both' | 'unknown';
type DevelopmentSdk = 'ninetailed' | 'optimization';
type DevelopmentScope = 'existing-integration' | 'new-integration';

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
      targetFiles: 'string[]',
      analysis: 'string',
    }),
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

        After making changes, briefly summarize what you did and list all modified files.

        ## Reference Material
        ${refSections.map((r) => `### ${r.label}\n${r.content}`).join('\n\n---\n\n')}
      `;
    },
    next: terminal,
  })

  .build();
