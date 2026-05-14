<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="contentful-logo.svg" />
  <img src="contentful-logo.svg" alt="Contentful" height="40" />
</picture>

<br /><br />

**Your AI agent knows how to code. These skills teach it Contentful.**

<br />

[![version](https://img.shields.io/badge/v1.5.1-0286FF?style=flat&label=version)](https://github.com/contentful/skills/releases)
[![license](https://img.shields.io/badge/MIT-grey?style=flat&label=license)](LICENSE)
[![skills](https://img.shields.io/badge/7_skills-0286FF?style=flat&label=)](skills/)
[![platforms](https://img.shields.io/badge/35%2B_platforms-0286FF?style=flat&label=)](https://agentskills.io)

</div>

<br />

AI coding agents write great code but know nothing about your content model, your SDK patterns, or which of Contentful's five APIs to reach for. **Contentful Skills** fixes that — curated instructions, reference docs, and structured workflows that produce correct Contentful integrations on the first try.

## Quickstart — Claude Code

Two commands. You get seven skills plus live MCP connections to your Contentful spaces.

```
/plugin marketplace add contentful/skills
/plugin install contentful@contentful
```

Run `/reload-plugins` to activate. This registers two MCP servers:
- **contentful-mcp** — connection to `mcp.contentful.com` for CMS operations
- **contentful-personalization** — local MCP for structured personalization workflows

---

## What's inside

| Skill | What it does |
|:------|:-------------|
| **[contentful-guide](#contentful-guide)** | Explains core concepts and routes you to the right skill, API, or doc. Start here. |
| **[contentful-api](#contentful-api)** | Language-agnostic REST and GraphQL API reference — curl examples for CMA, CDA, CPA, Images, and GraphQL. |
| **[contentful-nextjs](#contentful-nextjs)** | Integrates Contentful into a Next.js project — SDK setup, content fetching, Draft Mode previews. |
| **[contentful-migration](#contentful-migration)** | Writes and runs content model migration scripts — fields, validations, transforms, editor interfaces. |
| **[contentful-custom-app-from-scratch](#contentful-custom-app-from-scratch)** | Designs, scaffolds, builds, and validates new App Framework custom apps. |
| **[contentful-custom-app-enhancement](#contentful-custom-app-enhancement)** | Improves and debugs existing Contentful custom apps in customer-owned repos. |
| **[contentful-personalization](#contentful-personalization)** | Sets up, debugs, and develops personalization and A/B testing with the Experiences SDK. |

---

## Other platforms

Skills also work without the plugin on any platform that supports the [agentskills.io](https://agentskills.io) spec.

### Cursor

1. Open **Settings** → **Rules**
2. Click **Add Rule** → **Remote Rule (GitHub)**
3. Enter `contentful/skills`

### Universal CLI

```bash
npx skills add contentful/skills
```

Works with GitHub Copilot, VS Code, OpenAI Codex, Gemini CLI, and [35+ other platforms](https://agentskills.io).

<details>
<summary><strong>More options</strong></summary>

<br />

**Gemini CLI:**

```bash
gemini skills install contentful/skills
```

**GitHub Copilot / VS Code:**

Skills auto-discover from `.agents/skills/` when added to your project. Use `/skills` in Copilot Chat to confirm they're loaded.

**Install a single skill:**

```bash
npx skills add contentful/skills --skill contentful-personalization
```

Available: `contentful-guide`, `contentful-api`, `contentful-nextjs`, `contentful-migration`, `contentful-custom-app-from-scratch`, `contentful-custom-app-enhancement`, `contentful-personalization`

</details>

---

## Skills

### contentful-guide

Explains core Contentful concepts and routes you to the right skill or documentation. Start here if you're new to Contentful or unsure which API to use.

<details>
<summary>Triggers and details</summary>

<br />

**Activates on:** "Contentful 101", "which API should I use", "how do I get started", "what does X mean in Contentful"

**Covers:**
- Core vocabulary — spaces, environments, content types, entries, assets, locales
- API selection — CDA vs CPA vs CMA vs GraphQL vs Images API
- Routing to the right implementation skill
- Contentful MCP server orientation

</details>

### contentful-api

Language-agnostic reference for Contentful's REST and GraphQL APIs. Pair this with any framework or language — examples are curl-based.

<details>
<summary>Triggers and details</summary>

<br />

**Activates on:** "curl Contentful", "CMA request", "CDA query parameters", "publish entry HTTP", "Images API URL", "Contentful GraphQL query"

**Covers:**
- Authentication — token types, headers, US/EU base URLs
- HTTP conventions — version locking, rate limits, pagination, error payloads, locale structure
- Content Management API — entries, content types, assets, environments, bulk actions
- Content Delivery API — querying, includes/link resolution, localization, sync
- Content Preview API — draft + published content via CDA endpoints
- Images API — on-the-fly transformations via URL parameters
- GraphQL Content API — querying with CDA tokens

</details>

### contentful-nextjs

Add and configure Contentful in a Next.js project. Covers SDK setup, environment variables, content fetching, and Draft Mode preview flows for both App Router and Pages Router.

<details>
<summary>Triggers and details</summary>

<br />

**Activates on:** "add Contentful to Next.js", "Contentful SDK setup", "Draft Mode", "preview mode", "Server Components Contentful"

**Covers:**
- SDK installation and client configuration
- Environment variables and environment aliases
- Content fetching patterns (App Router and Pages Router)
- Draft Mode preview flows with CPA
- ISR (Incremental Static Regeneration) setup
- Troubleshooting common integration issues

</details>

### contentful-migration

Write and run content model migration scripts using the Contentful migration library. Covers field operations, validations, entry transforms, and editor interface configuration.

<details>
<summary>Triggers and details</summary>

<br />

**Activates on:** "write a migration", "create content type", "schema migration", "field validation", "editor interface", "changeFieldId"

**Covers:**
- Content type creation, editing, and deletion
- Field operations — add, rename, move, change type
- Validations — range, regex, linked content types, asset file constraints
- Entry transforms — in-place edits, deriving linked entries, moving entries between types
- Editor interface wiring — widgets, field layout, sidebar controls
- Best practices — sandbox testing, sequential file naming, separating schema from data changes

</details>

### contentful-custom-app-from-scratch

Design, scaffold, build, and validate a new Contentful App Framework custom app for your own repository or workspace.

<details>
<summary>Triggers and details</summary>

<br />

**Activates on:** "build a Contentful app", "custom app from scratch", "App Framework app", "sidebar app", "field editor app", "page app", "app action", "app function"

**Covers:**
- Idea shaping and v1 scoping for internal custom apps
- App location selection — app config, page, home, dialog, entry editor, entry field, entry sidebar
- Scaffolding with `create-contentful-app`
- App SDK, React Apps Toolkit, Forma 36, installation parameters, App Actions, and Functions guidance
- Local Contentful setup, sandbox testing, validation, and handoff

</details>

### contentful-custom-app-enhancement

Improve, debug, and extend an existing Contentful App Framework custom app in a customer-owned repository.

<details>
<summary>Triggers and details</summary>

<br />

**Activates on:** "fix my Contentful app", "improve a custom app", "enhance App Framework app", "debug custom app", "update sidebar app", "custom app feature request"

**Covers:**
- Triage from bug reports, support notes, screenshots, and feature requests
- Existing app inspection across locations, SDK usage, parameters, App Actions, Functions, and backend code
- Small, reviewable implementation plans
- App-native UI and security guardrails
- Targeted tests, local smoke checks, sandbox verification, and PR handoff

</details>

### contentful-personalization

Set up, debug, and develop with Contentful personalization and A/B testing. A structured, multi-step skill with three workflows and a reference library of 19+ documents.

<details>
<summary>Workflows and details</summary>

<br />

**Activates on:** "set up personalization", "A/B test", "personalization not working", "Experiences SDK", "run an experiment", "audience targeting"

**Workflows:**
- **Onboard** — Assess readiness, select SDK, guided installation, content type setup
- **Doctor** — Diagnose broken setups: checks packages, env vars, API connectivity, content state
- **Develop** — Day-to-day companion for personalizing components, running experiments, wiring analytics

**Reference library:** SDK guides, component patterns, SSR/middleware patterns, provider patterns, analytics setup, environment variables, error resolution, and more.

Built with [@contentful/skill-kit](https://github.com/contentful/skill-kit) — a structured state machine with MCP server integration.

</details>

---

## MCP Server Setup

Plugin installs configure MCP connections automatically. If you installed via `npx skills add` or another non-plugin path, set up the MCP servers manually to get the full experience.

### Contentful MCP (CMS operations)

Connects your agent to your Contentful spaces for reading and writing content, content types, and assets.

**Claude Code:**

```
/mcp add-http contentful-mcp https://mcp.contentful.com/mcp
```

**Other platforms** — add to your MCP config:

```json
{
  "mcpServers": {
    "contentful-mcp": {
      "type": "http",
      "url": "https://mcp.contentful.com/mcp"
    }
  }
}
```

- **Documentation:** [contentful.com/developers/docs/tools/mcp-server](https://www.contentful.com/developers/docs/tools/mcp-server/)

### Personalization MCP (structured workflows)

The `contentful-personalization` skill includes a local MCP server that powers its interactive workflows. Point your agent at the skill's run script:

**Claude Code:**

```
/mcp add -- /path/to/skills/contentful-personalization/scripts/run mcp --host claude-code
```

**Other platforms** — add to your MCP config:

```json
{
  "mcpServers": {
    "contentful-personalization": {
      "command": "/path/to/skills/contentful-personalization/scripts/run",
      "args": ["mcp", "--host", "claude-code"]
    }
  }
}
```

> [!NOTE]
> Replace `/path/to/skills/` with the actual path where skills were installed (typically `.agents/skills/` in your project).

---

## Local Plugin Testing (Claude Code)

To test the full plugin locally — including skills, MCP servers, and hooks — without publishing:

```bash
claude --plugin-dir /path/to/contentful/skills
```

This loads everything defined in `.claude-plugin/plugin.json` for that session: skills, the Contentful MCP server, and the personalization MCP server. Use `/reload-plugins` inside the session to pick up changes without restarting.

You can also combine multiple plugin directories:

```bash
claude --plugin-dir ./skills --plugin-dir ./other-plugin
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines. We welcome bug reports, feature requests, and pull requests.

## Help and Support

- Open a [GitHub issue](https://github.com/contentful/skills/issues) for bugs and feature requests
- For security issues, see [SECURITY.md](SECURITY.md)
- Contentful support: [contentful.com/help](https://www.contentful.com/help/getting-started/how-to-get-help/)

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Lp-Francois"><img src="https://avatars.githubusercontent.com/u/32224751?v=4?s=100" width="100px;" alt="François"/><br /><sub><b>François</b></sub></a><br /><a href="https://github.com/contentful/skills/commits?author=Lp-Francois" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TimBeyer"><img src="https://avatars.githubusercontent.com/u/2362075?v=4?s=100" width="100px;" alt="Tim Beyer"/><br /><sub><b>Tim Beyer</b></sub></a><br /><a href="https://github.com/contentful/skills/commits?author=TimBeyer" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

MIT — see [LICENSE](LICENSE) for details.
