import { skill, type, prompt, render, act, view, terminal } from '@contentful/skill-kit';
import { checkPackages } from '../actions/check-packages.js';
import { scanCredentials } from '../actions/scan-credentials.js';
import { checkApiConnectivity } from '../actions/check-api.js';
import { inspectContent } from '../actions/inspect-content.js';
import { validateSetup } from '../actions/validate-setup.js';
import {
  PackagesResult,
  CredentialsScanResult,
  ApiCheckResult,
  ContentInspectionResult,
  Recommendation,
} from '../schemas.js';
import { VERSION } from '../version.js';

export default skill({
  name: 'doctor',
  version: VERSION,
  description:
    'Diagnose and fix Contentful personalization issues. ' +
    'Explores the codebase, checks packages and env vars, tests API connectivity, ' +
    'inspects Contentful content state, and helps fix problems.',
  entry: 'explore',

  stores: {
    project: type({
      framework: 'string',
      projectPath: 'string',
      'explorationSummary?': 'string',
      'concerns?': 'string[]',
      'personalizableCandidates?': 'string[]',
      packages: PackagesResult,
    }),
    credentials: type({
      personalization: {
        apiKey: 'string',
        environment: 'string',
      },
      contentful: {
        spaceId: 'string',
        accessToken: 'string',
        'previewToken?': 'string',
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
  .step('explore', {
    prompt: ({ refs }) => prompt`
        Explore this project to understand the current personalization setup.
        You are gathering facts about the CURRENT state — do NOT diagnose problems
        or suggest fixes yet. That happens in a later step.

        ## What to investigate (in priority order)

        1. **Framework & router** — Read package.json and project structure.
           What framework, version, and router type?

        2. **Provider configuration** — Search for NinetailedProvider or OptimizationProvider.
           Where is it? How is it configured? What plugins? Is it wrapping the right subtree?

        3. **Middleware / SSR** — Look for middleware.ts/js, edge functions, or server-side
           personalization code. Check for preflight calls, cookie handling, matcher config.

        4. **Component wiring** — Search for Experience, Personalize, ExperienceMapper,
           BlockRenderer, ContentTypeMap. How are components mapped and wrapped?

        5. **Analytics** — Insights plugin, track/page/identify calls, GTM or Segment?

        6. **Rendering pipeline** — How is content fetched? What include depth?
           Page-level or component-level?

        ## 🚩 Red flags to watch for
        - Provider missing or wrapping wrong subtree
        - Middleware matcher that catches static assets
        - Include depth < 10 (personalization entries need depth)
        - Missing or empty environment variables
        - Client-side data fetching without provider
        - Components that fetch their own data (breaks personalization)

        For each area, note the specific file paths and what you found.
        If something looks wrong, describe what you see but do NOT attempt to fix it.

        ## Reference: How Personalization Works
        ${refs.load('how-personalization-works.md')}
      `,
    response: type({
      framework: "'nextjs-app' | 'nextjs-pages' | 'nextjs-hybrid' | 'gatsby' | 'remix' | 'other'",
      'frameworkVersion?': 'string',
      projectPath: 'string',
      explorationSummary: 'string',
      concerns: 'string[]',
      'personalizableCandidates?': 'string[]',
    }),
    save: ({ response, actionResult }) => ({
      step: response,
      project: {
        framework: response.framework,
        projectPath: response.projectPath,
        explorationSummary: response.explorationSummary,
        concerns: response.concerns,
        personalizableCandidates: response.personalizableCandidates,
        packages: actionResult,
      },
    }),
    action: {
      input: ({ response }) => ({ projectPath: response.projectPath }),
      run: checkPackages,
    },
    next: 'scan-credentials',
  })

  .step('scan-credentials', {
    action: {
      input: ({ store }) => ({ projectPath: store.project?.projectPath ?? '.' }),
      run: scanCredentials,
    },
    next: 'confirm-credentials',
  })

  .step('confirm-credentials', {
    prompt: ({ store }) => {
      const scanned = store.steps['scan-credentials'] as CredentialsScanResult | undefined;
      const envVars = scanned?.envVars ?? [];
      const hasPersonalization = !!scanned?.personalization?.apiKey;
      const hasContentful = !!(
        scanned?.contentful?.spaceId &&
        (scanned?.contentful?.accessToken || scanned?.contentful?.previewToken)
      );

      const envTable = render.table(
        envVars.map((ev: { name: string; status: string; maskedValue?: string }) => ({
          Variable: ev.name,
          Status: ev.status,
          Value: ev.maskedValue ?? '—',
        })),
        { columns: ['Variable', 'Status', 'Value'] },
      );

      const detectedSummary: string[] = [];
      if (hasPersonalization) {
        detectedSummary.push(
          `- **Ninetailed API key**: detected (${scanned?.personalization?.apiKey ? '****' + scanned.personalization.apiKey.slice(-4) : 'unknown'})`,
        );
        if (scanned?.personalization?.environment) {
          detectedSummary.push(`- **Ninetailed environment**: ${scanned.personalization.environment}`);
        }
      }
      if (hasContentful) {
        detectedSummary.push(`- **Contentful Space ID**: ${scanned?.contentful?.spaceId ?? 'unknown'}`);
        if (scanned?.contentful?.accessToken)
          detectedSummary.push(`- **CDA token**: detected (****${scanned.contentful.accessToken.slice(-4)})`);
        if (scanned?.contentful?.previewToken)
          detectedSummary.push(`- **CPA token**: detected (****${scanned.contentful.previewToken.slice(-4)})`);
        if (scanned?.contentful?.environment)
          detectedSummary.push(`- **Contentful environment**: ${scanned.contentful.environment}`);
      }

      const hasAnyCreds = hasPersonalization || hasContentful;

      return [
        prompt`
          We scanned the project's environment files for API credentials.

          ## Environment Variables Found
          ${envTable}

          ${
            hasAnyCreds
              ? `## Auto-Detected Credentials\n${detectedSummary.join('\n')}\n\nPlease confirm these are correct, or provide corrections. If any are wrong or missing, include the corrected values in your response.`
              : `## No Credentials Detected\nWe did not find Contentful or Ninetailed API credentials in the project's environment files.\n\nThe user can provide them manually if available:\n- **Ninetailed API Key** — Found in the Ninetailed dashboard\n- **Contentful Space ID** — Found in Contentful under Settings > General settings\n- **CDA Token** (Content Delivery API) — Found under Settings > API keys\n- **CPA Token** (Content Preview API) — Same location, optional but recommended\n- **Environment** — Usually "master" for Contentful, "main" for Ninetailed\n\nAsk the user if they can provide credentials, or if they'd like to proceed with a code-only diagnostic.`
          }

          Set hasCredentials to true if the user confirms or provides credentials.
          Set hasCredentials to false if they decline or cannot provide credentials.

          If the user provides or confirms credentials, populate the personalization and contentful
          fields with whatever values are available (auto-detected or user-provided).
        `,
        act.askUser({
          type: 'structured',
          question: hasAnyCreds
            ? 'Are these credentials correct?'
            : 'Can you provide API credentials for a full diagnostic?',
          options: hasAnyCreds
            ? [
                { value: 'confirm', label: '✅ Yes, these look correct' },
                { value: 'correct', label: '✏️ I need to correct some values' },
                { value: 'decline', label: '⏭️ Skip — proceed without API checks' },
              ]
            : [
                { value: 'provide', label: '🔑 Yes, I can provide credentials' },
                { value: 'decline', label: '⏭️ Skip — code-only diagnostic' },
              ],
        }),
      ];
    },
    response: type({
      hasCredentials: 'boolean',
      'personalization?': {
        'apiKey?': 'string',
        'environment?': 'string',
      },
      'contentful?': {
        'spaceId?': 'string',
        'accessToken?': 'string',
        'previewToken?': 'string',
        'environment?': 'string',
      },
    }),
    next: ({ response }) => (response.hasCredentials ? 'apply-credentials' : 'review'),
  })

  .step('apply-credentials', {
    save: ({ store }) => {
      const confirmed = store.steps['confirm-credentials'] as
        | {
            personalization?: { apiKey?: string; environment?: string };
            contentful?: { spaceId?: string; accessToken?: string; previewToken?: string; environment?: string };
          }
        | undefined;
      const scanned = store.steps['scan-credentials'] as CredentialsScanResult | undefined;
      return {
        credentials: {
          personalization: {
            apiKey: confirmed?.personalization?.apiKey ?? scanned?.personalization?.apiKey ?? '',
            environment: confirmed?.personalization?.environment ?? scanned?.personalization?.environment ?? 'main',
          },
          contentful: {
            spaceId: confirmed?.contentful?.spaceId ?? scanned?.contentful?.spaceId ?? '',
            accessToken: confirmed?.contentful?.accessToken ?? scanned?.contentful?.accessToken ?? '',
            ...((confirmed?.contentful?.previewToken ?? scanned?.contentful?.previewToken)
              ? { previewToken: confirmed?.contentful?.previewToken ?? scanned?.contentful?.previewToken }
              : {}),
            environment: confirmed?.contentful?.environment ?? scanned?.contentful?.environment ?? 'master',
          },
        },
      };
    },
    next: 'check-api',
  })

  .step('check-api', {
    action: {
      input: ({ store }) => {
        const creds = store.credentials;
        return {
          ...(creds?.personalization?.apiKey ? { apiKey: creds.personalization.apiKey } : {}),
          ninetailedEnvironment: creds?.personalization?.environment ?? 'main',
          ...(creds?.contentful?.spaceId ? { contentfulSpaceId: creds.contentful.spaceId } : {}),
          contentfulEnvironment: creds?.contentful?.environment ?? 'master',
        };
      },
      run: checkApiConnectivity,
    },
    next: 'triage',
  })

  .step('triage', {
    prompt: ({ store }) => {
      const concerns = store.project.concerns;
      const codeHealthy = (concerns?.length ?? 0) === 0;

      const apiData = store.steps['check-api'] as ApiCheckResult | undefined;
      const codeStatusNote = codeHealthy
        ? 'The code-level exploration found **no concerns** — the setup looks correct.'
        : `The code-level exploration found **${concerns?.length ?? 0} concern(s)**:\n${(concerns ?? []).map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}`;

      const apiStatusNote =
        apiData?.status === 'pass'
          ? 'Ninetailed API connectivity is **healthy**.'
          : apiData?.status === 'skip'
            ? 'Ninetailed API check was **skipped** (no API key found).'
            : 'Ninetailed API connectivity check **failed**.';

      const hasContentfulTokens = !!(
        store.credentials?.contentful?.spaceId &&
        (store.credentials?.contentful?.accessToken || store.credentials?.contentful?.previewToken)
      );

      const tokenNote = hasContentfulTokens
        ? 'We have Contentful API tokens available, so we can inspect entry content directly.'
        : 'We do not have Contentful API tokens, so we cannot inspect entry content.';

      return [
        prompt`
          You have completed the code-level exploration and API connectivity check.
          Now you need to help the user decide what to investigate next.

          ## Findings So Far

          ${codeStatusNote}

          ${apiStatusNote}

          ${tokenNote}

          ## Your Task

          Present a brief summary of the findings so far. Cover ALL three areas:
          1. Code-level setup (what was found or missing)
          2. Ninetailed API connectivity result (passed, failed, or skipped — say which)
          3. Environment variables status

          Keep it concise (3-5 sentences) but don't omit any area.

          Then explain that we can also **inspect a specific Contentful entry** to check
          whether personalization content is correctly published. This catches problems like:
          - Content type not extended with the nt_experiences field
          - Experiences attached but the entry not re-published
          - Experience or variant entries still in draft
          - Include depth too shallow in the API response

          Let the user choose how to proceed.
        `,
        act.askUser({
          type: 'structured',
          question: 'Would you like to inspect a specific Contentful entry?',
          options: [
            {
              value: 'inspect-entry',
              label: '🔍 Yes, I have an entry ID to check',
            },
            {
              value: 'need-help-finding',
              label: "🤔 I'm not sure which entry — help me find it",
            },
            {
              value: 'skip',
              label: '⏭️ Skip content inspection — focus on code issues',
            },
          ],
        }),
      ];
    },
    response: type({
      choice: "'inspect-entry' | 'need-help-finding' | 'skip'",
      problemDescription: 'string',
    }),
    next: ({ response }) => {
      if (response.choice === 'skip') return 'review';
      return 'choose-entry';
    },
  })

  .step('choose-entry', {
    prompt: ({ store }) => {
      const candidates = store.project.personalizableCandidates ?? [];
      const cameFromHelp = store.steps['triage']?.choice === 'need-help-finding';

      if (cameFromHelp) {
        return [
          prompt`
            Help the user identify which Contentful entry to inspect.

            ${
              candidates.length > 0
                ? `During exploration, we found these components that appear to be personalization candidates:\n${candidates.map((c: string) => `- ${c}`).join('\n')}\n\nThe user should look for the Contentful entry that provides data to one of these components.`
                : 'We did not identify specific personalization candidates during exploration.'
            }

            Guide the user with these tips:
            - In Contentful, look for entries of content types that have the \`nt_experiences\` field
            - The entry ID (sys.id) is shown in the entry sidebar or in the URL when editing an entry
            - If they're debugging a specific page, look at the page entry or the section entries within it
            - They can also check the Contentful Personalization app to see which entries have experiences attached

            Ask them to provide an entry ID once they find one, or let them skip.
          `,
          act.askUser({
            type: 'open',
            question:
              'Paste the Contentful entry ID here (sys.id from the URL or sidebar), or type "skip" to continue without content inspection:',
          }),
        ];
      }

      return [
        prompt`
          Ask the user for the Contentful entry ID (sys.id) they want to inspect.
          They can find it in the entry URL (the last segment after /entries/) or
          in the sidebar when editing an entry in Contentful.

          If the user provides a URL like https://app.contentful.com/spaces/.../entries/ENTRY_ID,
          extract the entry ID from it.
        `,
        act.askUser({
          type: 'open',
          question:
            'Paste the Contentful entry ID here (sys.id from the URL or sidebar), or type "skip" to continue without content inspection:',
        }),
      ];
    },
    response: type({
      'entryId?': 'string',
      skip: 'boolean',
    }),
    next: ({ response }) => {
      if (response.skip || !response.entryId) return 'review';
      return 'run-inspection';
    },
  })

  .step('run-inspection', {
    action: {
      input: ({ store }) => {
        const creds = store.credentials;
        const entryId = (store.steps['choose-entry'] as { entryId?: string } | undefined)?.entryId ?? '';
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
    next: 'review',
  })

  .step('review', {
    prompt: ({ store, refs }) => {
      const explorationView = store.project.explorationSummary
        ? [
            `**Framework:** ${store.project.framework}`,
            '',
            store.project.explorationSummary,
            '',
            (store.project.concerns?.length ?? 0) > 0
              ? render.section(
                  '⚠️ Concerns from Exploration',
                  (store.project.concerns ?? []).map((c: string, i: number) => `${i + 1}. ${c}`).join('\n'),
                )
              : '✅ No concerns noted during exploration',
          ].join('\n')
        : 'No exploration data available';

      const pkg = store.project.packages;
      const packageView = pkg
        ? [
            render.table(
              [...(pkg.packages?.ninetailed ?? []), ...(pkg.packages?.optimization ?? [])].map(
                (p: { name: string; version: string }) => ({
                  Package: p.name,
                  Version: p.version,
                }),
              ),
              { columns: ['Package', 'Version'] },
            ) || '*No personalization SDK packages found*',
          ].join('\n')
        : 'No package data available';

      const scanned = store.steps['scan-credentials'] as CredentialsScanResult | undefined;
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

      const apiData = store.steps['check-api'] as ApiCheckResult | undefined;
      const apiView = apiData
        ? render.table(
            (apiData.findings ?? []).map((f: { status: string; item: string; detail: string }) => ({
              Check: f.item,
              Status: f.status,
              Detail: f.detail,
            })),
            { columns: ['Check', 'Status', 'Detail'] },
          )
        : 'No API data available';

      const content = store.steps['run-inspection'] as ContentInspectionResult | undefined;
      const contentView = content
        ? [
            render.table(
              (content.findings ?? []).map((f: { status: string; item: string; detail: string }) => ({
                Check: f.item,
                Status: f.status,
                Detail: f.detail,
              })),
              { columns: ['Check', 'Status', 'Detail'] },
            ),
            '',
            content.entry?.comparison?.hasUnpublishedChanges
              ? '🔴 **UNPUBLISHED CHANGES DETECTED** — The entry has changes in preview (CPA) that are not in the published (CDA) content. This is a common cause of personalization appearing broken.'
              : '',
          ].join('\n')
        : 'No content inspection performed';

      return prompt`
          Synthesize ALL diagnostic findings below into prioritized recommendations.

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

          ## Exploration Findings
          ${explorationView}

          ## Package Data
          ${packageView}

          ## Environment Variables
          ${envView}

          ## API Connectivity Results
          ${apiView}

          ## Content Inspection Results
          ${contentView}

          ## Reference: Environment Variables
          ${refs.load('env-var-spec.md')}

          ## Reference: Package Versions
          ${refs.load('package-versions.md')}

          ## Reference: Common Errors
          ${refs.load('common-errors.md')}
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

      const diagnosis = store.diagnosis!;
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

        const scanned = store.steps['scan-credentials'] as CredentialsScanResult | undefined;
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

      const apiData = store.steps['check-api'] as ApiCheckResult | undefined;
      if (apiData) {
        const apiTable = render.table(
          (apiData.findings ?? []).map((f: { status: string; item: string; detail: string }) => ({
            Check: f.item,
            Status: f.status,
            Detail: f.detail,
          })),
          { columns: ['Check', 'Status', 'Detail'] },
        );
        sections.push(render.section('🌐 API Connectivity', apiTable));
      }

      const content = store.steps['run-inspection'] as ContentInspectionResult | undefined;
      if (content) {
        const contentTable = render.table(
          (content.findings ?? []).map((f: { status: string; item: string; detail: string }) => ({
            Check: f.item,
            Status: f.status,
            Detail: f.detail,
          })),
          { columns: ['Check', 'Status', 'Detail'] },
        );
        const comparisonNote = content.entry?.comparison?.hasUnpublishedChanges
          ? '\n\n🔴 **Unpublished changes detected** — see recommendations below.'
          : '';
        sections.push(render.section('📄 Content Inspection', `${contentTable}${comparisonNote}`));
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
      const diagnosis = store.diagnosis!;
      const recs = diagnosis.recommendations!.filter((r): r is Recommendation => !!r);
      const priorityIcon: Record<string, string> = {
        critical: '🔴',
        warning: '🟡',
        info: '💡',
      };

      const refSections: Array<{ label: string; content: string }> = [];
      const categories = new Set(recs.map((r) => r.category));
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

          ${render.kv({
            Framework: store.project.framework,
            Project: store.project.projectPath,
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
      const diagnosis = store.diagnosis!;
      const recs = diagnosis.recommendations!.filter((r): r is Recommendation => !!r);
      const priorityIcon: Record<string, string> = {
        critical: '🔴',
        warning: '🟡',
        info: '💡',
      };

      const categories = new Set(recs.map((r) => r.category));
      const refSections: Array<{ label: string; content: string }> = [];
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

          ${fixPlan ? `**Plan:** ${fixPlan}` : ''}
          ${fixFiles?.length ? `**Files to modify:** ${fixFiles.join(', ')}` : ''}

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
    next: 're-verify',
  })

  .step('re-verify', {
    action: {
      input: ({ store }) => ({
        projectPath: store.project?.projectPath ?? '.',
      }),
      run: validateSetup,
    },
    next: ({ actionResult, attempts }) => {
      const result = actionResult as { overallStatus: string } | undefined;
      if (result?.overallStatus === 'pass') return 'done';
      if (attempts >= 3) return 'done';
      return 'fix';
    },
  })

  .step('done', {
    prompt: ({ store }) => {
      const diagnosis = store.diagnosis!;
      const recs = diagnosis.recommendations!.filter((r): r is Recommendation => !!r);

      const reVerifyResult = store.steps['re-verify'];
      const reVerifyStatus = (reVerifyResult as { overallStatus?: string } | undefined)?.overallStatus;
      const reVerifySummary = (reVerifyResult as { summary?: string } | undefined)?.summary;

      const cameFromReport = !store.steps['plan-fix'] && !reVerifyResult;
      const cameFromPlanFix =
        store.steps['plan-fix'] && !(store.steps['plan-fix'] as { approved?: boolean })?.approved && !reVerifyResult;
      const cameFromReVerify = !!reVerifyResult;

      if (cameFromReport) {
        // No fixes requested — user said "the report is enough"
        return prompt`
          The user has the diagnostic report and chose not to proceed with fixes.
          Thank them warmly and mention they can re-run the doctor anytime if issues
          come up later. Keep it to 2-3 sentences — brief and friendly.
          Do NOT repeat the report findings.
        `;
      }

      if (cameFromPlanFix) {
        // Fixes declined at plan-fix stage
        return prompt`
          The user reviewed the fix plan but chose not to proceed with implementation.
          Acknowledge their choice, remind them the diagnostic report is still available,
          and mention they can re-run the doctor anytime. Keep it to 2-3 sentences.
          Do NOT repeat the report findings.
        `;
      }

      // Fixes applied — show before/after
      const statusIcon = reVerifyStatus === 'pass' ? '✅' : reVerifyStatus === 'warn' ? '⚠️' : '❌';

      const sections: string[] = [];
      sections.push(`# 🩺 Doctor Summary\n`);
      sections.push(render.section('Before', `Status: ${diagnosis.overallStatus}`));

      if (reVerifyStatus) {
        sections.push(
          render.section(
            `After: ${statusIcon} ${reVerifyStatus.toUpperCase()}`,
            reVerifySummary ?? 'No verification summary',
          ),
        );
      }

      if (recs.length > 0) {
        sections.push(render.section('🔧 Fixes Applied', recs.map((r) => `- ${r.message}`).join('\n')));
      }

      if (reVerifyStatus !== 'pass') {
        sections.push(
          render.section(
            '💡 Remaining Issues',
            'Some issues may remain. Consider running the doctor again after addressing any manual steps above.',
          ),
        );
      }

      return [
        'Present the final summary below to the user. Be warm and encouraging. If everything passed, celebrate briefly. If issues remain, be honest but constructive.',
        view('Doctor Summary', sections.join('\n\n')),
      ];
    },
    next: terminal,
  })

  .build();
