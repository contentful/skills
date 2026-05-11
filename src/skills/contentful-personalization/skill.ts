import { skill, type, prompt, act, render, view, terminal } from '@contentful/skill-kit';
import onboardSkill from './subskills/onboard.js';
import doctorSkill from './subskills/doctor.js';
import developSkill from './subskills/develop.js';
import { RuntimeCheckResult } from './schemas.js';
import { VERSION } from './version.js';

function getChromeDevToolsToolMatches(tools: string[]) {
  return tools.filter((tool) => tool.startsWith('mcp__chrome-devtools__') || tool.includes('chrome-devtools'));
}

function getLiveDebugUrl(store: {
  steps: {
    classify?: { requestedUrl?: string };
    'gather-context'?: { requestedUrl?: string };
    'live-debug-request-url'?: { url?: string };
  };
}) {
  return (
    store.steps['live-debug-request-url']?.url ??
    store.steps.classify?.requestedUrl ??
    store.steps['gather-context']?.requestedUrl ??
    ''
  );
}

function getChromeDevToolsInstallGuidance(hostName: string) {
  const normalizedHost = hostName.toLowerCase();

  if (normalizedHost.includes('opencode')) {
    return [
      'Install the `chrome-devtools-mcp` server in your OpenCode config:',
      '',
      '```json',
      '{',
      '  "$schema": "https://opencode.ai/config.json",',
      '  "mcp": {',
      '    "chrome-devtools": {',
      '      "type": "local",',
      '      "command": ["npx", "-y", "chrome-devtools-mcp@latest"]',
      '    }',
      '  }',
      '}',
      '```',
    ].join('\n');
  }

  if (normalizedHost.includes('claude')) {
    return ['Install it with:', '', '```bash', 'claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest', '```'].join(
      '\n',
    );
  }

  return [
    'Install the `chrome-devtools-mcp` server in your MCP client using the setup instructions from:',
    '',
    'https://github.com/ChromeDevTools/chrome-devtools-mcp',
  ].join('\n');
}

function formatRuntimeRecommendations(
  recommendations: Array<{ priority: string; message: string; category: string }> | undefined,
) {
  const priorityIcon: Record<string, string> = {
    critical: '🔴',
    warning: '🟡',
    info: '💡',
  };

  const recs = (recommendations ?? []).filter(Boolean);
  if (recs.length === 0) return '*No follow-up recommendations*';

  return [...recs]
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
    })
    .map((rec, index) => `${index + 1}. ${priorityIcon[rec.priority] ?? '•'} **[${rec.priority}]** ${rec.message} *(${rec.category})*`)
    .join('\n');
}

export default skill({
  name: 'contentful-personalization',
  version: VERSION,
  description:
    'Set up, debug, and develop with Contentful personalization and optimization. ' +
    'Covers readiness assessment, guided SDK installation, static diagnostics, live browser debugging, ' +
    'day-to-day development, and reference documentation for personalization SDKs, ' +
    'APIs, and patterns. Use when asked about personalization, optimization, ninetailed, ' +
    'A/B testing, experiments, multivariate tests, audience targeting, segments, ' +
    'content variants, Contentful Experiences, Experiences SDK, Studio Experiences, ' +
    'or the experience API.',
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
    'mcp__plugin_contentful-skills_contentful-mcp__*',
    'mcp__plugin_contentful-skills_contentful-personalization__*',
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
      if (response.intent === 'live-debug') return 'live-debug-check-mcp';
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
      if (response.intent === 'live-debug') return 'live-debug-check-mcp';
      if (response.intent === 'reference' && response.topic) return `topic:${response.topic}`;
      if (response.intent === 'reference') return 'pick-topic';
      return `subskill:${response.intent}`;
    },
  })

  .step('live-debug-check-mcp', {
    prompt: ({ host }) => {
      const matches = getChromeDevToolsToolMatches(host.toolsAvailable);

      return prompt`
        Determine whether Chrome DevTools MCP is available for this run.
        Do not ask the user anything. Use only the host tool list below.

        Return:
        - \`mcpAvailable\` = true if one or more tools clearly belong to Chrome DevTools MCP
        - \`matchedTools\` = the exact matching tool names shown below

        ## Host
        ${host.host}

        ## Matching Chrome DevTools MCP tools
        ${matches.length > 0 ? matches.map((tool) => `- ${tool}`).join('\n') : '(none)'}
      `;
    },
    response: type({
      mcpAvailable: 'boolean',
      matchedTools: 'string[]',
    }),
    next: ({ response, store }) => {
      if (!response.mcpAvailable) return 'live-debug-install-mcp';
      if (store.steps.classify?.requestedUrl || store.steps['gather-context']?.requestedUrl) return 'live-debug-inspect';
      return 'live-debug-request-url';
    },
  })

  .step('live-debug-install-mcp', {
    prompt: ({ host }) => {
      const guidance = getChromeDevToolsInstallGuidance(host.host);

      return [
        prompt`
          Ask the user to install Chrome DevTools MCP before continuing with live debugging.
          Explain that runtime inspection is blocked until the MCP server is available in this host.
          Tell them to rerun the live-debug request after installation because tool availability is fixed for the current run.

          Include this repository link exactly:
          https://github.com/ChromeDevTools/chrome-devtools-mcp

          Include the host-specific install guidance below exactly as written.
        `,
        view('Install Chrome DevTools MCP', guidance),
      ];
    },
    next: terminal,
  })

  .step('live-debug-request-url', {
    prompt: act.askUser({
      type: 'open',
      question: 'What live URL should I inspect for personalization behavior?',
    }),
    response: type({ url: 'string' }),
    next: 'live-debug-inspect',
  })

  .step('live-debug-inspect', {
    prompt: ({ store }) => {
      const url = getLiveDebugUrl({
        steps: {
          classify: store.steps.classify,
          'gather-context': store.steps['gather-context'],
          'live-debug-request-url': store.steps['live-debug-request-url'],
        },
      });

      return prompt`
        Use Chrome DevTools MCP to inspect runtime personalization behavior for this live page:
        ${url}

        ## Required workflow
        1. Open the page.
        2. If a cookie consent banner is visible, accept/approve it — personalization and analytics require consent cookies to function fully.
        3. Wait for it to settle.
        4. Reload it once so startup requests are visible.
        5. Inspect console errors and warnings.
        6. Inspect network traffic, but ONLY requests whose URL contains \`ninetailed.co\` (this includes \`experience.ninetailed.co\` and \`*.insights.ninetailed.co\`).
        7. If matching requests exist, inspect up to 3 representative requests in detail.

        ## What to report
        - Whether any meaningful console issues were present
        - Whether requests to \`ninetailed.co\` were sent (experience API and/or analytics)
        - Method, status, and a sanitized payload-shape summary for representative requests
        - Whether the runtime evidence suggests a likely implementation/configuration issue worth escalating into the static doctor flow

        ## Safety rules
        - Do NOT include cookies, authorization headers, API keys, or full raw payload dumps
        - Summarize payload shape only
        - If no matching requests are present, say so explicitly

        Set \`shouldRunDoctor\` to true when the runtime evidence suggests something is off and static code/config diagnosis should continue next.
        Set it to false only when the runtime behavior looks healthy enough that no static follow-up is needed.
      `;
    },
    response: RuntimeCheckResult,
    next: 'live-debug-report',
  })

  .step('live-debug-report', {
    prompt: ({ store }) => {
      const result = store.steps['live-debug-inspect'];
      if (!result) {
        return prompt`
          Tell the user the live-debug report could not be rendered because no runtime inspection result was captured.
          Keep it brief and ask them to rerun the live-debug flow.
        `;
      }

      const statusIcon = result.overallStatus === 'pass' ? '✅' : result.overallStatus === 'warn' ? '⚠️' : '❌';
      const findingsTable = render.table(
        (result.findings ?? []).map((finding: { item: string; status: string; detail: string }) => ({
          Check: finding.item,
          Status: finding.status,
          Detail: finding.detail,
        })),
        { columns: ['Check', 'Status', 'Detail'] },
      );
      const requestsTable =
        (result.requests?.length ?? 0) > 0
          ? render.table(
              (result.requests ?? []).map((request: { url: string; method: string; status: number; summary: string }) => ({
                URL: request.url,
                Method: request.method,
                Status: String(request.status),
                Summary: request.summary,
              })),
              { columns: ['URL', 'Method', 'Status', 'Summary'] },
            )
          : '*No requests to `ninetailed.co` were detected*';

      const sections = [
        `# 🌐 Live Debug Report\n`,
        `## ${statusIcon} Overall: ${result.overallStatus.toUpperCase()}\n`,
        result.summary,
        render.section('🖥️ Console Summary', result.consoleSummary),
        render.section('🌐 ninetailed.co Requests', requestsTable),
        render.section('🔍 Findings', findingsTable),
        render.section('💡 Recommendations', formatRuntimeRecommendations(result.recommendations)),
      ];

      if (result.shouldRunDoctor) {
        sections.push(
          render.section(
            '➡️ Next Step',
            'The runtime check suggests something is off, so I am continuing into the static doctor flow to inspect the codebase and configuration.',
          ),
        );
      }

      return [
        prompt`
          Present the live-debug report below exactly as rendered.
          If the runtime check looks healthy, keep the wrap-up brief.
          If the runtime check suggests something is off, tell the user you are continuing into the static doctor flow next.
        `,
        view('Live Debug Report', sections.join('\n\n')),
      ];
    },
    next: ({ store }) => (store.steps['live-debug-inspect']?.shouldRunDoctor ? 'subskill:doctor' : 'live-debug-done'),
  })

  .step('live-debug-done', {
    next: terminal,
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
    params: (output) => ({
      userQuery: '',
      readinessOnly:
        (output as { intent?: string })?.intent === 'onboard' &&
        /ready|readiness|can.*support|prerequisite|pre-check/i.test(''),
    }),
  })
  .subskill('doctor', doctorSkill, {
    params: (_output, store) => ({
      userQuery: '',
      ...(store.steps['live-debug-inspect']
        ? {
            triggeredByLiveDebug: true,
            runtimeUrl: store.steps['live-debug-inspect'].url,
            runtimeSummary: store.steps['live-debug-inspect'].summary,
          }
        : {}),
    }),
  })
  .subskill('develop', developSkill, {
    params: () => ({ userQuery: '' }),
  })

  .build();
