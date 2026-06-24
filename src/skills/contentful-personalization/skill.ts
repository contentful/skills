import { skill, type, prompt, act } from '@contentful/skill-kit';
import onboardSkill from './subskills/onboard.js';
import liveDebugSkill from './subskills/live-debug.js';
import doctorSkill from './subskills/doctor.js';
import developSkill from './subskills/develop.js';
import { VERSION } from './version.js';

export default skill({
  name: 'contentful-personalization',
  version: VERSION,
  description:
    'Set up, debug, and build with Contentful personalization and optimization. ' +
    'Covers readiness, SDK install guidance, static diagnostics, live browser debugging, ' +
    'development help, and reference patterns. Use for personalization, optimization, ' +
    'ninetailed, A/B testing, experiments, audience targeting, Contentful Experiences, ' +
    'Experiences SDK, Studio Experiences, and the experience API.',
  triggers: [
    'personalization',
    'optimization',
    'ninetailed',
    'A/B test',
    'experiment',
    'multivariate test',
    'targeting',
    'audience targeting',
    'segments',
    'variants',
    'content variants',
    'set up personalization',
    'personalization not working',
    'personalization broken',
    'personalize this component',
    'am I ready for personalization',
    'experience API',
    'Contentful Experiences',
    'Experiences SDK',
    'Studio Experiences',
    'personalization in Next.js',
    '@contentful/optimization',
    '@ninetailed/experience.js',
    'run an experiment',
    'check this URL',
    'debug this live page',
    'inspect network requests',
    'check console errors',
    'experience.ninetailed.co',
  ],
  argumentHint: '[question or topic]',
  allowedTools: [
    'mcp__contentful-mcp__*',
    'mcp__chrome-devtools__*',
    'mcp__plugin_*chrome-devtools*__*',
    'mcp__plugin_contentful_contentful-mcp__*',
    'mcp__plugin_contentful_contentful-personalization__*',
  ],
  license: 'MIT',
  entry: 'classify',

  package: {
    name: '@contentful/skill-contentful-personalization',
    description:
      'Unified Contentful personalization skill covering readiness, setup, live and static diagnostics, development, and reference documentation',
    license: 'MIT',
    files: ['SKILL.md', 'scripts/**', 'bin/**', 'references/**'],
  },
})
  .step('classify', {
    prompt: prompt`
      Classify the user's request into one of the categories below.
      Read only the user's message — do NOT explore files, ask questions, or take any action.
      Your only job is to pick the right category and set your confidence level.

      ## Categories

      🚀 **onboard** — First-time setup
      "Set up personalization", "install the SDK", "am I ready?", "get started"

      🌐 **live-debug** — Browser/runtime verification for a live page
      "Check this URL", "debug this live page", "inspect network requests", "check the console"

      🩺 **doctor** — Broken or misconfigured setup
      "Not working", "broken", "debug", "check my setup", "fix my personalization"

      🛠️ **develop** — Build on a working setup
      "Personalize this component", "add A/B test", "create experiment", "wire analytics"

      📖 **reference** — Look something up
      "How does X work?", "show me a pattern", "what's the API for Y?"
      If you can identify the specific topic, set the \`topic\` field.

      If the user includes a live URL for browser inspection, set the \`requestedUrl\` field.

      If the request is ambiguous, set intent to "unclear" and confidence below 0.6.
    `,
    response: type({
      intent: "'onboard' | 'live-debug' | 'doctor' | 'develop' | 'reference' | 'unclear'",
      confidence: 'number',
      'requestedUrl?': 'string',
      'topic?': 'string',
      reasoning: 'string',
    }),
    next: ({ response }) => {
      if (response.confidence < 0.6 || response.intent === 'unclear') return 'gather-context';
      if (response.intent === 'live-debug') return 'subskill:live-debug';
      if (response.intent === 'reference' && response.topic) return `topic:${response.topic}`;
      if (response.intent === 'reference') return 'pick-topic';
      return `subskill:${response.intent}`;
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
      - User explicitly asks to inspect a live URL, browser traffic, console, or runtime requests
        → **live-debug**
      - SDK **installed** but provider missing or broken config → likely **doctor**
      - SDK **installed** and working (provider present, components wired) → likely **develop**
      - User asking conceptual/reference questions → likely **reference**

      Base your classification on what you find in the code. If evidence is still thin,
      make your best guess — do NOT default to asking the user. Every request fits
      one of these five categories.

      If the user included a live URL for browser inspection, set the \`requestedUrl\` field.
    `,
    response: type({
      intent: "'onboard' | 'live-debug' | 'doctor' | 'develop' | 'reference'",
      'requestedUrl?': 'string',
      'topic?': 'string',
      reasoning: 'string',
    }),
    next: ({ response }) => {
      if (response.intent === 'live-debug') return 'subskill:live-debug';
      if (response.intent === 'reference' && response.topic) return `topic:${response.topic}`;
      if (response.intent === 'reference') return 'pick-topic';
      return `subskill:${response.intent}`;
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
        | sdk-selection | Decision framework: current @ninetailed/experience.js vs modern @contentful/optimization |
        | provider-patterns | Provider placement, Pages/App Router, hydration |
        | middleware-patterns | Preflight, cookies, edge personalization |
        | component-patterns | ContentTypeMap, BlockRenderer, component isolation |
        | rendering-pipeline | Data fetching, include depth, merge tags |
        | environment-variables | Variable names, runtime matrix, common mistakes |
        | analytics-and-preview | Insights plugin, event tracking, preview mode |
        | common-errors | Failure modes and fixes |
        | ssr-guide | Server-side patterns and anti-patterns |
        | sdk-legacy-guide | @ninetailed/experience.js API reference (current default) |
        | sdk-next-guide | @contentful/optimization API reference (modern, next-gen) |
        | contentful-integration-guide | Content types, ExperienceMapper, publishing |
        | implementation-examples | Real implementation patterns and code |
      `,
      act.askUser({
        type: 'open',
        question: 'What would you like to know about Contentful personalization?',
      }),
    ],
    response: type({ choice: 'string' }),
    next: ({ response }) => `topic:${response.choice}`,
  })

  // --- Topics ---

  .topic('how-personalization-works', {
    label: 'Core concepts: content model, rendering flow, and how personalization works',
    content: ({ refs }) => refs.load('how-personalization-works.md'),
  })
  .topic('sdk-selection', {
    label: 'SDK decision framework: current @ninetailed/experience.js vs modern @contentful/optimization',
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
    label: '@contentful/optimization modern SDK reference (OptimizationRoot, hooks, Next.js adapter)',
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
    params: (output) => ({
      userQuery: '',
      readinessOnly:
        (output as { intent?: string })?.intent === 'onboard' &&
        /ready|readiness|can.*support|prerequisite|pre-check/i.test(''),
    }),
  })
  .subskill('live-debug', liveDebugSkill, {
    params: (output) => ({
      requestedUrl: (output as { requestedUrl?: string })?.requestedUrl,
    }),
  })
  .subskill('doctor', doctorSkill, {
    params: () => ({
      userQuery: '',
    }),
  })
  .subskill('develop', developSkill, {
    params: () => ({ userQuery: '' }),
  })

  .build();
