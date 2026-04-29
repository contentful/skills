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
[![skills](https://img.shields.io/badge/4_skills-0286FF?style=flat&label=)](skills/)
[![platforms](https://img.shields.io/badge/35%2B_platforms-0286FF?style=flat&label=)](https://agentskills.io)

</div>

<br />

AI coding agents write great code but know nothing about your content model, your SDK patterns, or which of Contentful's five APIs to reach for. **Contentful Skills** fixes that — curated instructions, reference docs, and structured workflows that produce correct Contentful integrations on the first try.

## Quickstart — Claude Code

Two commands. You get four skills plus live MCP connections to your Contentful spaces.

```
/plugin marketplace add contentful/skills
/plugin install contentful-skills@contentful-skills
```

Run `/reload-plugins` to activate. This registers two MCP servers:
- **contentful-mcp** — connection to `mcp.contentful.com` for CMS operations
- **contentful-personalization** — local MCP for structured personalization workflows

---

## What's inside

| Skill | What it does |
|:------|:-------------|
| **[contentful-guide](#contentful-guide)** | Explains core concepts and routes you to the right skill, API, or doc. Start here. |
| **[contentful-nextjs](#contentful-nextjs)** | Integrates Contentful into a Next.js project — SDK setup, content fetching, Draft Mode previews. |
| **[contentful-migration](#contentful-migration)** | Writes and runs content model migration scripts — fields, validations, transforms, editor interfaces. |
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

Available: `contentful-guide`, `contentful-nextjs`, `contentful-migration`, `contentful-personalization`

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

## Contentful MCP Server

These skills work best alongside the [Contentful MCP server](https://www.contentful.com/developers/docs/tools/mcp-server/), which gives your agent conversational access to your Contentful spaces. Plugin installs configure the MCP connection automatically. For skills-only installs, set up the MCP server separately:

- **Documentation:** [contentful.com/developers/docs/tools/mcp-server](https://www.contentful.com/developers/docs/tools/mcp-server/)
- **Endpoint:** `https://mcp.contentful.com/mcp`

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines. We welcome bug reports, feature requests, and pull requests.

## Help and Support

- Open a [GitHub issue](https://github.com/contentful/skills/issues) for bugs and feature requests
- For security issues, see [SECURITY.md](SECURITY.md)
- Contentful support: [contentful.com/help](https://www.contentful.com/help/getting-started/how-to-get-help/)

## License

MIT — see [LICENSE](LICENSE) for details.
