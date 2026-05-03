import {
  skill,
  type,
  prompt,
  render,
  act,
  view,
  terminal,
} from "@contentful/skill-kit";
import { checkPackagesAndEnv } from "../actions/check-packages-env.js";
import { checkApiConnectivity } from "../actions/check-api.js";
import { inspectContent } from "../actions/inspect-content.js";
import { validateSetup } from "../actions/validate-setup.js";
import {
  PackagesAndEnvResult,
  ApiCheckResult,
  ContentInspectionResult,
  Recommendation,
} from "../schemas.js";
import { VERSION } from "../version.js";

export default skill({
  name: "doctor",
  version: VERSION,
  description:
    "Diagnose and fix Contentful personalization issues. " +
    "Explores the codebase, checks packages and env vars, tests API connectivity, " +
    "inspects Contentful content state, and helps fix problems.",
  entry: "explore",

  stores: {
    project: type({
      framework: "string",
      projectPath: "string",
      "explorationSummary?": "string",
      "concerns?": "string[]",
      "personalizableCandidates?": "string[]",
      "packageData?": PackagesAndEnvResult,
    }),
    credentials: type({
      "spaceId?": "string",
      "accessToken?": "string",
      "previewToken?": "string",
      "environment?": "string",
      "entryId?": "string",
    }),
    diagnosis: type({
      "overallStatus?": "'pass' | 'warn' | 'fail'",
      "recommendations?": Recommendation.array(),
      "summary?": "string",
    }),
  },
})
  .step("explore", {
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
        ${refs.load("how-personalization-works.md")}
      `,
    response: type({
      framework:
        "'nextjs-app' | 'nextjs-pages' | 'nextjs-hybrid' | 'gatsby' | 'remix' | 'other'",
      "frameworkVersion?": "string",
      projectPath: "string",
      explorationSummary: "string",
      concerns: "string[]",
      "personalizableCandidates?": "string[]",
    }),
    save: ({ response, actionResult }) => ({
      step: response,
      project: {
        framework: response.framework,
        projectPath: response.projectPath,
        explorationSummary: response.explorationSummary,
        concerns: response.concerns,
        personalizableCandidates: response.personalizableCandidates,
        packageData: actionResult,
      },
    }),
    action: {
      input: ({ response }) => ({ projectPath: response.projectPath }),
      run: checkPackagesAndEnv,
    },
    next: "check-api",
  })

  .step("check-api", {
    action: {
      input: ({ store }) => {
        const pkg = store.project?.packageData;
        return {
          ...(pkg?.apiKey ? { apiKey: pkg.apiKey } : {}),
          ninetailedEnvironment: pkg?.environment ?? "main",
          ...(pkg?.contentfulSpaceId
            ? { contentfulSpaceId: pkg.contentfulSpaceId }
            : {}),
          contentfulEnvironment: pkg?.contentfulEnvironment ?? "master",
        };
      },
      run: checkApiConnectivity,
    },
    next: "triage",
  })

  .step("triage", {
    prompt: ({ store }) => {
      const concerns = store.project.concerns;
      const codeHealthy = (concerns?.length ?? 0) === 0;
      const pkg = store.project.packageData;
      const hasAutoTokens = !!(
        pkg?.contentfulSpaceId &&
        (pkg?.contentfulAccessToken || pkg?.contentfulPreviewToken)
      );

      const apiData = store.steps["check-api"];
      const codeStatusNote = codeHealthy
        ? "The code-level exploration found **no concerns** — the setup looks correct."
        : `The code-level exploration found **${concerns?.length ?? 0} concern(s)**:\n${(concerns ?? []).map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}`;

      const apiStatusNote =
        apiData?.status === "pass"
          ? "Ninetailed API connectivity is **healthy**."
          : apiData?.status === "skip"
            ? "Ninetailed API check was **skipped** (no API key found)."
            : "Ninetailed API connectivity check **failed**.";

      const tokenNote = hasAutoTokens
        ? "We found Contentful API tokens in the project environment files, so we can inspect entry content directly."
        : "We did not find Contentful API tokens in the project, but the user can provide them manually so we can inspect entry content.";

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

          ${
            hasAutoTokens
              ? "Mention that we already have Contentful API tokens from the project. Set hasAutoTokens to true."
              : "Explain that we need Contentful API tokens (CDA and optionally CPA/Preview) to do this check, and the user can provide them if they have access to Contentful Settings > API keys. Set hasAutoTokens to false."
          }

          Let the user choose how to proceed.
        `,
        act.askUser({
          type: "structured",
          question: "Would you like to inspect a specific Contentful entry?",
          options: [
            {
              value: "inspect-entry",
              label: "🔍 Yes, I have an entry ID to check",
            },
            {
              value: "need-help-finding",
              label: "🤔 I'm not sure which entry — help me find it",
            },
            {
              value: "skip",
              label: "⏭️ Skip content inspection — focus on code issues",
            },
          ],
        }),
      ];
    },
    response: type({
      choice: "'inspect-entry' | 'need-help-finding' | 'skip'",
      hasAutoTokens: "boolean",
      problemDescription: "string",
    }),
    next: ({ response }) => {
      if (response.choice === "skip") return "review";
      if (response.choice === "need-help-finding") return "help-find-entry";
      return response.hasAutoTokens ? "get-entry-id" : "collect-credentials";
    },
  })

  .step("help-find-entry", {
    prompt: ({ store }) => {
      const candidates = store.project.personalizableCandidates ?? [];
      const pkg = store.project.packageData;
      const hasAutoTokens = !!(
        pkg?.contentfulSpaceId &&
        (pkg?.contentfulAccessToken || pkg?.contentfulPreviewToken)
      );

      return [
        prompt`
          Help the user identify which Contentful entry to inspect.

          ${
            candidates.length > 0
              ? `During exploration, we found these components that appear to be personalization candidates:\n${candidates.map((c: string) => `- ${c}`).join("\n")}\n\nThe user should look for the Contentful entry that provides data to one of these components.`
              : "We did not identify specific personalization candidates during exploration."
          }

          Guide the user with these tips:
          - In Contentful, look for entries of content types that have the \`nt_experiences\` field
          - The entry ID (sys.id) is shown in the entry sidebar or in the URL when editing an entry
          - If they're debugging a specific page, look at the page entry or the section entries within it
          - They can also check the Contentful Personalization app to see which entries have experiences attached

          Ask them to provide an entry ID once they find one, or let them skip.

          Set hasAutoTokens to ${hasAutoTokens}.
        `,
        act.askUser({
          type: "open",
          question:
            'Paste the Contentful entry ID here (sys.id from the URL or sidebar), or type "skip" to continue without content inspection:',
        }),
      ];
    },
    response: type({
      "entryId?": "string",
      skip: "boolean",
      hasAutoTokens: "boolean",
    }),
    save: ({ response }) =>
      response.entryId
        ? { credentials: { entryId: response.entryId } }
        : undefined,
    next: ({ response }) => {
      if (response.skip || !response.entryId) return "review";
      return response.hasAutoTokens ? "get-entry-id" : "collect-credentials";
    },
  })

  .step("collect-credentials", {
    prompt: ({ store }) => {
      const pkg = store.project.packageData;
      const hasAutoTokens = !!(
        pkg?.contentfulSpaceId &&
        (pkg?.contentfulAccessToken || pkg?.contentfulPreviewToken)
      );

      if (hasAutoTokens) {
        return prompt`
          We already have Contentful API tokens from the project's environment files.
          Confirm that we should use these to inspect the entry.
          Set hasCredentials to true and leave the credential fields empty — we'll use the auto-detected ones.
        `;
      }

      return prompt`
        We need Contentful API credentials to inspect the entry but they were not
        auto-detected from the project's .env files.

        Before asking the user, quickly check if there are .env, .env.local, or similar
        files in the project that might contain Contentful tokens under non-standard names
        (e.g., GATSBY_CONTENTFUL_SPACE_ID, REACT_APP_CONTENTFUL_TOKEN, VITE_CONTENTFUL_*,
        or custom names). If you find credentials there, extract them and set hasCredentials
        to true without bothering the user.

        If you cannot find credentials in the project files, explain to the user what we need:
        - **Space ID** — Found in Contentful under Settings > General settings
        - **CDA Token** (Content Delivery API) — Found under Settings > API keys. This accesses published content.
        - **CPA Token** (Content Preview API) — Same location. This accesses draft + published content.
          The CPA token is optional but highly recommended — comparing CDA vs CPA is how we detect unpublished changes.
        - **Environment** — Usually "master" (the default). Only needed if they use a non-default environment.

        Ask them to paste their credentials, or let them skip if they don't have access.
        If they skip or can't provide credentials, set hasCredentials to false.
      `;
    },
    response: type({
      "spaceId?": "string",
      "accessToken?": "string",
      "previewToken?": "string",
      "environment?": "string",
      hasCredentials: "boolean",
    }),
    save: ({ response }) => ({
      credentials: {
        spaceId: response.spaceId,
        accessToken: response.accessToken,
        previewToken: response.previewToken,
        environment: response.environment,
      },
    }),
    next: ({ response }) =>
      response.hasCredentials ? "get-entry-id" : "review",
  })

  .step("get-entry-id", {
    prompt: ({ store }) => {
      const entryId = store.credentials?.entryId;
      if (entryId) {
        return prompt`
          We already have the entry ID: ${entryId}
          Confirm this entry ID to proceed with the content inspection.
        `;
      }
      return prompt`
        Ask the user for the Contentful entry ID (sys.id) they want to inspect.
        They can find it in the entry URL (the last segment after /entries/) or
        in the sidebar when editing an entry in Contentful.

        If the user provides a URL like https://app.contentful.com/spaces/.../entries/ENTRY_ID,
        extract the entry ID from it.
      `;
    },
    response: type({ entryId: "string" }),
    save: ({ response }) => ({
      credentials: { entryId: response.entryId },
    }),
    next: "run-inspection",
  })

  .step("run-inspection", {
    action: {
      input: ({ store }) => {
        const creds = store.credentials;
        const pkg = store.project?.packageData;
        const accessToken = creds?.accessToken ?? pkg?.contentfulAccessToken;
        const previewToken = creds?.previewToken ?? pkg?.contentfulPreviewToken;
        return {
          spaceId: creds?.spaceId ?? pkg?.contentfulSpaceId ?? "",
          environment:
            creds?.environment ?? pkg?.contentfulEnvironment ?? "master",
          ...(accessToken ? { accessToken } : {}),
          ...(previewToken ? { previewToken } : {}),
          entryId: creds?.entryId ?? "",
          includeDepth: 3,
        };
      },
      run: inspectContent,
    },
    next: "review",
  })

  .step("review", {
    prompt: ({ store, refs }) => {
      const explorationView = store.project.explorationSummary
        ? [
            `**Framework:** ${store.project.framework}`,
            "",
            store.project.explorationSummary,
            "",
            (store.project.concerns?.length ?? 0) > 0
              ? render.section(
                  "⚠️ Concerns from Exploration",
                  (store.project.concerns ?? [])
                    .map((c: string, i: number) => `${i + 1}. ${c}`)
                    .join("\n"),
                )
              : "✅ No concerns noted during exploration",
          ].join("\n")
        : "No exploration data available";

      const pkg = store.project.packageData;
      const packageView = pkg
        ? [
            render.table(
              [
                ...(pkg.packages?.ninetailed ?? []),
                ...(pkg.packages?.optimization ?? []),
              ].map((p: { name: string; version: string }) => ({
                Package: p.name,
                Version: p.version,
              })),
              { columns: ["Package", "Version"] },
            ) || "*No personalization SDK packages found*",
            "",
            render.table(
              (pkg.envVars ?? []).map(
                (ev: {
                  name: string;
                  status: string;
                  maskedValue?: string;
                }) => ({
                  Variable: ev.name,
                  Status: ev.status,
                  Value: ev.maskedValue ?? "—",
                }),
              ),
              { columns: ["Variable", "Status", "Value"] },
            ),
          ].join("\n")
        : "No package data available";

      const apiData = store.steps["check-api"];
      const apiView = apiData
        ? render.table(
            (apiData.findings ?? []).map(
              (f: { status: string; item: string; detail: string }) => ({
                Check: f.item,
                Status: f.status,
                Detail: f.detail,
              }),
            ),
            { columns: ["Check", "Status", "Detail"] },
          )
        : "No API data available";

      const content = store.steps["run-inspection"] as
        | ContentInspectionResult
        | undefined;
      const contentView = content
        ? [
            render.table(
              (content.findings ?? []).map(
                (f: { status: string; item: string; detail: string }) => ({
                  Check: f.item,
                  Status: f.status,
                  Detail: f.detail,
                }),
              ),
              { columns: ["Check", "Status", "Detail"] },
            ),
            "",
            content.entry?.comparison?.hasUnpublishedChanges
              ? "🔴 **UNPUBLISHED CHANGES DETECTED** — The entry has changes in preview (CPA) that are not in the published (CDA) content. This is a common cause of personalization appearing broken."
              : "",
          ].join("\n")
        : "No content inspection performed";

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

          ## Package & Environment Data
          ${packageView}

          ## API Connectivity Results
          ${apiView}

          ## Content Inspection Results
          ${contentView}

          ## Reference: Environment Variables
          ${refs.load("env-var-spec.md")}

          ## Reference: Package Versions
          ${refs.load("package-versions.md")}

          ## Reference: Common Errors
          ${refs.load("common-errors.md")}
        `;
    },
    response: type({
      overallStatus: "'pass' | 'warn' | 'fail'",
      recommendations: Recommendation.array(),
      summary: "string",
    }),
    save: ({ response }) => ({
      diagnosis: {
        overallStatus: response.overallStatus,
        recommendations: response.recommendations,
        summary: response.summary,
      },
    }),
    next: "report",
  })

  .step("report", {
    prompt: ({ store }) => {
      const icon = (status: string) => {
        switch (status) {
          case "pass":
            return "✅";
          case "warn":
            return "⚠️";
          case "fail":
            return "❌";
          case "skip":
            return "⏭️";
          default:
            return "❓";
        }
      };

      const statusLabel = (s: string) => {
        switch (s) {
          case "pass":
            return "Healthy";
          case "warn":
            return "Needs Attention";
          case "fail":
            return "Issues Found";
          default:
            return "Unknown";
        }
      };

      const overallStatusVal = store.diagnosis?.overallStatus ?? "fail";
      const sections: string[] = [];

      sections.push(`# 🩺 Optimization Doctor Report\n`);
      sections.push(
        `## ${icon(overallStatusVal)} Overall: ${statusLabel(overallStatusVal)}\n`,
      );
      sections.push(store.diagnosis?.summary ?? "No summary available");
      sections.push("---");

      if (store.project.explorationSummary) {
        sections.push(
          render.section(
            "🔍 Exploration Summary",
            store.project.explorationSummary,
          ),
        );
      }

      const pkg = store.project.packageData;
      if (pkg) {
        const allPkgs = [
          ...(pkg.packages?.ninetailed ?? []),
          ...(pkg.packages?.optimization ?? []),
        ];
        const pkgTable =
          allPkgs.length > 0
            ? render.table(
                allPkgs.map((p: { name: string; version: string }) => ({
                  Package: p.name,
                  Version: p.version,
                })),
                { columns: ["Package", "Version"] },
              )
            : "*No personalization SDK packages found*";

        const envTable = render.table(
          (pkg.envVars ?? []).map(
            (ev: { name: string; status: string; maskedValue?: string }) => ({
              Variable: ev.name,
              Status: ev.status,
              Value: ev.maskedValue ?? "—",
            }),
          ),
          { columns: ["Variable", "Status", "Value"] },
        );

        sections.push(
          render.section(
            "📦 Packages & Environment",
            `${pkgTable}\n\n${envTable}`,
          ),
        );
      }

      const apiData = store.steps["check-api"] as ApiCheckResult | undefined;
      if (apiData) {
        const apiTable = render.table(
          (apiData.findings ?? []).map(
            (f: { status: string; item: string; detail: string }) => ({
              Check: f.item,
              Status: f.status,
              Detail: f.detail,
            }),
          ),
          { columns: ["Check", "Status", "Detail"] },
        );
        sections.push(render.section("🌐 API Connectivity", apiTable));
      }

      const content = store.steps["run-inspection"] as
        | ContentInspectionResult
        | undefined;
      if (content) {
        const contentTable = render.table(
          (content.findings ?? []).map(
            (f: { status: string; item: string; detail: string }) => ({
              Check: f.item,
              Status: f.status,
              Detail: f.detail,
            }),
          ),
          { columns: ["Check", "Status", "Detail"] },
        );
        const comparisonNote = content.entry?.comparison?.hasUnpublishedChanges
          ? "\n\n🔴 **Unpublished changes detected** — see recommendations below."
          : "";
        sections.push(
          render.section(
            "📄 Content Inspection",
            `${contentTable}${comparisonNote}`,
          ),
        );
      }

      const rawRecs = store.diagnosis?.recommendations;
      if (rawRecs?.length) {
        const recommendations = rawRecs.filter((r): r is Recommendation => !!r);
        const priorityIcon: Record<string, string> = {
          critical: "🔴",
          warning: "🟡",
          info: "💡",
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
            (r, i) =>
              `${i + 1}. ${priorityIcon[r.priority] ?? "•"} **[${r.priority}]** ${r.message} *(${r.category})*`,
          )
          .join("\n");
        sections.push(render.section("💊 Recommendations", recs));
      }

      return [
        "Present the Doctor Report below to the user exactly as rendered. After showing the report, let the user decide whether to proceed with fixes.",
        view("Doctor Report", sections.join("\n\n")),
        act.askUser({
          type: "structured",
          question: "Would you like help fixing these issues?",
          options: [
            { value: "yes", label: "🔧 Yes, help me fix them" },
            { value: "no", label: "📋 No, the report is enough" },
          ],
        }),
      ];
    },
    response: type({ choice: "'yes' | 'no'" }),
    next: ({ response }) =>
      response.choice === "yes" ? "plan-fix" : "report-only",
  })

  .step("report-only", {
    prompt: prompt`
      The user has the diagnostic report and chose not to proceed with fixes.
      Thank them warmly and mention they can re-run the doctor anytime if issues
      come up later. Keep it to 2-3 sentences — brief and friendly.
      Do NOT repeat the report findings.
    `,
    next: terminal,
  })

  .step("plan-fix", {
    prompt: ({ store, refs }) => {
      const recs = (store.diagnosis?.recommendations ?? []).filter(
        (r): r is Recommendation => !!r,
      );
      const priorityIcon: Record<string, string> = {
        critical: "🔴",
        warning: "🟡",
        info: "💡",
      };

      const refSections: Array<{ label: string; content: string }> = [];
      const categories = new Set(recs.map((r) => r.category));
      if (categories.has("provider"))
        refSections.push({
          label: "Provider Patterns",
          content: refs.load("provider-patterns.md"),
        });
      if (categories.has("middleware"))
        refSections.push({
          label: "Middleware Patterns",
          content: refs.load("middleware-patterns.md"),
        });
      if (categories.has("components"))
        refSections.push({
          label: "Component Patterns",
          content: refs.load("component-patterns.md"),
        });
      if (categories.has("analytics"))
        refSections.push({
          label: "Analytics Patterns",
          content: refs.load("analytics-patterns.md"),
        });
      if (categories.has("middleware"))
        refSections.push({
          label: "SSR Guide",
          content: refs.load("ssr-guide.md"),
        });

      return [
        prompt`
          Create a plan to fix the ${recs.length} issue${recs.length !== 1 ? "s" : ""} found during diagnosis.
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
          ${refSections.map((r) => `### ${r.label}\n${r.content}`).join("\n\n---\n\n")}
        `,
        act.plan({
          summary: `Fix ${recs.length} issue${recs.length !== 1 ? "s" : ""} in ${store.project.framework} personalization setup`,
          steps: recs.map(
            (r) =>
              `${priorityIcon[r.priority] ?? "•"} [${r.priority}] ${r.message}`,
          ),
        }),
      ];
    },
    response: type({
      approved: "boolean",
      plan: "string",
      filesToModify: "string[]",
    }),
    next: ({ response }) => (response.approved ? "fix" : "done"),
  })

  .step("fix", {
    prompt: ({ store, system, refs }) => {
      const recs = (store.diagnosis?.recommendations ?? []).filter(
        (r): r is Recommendation => !!r,
      );
      const priorityIcon: Record<string, string> = {
        critical: "🔴",
        warning: "🟡",
        info: "💡",
      };

      const categories = new Set(recs.map((r) => r.category));
      const refSections: Array<{ label: string; content: string }> = [];
      if (categories.has("packages") || categories.has("env"))
        refSections.push({
          label: "Env Var Spec",
          content: refs.load("env-var-spec.md"),
        });
      if (categories.has("provider"))
        refSections.push({
          label: "Provider Patterns",
          content: refs.load("provider-patterns.md"),
        });
      if (categories.has("middleware"))
        refSections.push({
          label: "Middleware Patterns",
          content: refs.load("middleware-patterns.md"),
        });
      if (categories.has("components"))
        refSections.push({
          label: "Component Patterns",
          content: refs.load("component-patterns.md"),
        });

      const fixPlan = store.steps["plan-fix"]?.plan;
      const fixFiles = store.steps["plan-fix"]?.filesToModify;

      return [
        system`Apply each fix methodically. Update the checklist status as you complete each one. Match the project's existing code style. For content-category issues, provide clear step-by-step instructions for the user to follow in the Contentful UI rather than attempting code changes.`,
        prompt`
          Implement the fixes from the approved plan. For each fix:

          - **Package issues** → use the installPackages action
          - **Env var issues** → use the writeEnvFile action
          - **Code issues** → edit files directly
          - **Content issues** (unpublished entries, missing fields) → provide Contentful UI instructions

          After all fixes, the setup will be re-verified automatically.

          ${fixPlan ? `**Plan:** ${fixPlan}` : ""}
          ${fixFiles?.length ? `**Files to modify:** ${fixFiles.join(", ")}` : ""}

          ## Reference Material
          ${refSections.map((r) => `### ${r.label}\n${r.content}`).join("\n\n---\n\n")}
        `,
        act.checklist({
          create: recs.map((r) => ({
            title: `${priorityIcon[r.priority] ?? "•"} [${r.priority}] ${r.message}`,
            status: "pending" as const,
          })),
        }),
      ];
    },
    next: "re-verify",
  })

  .step("re-verify", {
    action: {
      input: ({ store }) => ({
        projectPath: store.project?.projectPath ?? ".",
      }),
      run: validateSetup,
    },
    next: ({ actionResult, attempts }) => {
      const result = actionResult as { overallStatus: string } | undefined;
      if (result?.overallStatus === "pass") return "done";
      if (attempts >= 3) return "done";
      return "fix";
    },
  })

  .step("done", {
    prompt: ({ store }) => {
      const recs = (store.diagnosis?.recommendations ?? []).filter(
        (r): r is Recommendation => !!r,
      );

      const reVerifyResult = store.steps["re-verify"];
      const reVerifyStatus = (
        reVerifyResult as { overallStatus?: string } | undefined
      )?.overallStatus;
      const reVerifySummary = (
        reVerifyResult as { summary?: string } | undefined
      )?.summary;

      const statusIcon =
        reVerifyStatus === "pass"
          ? "✅"
          : reVerifyStatus === "warn"
            ? "⚠️"
            : "❌";

      const sections: string[] = [];
      sections.push(`# 🩺 Doctor Summary\n`);
      sections.push(
        render.section(
          "Before",
          `Status: ${store.diagnosis?.overallStatus ?? "unknown"}`,
        ),
      );

      if (reVerifyStatus) {
        sections.push(
          render.section(
            `After: ${statusIcon} ${reVerifyStatus.toUpperCase()}`,
            reVerifySummary ?? "No verification summary",
          ),
        );
      }

      if (recs.length > 0) {
        sections.push(
          render.section(
            "🔧 Fixes Applied",
            recs.map((r) => `- ${r.message}`).join("\n"),
          ),
        );
      }

      if (reVerifyStatus !== "pass") {
        sections.push(
          render.section(
            "💡 Remaining Issues",
            "Some issues may remain. Consider running the doctor again after addressing any manual steps above.",
          ),
        );
      }

      return [
        "Present the final summary below to the user. Be warm and encouraging. If everything passed, celebrate briefly. If issues remain, be honest but constructive.",
        view("Doctor Summary", sections.join("\n\n")),
      ];
    },
    next: terminal,
  })

  .build();
