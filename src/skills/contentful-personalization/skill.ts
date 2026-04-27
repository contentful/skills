import { skill, z, prompt, act } from '@contentful/skill-kit';
import onboardSkill from './subskills/onboard.js';
import doctorSkill from './subskills/doctor.js';
import developSkill from './subskills/develop.js';
import { VERSION } from './version.js';

export default skill({
  name: 'contentful-personalization',
  version: VERSION,
  description:
    'Unified Contentful personalization skill. Covers readiness assessment, ' +
    'guided setup, diagnostics and debugging, day-to-day development, ' +
    'and reference documentation for SDKs, APIs, and patterns.',
  triggers: [
    'personalization',
    'optimization',
    'ninetailed',
    'A/B test',
    'set up personalization',
    'personalization not working',
    'personalize this component',
    'am I ready for personalization',
    'experience API',
  ],
  entry: 'classify',

  package: {
    name: '@contentful/skill-contentful-personalization',
    description: 'Unified Contentful personalization skill covering readiness, setup, diagnostics, development, and reference documentation',
    license: 'MIT',
    files: ['SKILL.md', 'scripts/**', 'bin/**', 'references/**'],
  },

  stash: z.object({
    userQuery: z.string(),
    intent: z.string(),
  }),
})
  .step('classify', {
    prompt: prompt`
      Classify the user's request to determine which personalization capability
      they need. You have these options:

      **onboard** — The user wants to:
      - Set up personalization for the first time
      - Check if their project is ready for personalization
      - Install and configure the SDK
      - "Get started", "set up", "install", "am I ready?"

      **doctor** — The user has an existing setup that's broken:
      - Personalization not working
      - Debug, diagnose, fix issues
      - "Not working", "broken", "check my setup"

      **develop** — The user has a working setup and wants to build:
      - Add personalization to a specific component
      - Create an A/B test or experiment
      - Wire up analytics or tracking
      - "Personalize this", "add A/B test", "create experiment"

      **reference** — The user wants to look something up:
      - How does personalization/the SDK/the API work?
      - Show me a pattern or code example
      - Explain a concept
      - "How does X work?", "what's the API for Y?"

      If you're not sure, set confidence low and we'll explore further.
    `,
    output: z.object({
      intent: z.enum(['onboard', 'doctor', 'develop', 'reference', 'unclear']),
      confidence: z.number(),
      topic: z.string().optional(),
      reasoning: z.string(),
    }),
    stash: ({ output }) => ({
      userQuery: '',
      intent: output.intent,
    }),
    next: ({ output }) => {
      if (output.confidence < 0.6 || output.intent === 'unclear') return 'gather-context';
      if (output.intent === 'reference' && output.topic) return `topic:${output.topic}`;
      if (output.intent === 'reference') return 'pick-topic';
      return `subskill:${output.intent}`;
    },
  })

  .step('gather-context', {
    prompt: prompt`
      You're not sure what the user needs yet. Before asking, try to
      learn more by exploring the project:

      1. Check package.json — is @ninetailed/experience.js or
         @contentful/optimization installed?
      2. Look for a NinetailedProvider or OptimizationProvider in the source.
      3. Check the general project structure (framework, router).

      Based on what you find:
      - If personalization is NOT set up → likely **onboard**
      - If personalization IS set up but something seems off → likely **doctor**
      - If personalization IS set up and working → likely **develop**

      If still ambiguous after exploring, ask the user conversationally
      what they're trying to accomplish. Don't present a menu — have a
      conversation.
    `,
    output: z.object({
      intent: z.enum(['onboard', 'doctor', 'develop', 'reference']),
      topic: z.string().optional(),
      reasoning: z.string(),
    }),
    next: ({ output }) => {
      if (output.intent === 'reference' && output.topic) return `topic:${output.topic}`;
      if (output.intent === 'reference') return 'pick-topic';
      return `subskill:${output.intent}`;
    },
  })

  .step('pick-topic', {
    prompt: [
      act.askUser({ type: 'open', question: 'What would you like to know about?' }),
      prompt`
        Available topics:
        - **how-personalization-works** — Core concepts, content model, rendering flow
        - **sdk-selection** — Decision framework for legacy vs modern SDK
        - **provider-patterns** — Placement, Pages/App Router, hydration
        - **middleware-patterns** — Preflight, cookies, edge personalization
        - **component-patterns** — ContentTypeMap, BlockRenderer, isolation
        - **rendering-pipeline** — Data fetching, include depth, merge tags
        - **environment-variables** — Variable names, runtime matrix, common mistakes
        - **analytics-and-preview** — Insights plugin, event tracking, preview
        - **common-errors** — Failure modes and fixes
        - **ssr-guide** — Server-side patterns and anti-patterns
        - **sdk-legacy-guide** — @ninetailed/experience.js API
        - **sdk-next-guide** — @contentful/optimization API
        - **contentful-integration-guide** — Content types, ExperienceMapper, publishing
        - **implementation-examples** — Real implementation patterns

        Match the user's answer to the closest topic and return its exact key.
      `,
    ],
    output: z.object({ choice: z.string() }),
    next: ({ output }) => `topic:${output.choice}`,
  })

  // --- Topics ---

  .topic('how-personalization-works', {
    label: 'Core concepts: content model, rendering flow, and how personalization works',
    content: ({ refs }) => refs.load('how-personalization-works.md'),
  })
  .topic('sdk-selection', {
    label: 'SDK decision framework: legacy (@ninetailed/experience.js) vs modern (@contentful/optimization)',
    content: ({ refs }) => refs.load('sdk-selection.md'),
  })
  .topic('provider-patterns', {
    label: 'Provider placement patterns for Pages Router, App Router, and both SDKs',
    content: ({ refs }) => refs.load('provider-patterns.md'),
  })
  .topic('middleware-patterns', {
    label: 'Middleware and SSR/edge patterns: preflight, cookies, matcher config',
    content: ({ refs }) => refs.load('middleware-patterns.md'),
  })
  .topic('component-patterns', {
    label: 'Component architecture patterns: ContentTypeMap, BlockRenderer, isolation',
    content: ({ refs }) => refs.load('component-patterns.md'),
  })
  .topic('rendering-pipeline', {
    label: 'Rendering pipeline: Contentful client setup, include depth, component mapper',
    content: ({ refs }) => refs.load('rendering-pipeline.md'),
  })
  .topic('environment-variables', {
    label: 'Environment variables: names, runtime matrix, framework prefixes',
    content: ({ refs }) => refs.load('env-var-spec.md'),
  })
  .topic('analytics-and-preview', {
    label: 'Analytics plugins (Insights, GTM, Segment) and preview configuration',
    content: ({ refs }) => refs.load('analytics-and-preview.md'),
  })
  .topic('common-errors', {
    label: 'Common failure modes with root causes and fixes',
    content: ({ refs }) => refs.load('common-errors.md'),
  })
  .topic('ssr-guide', {
    label: 'SSR and edge-side personalization: patterns, anti-patterns, troubleshooting',
    content: ({ refs }) => refs.load('ssr-guide.md'),
  })
  .topic('sdk-legacy-guide', {
    label: '@ninetailed/experience.js complete SDK reference',
    content: ({ refs }) => refs.load('sdk-legacy-guide.md'),
  })
  .topic('sdk-next-guide', {
    label: '@contentful/optimization next-gen SDK reference',
    content: ({ refs }) => refs.load('sdk-next-guide.md'),
  })
  .topic('contentful-integration-guide', {
    label: 'Contentful CMS integration: content types, ExperienceMapper, publishing workflow',
    content: ({ refs }) => refs.load('contentful-integration-guide.md'),
  })
  .topic('implementation-examples', {
    label: 'Real code examples: providers, BlockRenderer, Experience component patterns',
    content: ({ refs }) => refs.load('implementation-examples.md'),
  })

  // --- Sub-skills ---

  .subskill('onboard', onboardSkill, {
    context: (output, stash) => ({
      userQuery: (stash as { userQuery: string }).userQuery,
      readinessOnly: (output as { intent?: string })?.intent === 'onboard' &&
        /ready|readiness|can.*support|prerequisite|pre-check/i.test(
          (stash as { userQuery: string }).userQuery,
        ),
    }),
  })
  .subskill('doctor', doctorSkill, {
    context: (_output, stash) => ({
      userQuery: (stash as { userQuery: string }).userQuery,
    }),
  })
  .subskill('develop', developSkill, {
    context: (_output, stash) => ({
      userQuery: (stash as { userQuery: string }).userQuery,
    }),
  })

  .build();
