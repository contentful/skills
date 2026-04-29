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
      Classify the user's request into one of the categories below.
      Read only the user's message — do NOT explore files, ask questions, or take any action.
      Your only job is to pick the right category and set your confidence level.

      ## Categories

      🚀 **onboard** — First-time setup
      "Set up personalization", "install the SDK", "am I ready?", "get started"

      🩺 **doctor** — Broken or misconfigured setup
      "Not working", "broken", "debug", "check my setup", "fix my personalization"

      🛠️ **develop** — Build on a working setup
      "Personalize this component", "add A/B test", "create experiment", "wire analytics"

      📖 **reference** — Look something up
      "How does X work?", "show me a pattern", "what's the API for Y?"
      If you can identify the specific topic, set the \`topic\` field.

      If the request is ambiguous, set intent to "unclear" and confidence below 0.6.
    `,
    output: z.object({
      intent: z.enum(['onboard', 'doctor', 'develop', 'reference', 'unclear']),
      confidence: z.number(),
      topic: z.string().optional(),
      reasoning: z.string(),
    }),
    updateStash: ({ stepOutput }) => ({
      userQuery: '',
      intent: stepOutput.intent,
    }),
    next: ({ stepOutput }) => {
      if (stepOutput.confidence < 0.6 || stepOutput.intent === 'unclear') return 'gather-context';
      if (stepOutput.intent === 'reference' && stepOutput.topic) return `topic:${stepOutput.topic}`;
      if (stepOutput.intent === 'reference') return 'pick-topic';
      return `subskill:${stepOutput.intent}`;
    },
  })

  .step('gather-context', {
    prompt: prompt`
      You were not confident enough to classify the user's request.
      Silently explore the project to gather evidence — do NOT ask the user anything.

      Investigate these signals:

      1. **package.json** — Is @ninetailed/experience.js or @contentful/optimization installed?
      2. **Provider** — Search for NinetailedProvider or OptimizationProvider in source files.
      3. **Project structure** — What framework? (Next.js app/ vs pages/, Gatsby, Remix)

      ## Decision logic

      - SDK **not installed** → likely **onboard**
      - SDK **installed** but provider missing or broken config → likely **doctor**
      - SDK **installed** and working (provider present, components wired) → likely **develop**
      - User asking conceptual/reference questions → likely **reference**

      Base your classification on what you find in the code. If evidence is still thin,
      make your best guess — do NOT default to asking the user. Every request fits
      one of these four categories.
    `,
    output: z.object({
      intent: z.enum(['onboard', 'doctor', 'develop', 'reference']),
      topic: z.string().optional(),
      reasoning: z.string(),
    }),
    next: ({ stepOutput }) => {
      if (stepOutput.intent === 'reference' && stepOutput.topic) return `topic:${stepOutput.topic}`;
      if (stepOutput.intent === 'reference') return 'pick-topic';
      return `subskill:${stepOutput.intent}`;
    },
  })

  .step('pick-topic', {
    prompt: [
      prompt`
        The user wants to look something up about Contentful personalization.
        Ask them what they'd like to know, then match their answer to the closest
        topic key from the list below. Return the exact key string.

        If their answer is ambiguous, pick the closest match — do not ask follow-up questions.

        ## 📖 Available Topics

        | Key | Description |
        |-----|-------------|
        | how-personalization-works | Core concepts, content model, rendering flow |
        | sdk-selection | Decision framework: legacy vs modern SDK |
        | provider-patterns | Provider placement, Pages/App Router, hydration |
        | middleware-patterns | Preflight, cookies, edge personalization |
        | component-patterns | ContentTypeMap, BlockRenderer, component isolation |
        | rendering-pipeline | Data fetching, include depth, merge tags |
        | environment-variables | Variable names, runtime matrix, common mistakes |
        | analytics-and-preview | Insights plugin, event tracking, preview mode |
        | common-errors | Failure modes and fixes |
        | ssr-guide | Server-side patterns and anti-patterns |
        | sdk-legacy-guide | @ninetailed/experience.js API reference |
        | sdk-next-guide | @contentful/optimization API reference |
        | contentful-integration-guide | Content types, ExperienceMapper, publishing |
        | implementation-examples | Real implementation patterns and code |
      `,
      act.askUser({ type: 'open', question: 'What would you like to know about Contentful personalization?' }),
    ],
    output: z.object({ choice: z.string() }),
    next: ({ stepOutput }) => `topic:${stepOutput.choice}`,
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
    params: (output, stash) => ({
      userQuery: (stash as { userQuery: string }).userQuery,
      readinessOnly: (output as { intent?: string })?.intent === 'onboard' &&
        /ready|readiness|can.*support|prerequisite|pre-check/i.test(
          (stash as { userQuery: string }).userQuery,
        ),
    }),
  })
  .subskill('doctor', doctorSkill, {
    params: (_output, stash) => ({
      userQuery: (stash as { userQuery: string }).userQuery,
    }),
  })
  .subskill('develop', developSkill, {
    params: (_output, stash) => ({
      userQuery: (stash as { userQuery: string }).userQuery,
    }),
  })

  .build();
