import { skill, type, prompt, act, render, view, terminal } from '@contentful/skill-kit';
import { RuntimeCheckResult } from '../schemas.js';
import { VERSION } from '../version.js';

function getLiveDebugUrl(store: {
  steps: {
    'request-url'?: { url?: string };
  };
}) {
  return store.steps['request-url']?.url ?? '';
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
    return [
      'Install it with:',
      '',
      '```bash',
      'claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest',
      '```',
    ].join('\n');
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
    .map(
      (rec, index) =>
        `${index + 1}. ${priorityIcon[rec.priority] ?? '•'} **[${rec.priority}]** ${rec.message} *(${rec.category})*`,
    )
    .join('\n');
}

export default skill({
  name: 'live-debug',
  version: VERSION,
  description:
    'Inspect a live URL with Chrome DevTools MCP for runtime personalization issues. ' +
    'Checks console problems, observes ninetailed.co requests, and reports whether the next step should be static doctor diagnosis.',
  entry: 'check-mcp',

  params: type({
    'requestedUrl?': 'string',
  }),
})
  .step('check-mcp', {
    prompt: ({ host }) => prompt`
      Determine whether the available tools are sufficient for this live browser debugging workflow.
      Do not ask the user anything. Use only the host tool list below.

      You are looking for browser debugging tools that would let you:
      - open or control a browser page
      - inspect console messages
      - inspect network requests

      Tool names may be host- or plugin-prefixed, so do not rely on one exact naming convention.

      Return:
      - \`mcpAvailable\` = true if the available tools appear sufficient for this workflow
      - \`reason\` = a brief explanation citing the relevant tools or the capability gap

      ## Host
      ${host.host}

      ## Available tools
      ${host.toolsAvailable.length > 0 ? host.toolsAvailable.map((tool) => `- ${tool}`).join('\n') : '(none)'}
    `,
    response: type({
      mcpAvailable: 'boolean',
      reason: 'string',
    }),
    next: ({ response, params }) => {
      if (!response.mcpAvailable) return 'install-mcp';
      if (params?.requestedUrl) return 'inspect';
      return 'request-url';
    },
  })

  .step('install-mcp', {
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

  .step('request-url', {
    prompt: act.askUser({
      type: 'open',
      question: 'What live URL should I inspect for personalization behavior?',
    }),
    response: type({ url: 'string' }),
    next: 'inspect',
  })

  .step('inspect', {
    prompt: ({ params, store }) => {
      const url =
        params?.requestedUrl ??
        getLiveDebugUrl({
          steps: {
            'request-url': store.steps['request-url'],
          },
        });

      return prompt`
        Use Chrome DevTools MCP to inspect runtime personalization behavior for this live page:
        ${url}

        ## Required workflow
        1. Open the page.
        2. Observe the existing consent state, rendered content, and page URL without changing them.
        3. Wait for the existing page load to settle; do not reload automatically.
        4. Inspect console errors and warnings.
        5. Inspect network traffic, but ONLY requests whose URL contains \`ninetailed.co\` (this includes \`experience.ninetailed.co\` and \`*.insights.ninetailed.co\`).
        6. If matching requests exist, inspect up to 3 representative requests in detail.
        7. Look for admitted/blocked event state, profile audience IDs, selected optimization IDs,
           and rendered entry metadata only when the application already exposes them. Redact values.

        ## What to report
        - Whether any meaningful console issues were present
        - Whether requests to \`ninetailed.co\` were sent (experience API and/or analytics)
        - Method, status, and a sanitized payload-shape summary for representative requests
        - Whether the runtime evidence suggests a likely implementation/configuration issue worth following up with the static doctor flow
        - Whether a controlled validation would materially improve the evidence, and the exact actions it would require

        ## Safety rules
        - Do NOT include cookies, authorization headers, API keys, or full raw payload dumps
        - Summarize payload shape only
        - If no matching requests are present, say so explicitly
        - Do NOT accept consent, identify a profile, reload, change URL/query parameters, click,
          submit, or force a preview variant during passive inspection

        Set \`shouldRunDoctor\` to true when the runtime evidence suggests something is off and static code/config diagnosis should be the next step.
        Set it to false only when the runtime behavior looks healthy enough that no static follow-up is needed.
        Set \`controlledValidationSuggested\` only when passive evidence is insufficient and list
        the minimum required \`controlledActions\`. Query navigation is valid only for a known,
        already-authored audience condition; it is not a magic SDK override.
      `;
    },
    response: RuntimeCheckResult,
    next: ({ response }) =>
      response.controlledValidationSuggested && (response.controlledActions?.length ?? 0) > 0
        ? 'offer-controlled-validation'
        : 'report',
  })

  .step('offer-controlled-validation', {
    prompt: ({ store }) => [
      prompt`
        Passive inspection is complete. Present the exact proposed side effects below and ask for
        approval. Make clear that skipping preserves the passive report; do not pressure the user.

        Proposed actions: ${(store.steps.inspect?.controlledActions ?? []).join(', ')}
      `,
      act.confirm({
        message: 'Run these controlled validation actions in the current development or staging page?',
        defaultAnswer: 'no',
      }),
    ],
    response: type({ approved: 'boolean' }),
    next: ({ response }) => (response.approved ? 'controlled-inspect' : 'report'),
  })

  .step('controlled-inspect', {
    prompt: ({ params, store }) => prompt`
      Run a controlled follow-up on ${params?.requestedUrl ?? getLiveDebugUrl({ steps: { 'request-url': store.steps['request-url'] } })}.

      The user approved only these actions:
      ${(store.steps.inspect?.controlledActions ?? []).map((action: string) => `- ${action}`).join('\n')}

      Perform only those actions, once each, and observe the resulting console, Experience API,
      Insights, admitted/blocked event, selected optimization, and rendered entry evidence. Do not
      broaden the test. Do not expose credentials, cookies, profile traits, location, or raw payloads.
      Restore any local preview override you applied. Return the same structured runtime report.
    `,
    response: RuntimeCheckResult,
    next: 'report',
  })

  .step('report', {
    prompt: ({ store }) => {
      const result = store.steps['controlled-inspect'] ?? store.steps.inspect;
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
              (result.requests ?? []).map(
                (request: { url: string; method: string; status: number; summary: string }) => ({
                  URL: request.url,
                  Method: request.method,
                  Status: String(request.status),
                  Summary: request.summary,
                }),
              ),
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
            '➡️ Recommended Next Step',
            'The runtime check suggests a setup or configuration issue. Run the doctor flow next to inspect the codebase and configuration statically.',
          ),
        );
      }

      return [
        prompt`
          Present the live-debug report below exactly as rendered.
          If the runtime check looks healthy, keep the wrap-up brief.
          If the runtime check suggests something is off, tell the user the recommended next step is the doctor flow for static diagnosis.
        `,
        view('Live Debug Report', sections.join('\n\n')),
      ];
    },
    next: terminal,
  })
  .build();
