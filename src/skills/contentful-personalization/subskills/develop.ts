import { skill, z, prompt } from '@contentful/skill-kit';
import { VERSION } from '../version.js';

export default skill({
  name: 'develop',
  version: VERSION,
  description:
    'Day-to-day development companion for building with Contentful personalization. ' +
    'Helps add personalization to components, create experiments, and wire analytics.',
  entry: 'analyze',

  context: z.object({
    userQuery: z.string().optional(),
  }),

  stash: z.object({
    taskType: z.enum(['personalize-component', 'create-experiment', 'add-analytics', 'add-merge-tag', 'other']),
    sdkInUse: z.enum(['ninetailed', 'optimization', 'unknown']),
    framework: z.string(),
    targetFiles: z.array(z.string()),
  }),
})
  .step('analyze', {
    prompt: ({ context, refs }) => prompt`
      Analyze the codebase to understand the current personalization setup
      and figure out what the user wants to accomplish.

      ${refs.load('component-patterns.md')}

      ${refs.load('implementation-examples.md')}

      Investigate:
      1. What personalization SDK is in use? (@ninetailed/experience.js or @contentful/optimization)
      2. What's the component mapper pattern? (ContentTypeMap, BlockRenderer, etc.)
      3. How is the provider configured?
      4. What does the user want to do? (personalize a component, add analytics, create an experiment, etc.)
      5. Which files need to change?

      ${context?.userQuery ? `The user's request: "${context.userQuery}"` : ''}

      Be specific about what you find. Identify the exact files, patterns,
      and changes needed.
    `,
    output: z.object({
      taskType: z.enum(['personalize-component', 'create-experiment', 'add-analytics', 'add-merge-tag', 'other']),
      sdkInUse: z.enum(['ninetailed', 'optimization', 'unknown']),
      framework: z.string(),
      targetFiles: z.array(z.string()),
      analysis: z.string(),
    }),
    stash: ({ output }) => ({
      taskType: output.taskType,
      sdkInUse: output.sdkInUse,
      framework: output.framework,
      targetFiles: output.targetFiles,
    }),
    next: 'plan',
  })

  .step('plan', {
    prompt: ({ stash, refs }) => {
      const sdkRef = stash.sdkInUse === 'optimization'
        ? refs.load('sdk-next-guide.md')
        : refs.load('sdk-legacy-guide.md');

      return prompt`
        Present a brief plan for the changes. For simple tasks (wrapping one
        component), keep it concise. For complex tasks, use planning mode.

        ## SDK Reference
        ${sdkRef}

        ## Contentful Integration
        ${refs.load('contentful-integration-guide.md')}

        Task: ${stash.taskType}
        SDK: ${stash.sdkInUse}
        Target files: ${stash.targetFiles.join(', ')}

        Explain what you'll change and why.
      `;
    },
    output: z.object({
      plan: z.string(),
      filesToModify: z.array(z.string()),
    }),
    next: 'implement',
  })

  .step('implement', {
    prompt: ({ stash, getStep, refs }) => {
      const plan = getStep('plan');

      const refSections = [refs.load('implementation-examples.md')];
      if (stash.taskType === 'add-analytics') {
        refSections.push(refs.load('analytics-and-preview.md'));
      }
      if (stash.taskType === 'personalize-component') {
        refSections.push(refs.load('component-patterns.md'));
      }

      return prompt`
        Implement the changes from the plan.

        ## Plan
        ${plan?.output ? (plan.output as { plan: string }).plan : 'No plan available'}

        ## Reference
        ${refSections.join('\n\n---\n\n')}

        Adapt to the project's existing patterns and conventions.
      `;
    },
    output: z.object({
      filesModified: z.array(z.string()),
      summary: z.string(),
    }),
    next: { terminal: true },
  })

  .build();
