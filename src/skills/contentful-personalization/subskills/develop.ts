import { skill, type, prompt, terminal, render } from '@contentful/skill-kit';
import { VERSION } from '../version.js';

export default skill({
  name: 'develop',
  version: VERSION,
  description:
    'Day-to-day development companion for building with Contentful personalization. ' +
    'Helps add personalization to components, create experiments, and wire analytics.',
  entry: 'analyze',

  params: type({
    'userQuery?': 'string',
  }),
})
  .step('analyze', {
    prompt: ({ params, refs }) => prompt`
      Analyze the codebase to understand the existing personalization setup
      and determine what the user wants to accomplish.

      ## What to investigate

      1. **SDK in use** — Is it @ninetailed/experience.js or @contentful/optimization?
      2. **Component mapper** — How does the project map content types to components?
         (ContentTypeMap, BlockRenderer, etc.)
      3. **Provider configuration** — Where is it? What plugins are registered?
      4. **User's task** — What do they want? (personalize a component, add analytics,
         create an experiment, add a merge tag)
      5. **Target files** — Which specific files need to change?

      Focus on understanding the existing patterns so your changes will be consistent.
      Spend no more than a few minutes exploring — get the key facts and move on.

      Do NOT start making changes or create a plan. Do NOT ask the user questions.
      Just analyze and report what you find.

      ${params?.userQuery ? `\nUser's request: "${params.userQuery}"` : ''}

      ## Reference: Component Patterns
      ${refs.load('component-patterns.md')}

      ## Reference: Implementation Examples
      ${refs.load('implementation-examples.md')}
    `,
    response: type({
      taskType: "'personalize-component' | 'create-experiment' | 'add-analytics' | 'add-merge-tag' | 'other'",
      sdkInUse: "'ninetailed' | 'optimization' | 'unknown'",
      framework: 'string',
      targetFiles: 'string[]',
      analysis: 'string',
    }),
    next: 'plan',
  })

  .step('plan', {
    prompt: ({ store, act, refs }) => {
      const sdkRef =
        store.steps.analyze.sdkInUse === 'optimization'
          ? refs.load('sdk-next-guide.md')
          : refs.load('sdk-legacy-guide.md');

      const taskDescriptions: Record<string, string> = {
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
            SDK: store.steps.analyze.sdkInUse,
            Framework: store.steps.analyze.framework,
          })}

          ## SDK Reference
          ${sdkRef}

          ## Contentful Integration
          ${refs.load('contentful-integration-guide.md')}
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
      const refSections: Array<{ label: string; content: string }> = [
        {
          label: 'Implementation Examples',
          content: refs.load('implementation-examples.md'),
        },
      ];
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

      return prompt`
        Implement the approved plan. Match the project's existing code style
        and patterns — do not introduce a different convention.

        ${render.kv({
          Task: store.steps.analyze.taskType.replace(/-/g, ' '),
          SDK: store.steps.analyze.sdkInUse,
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
