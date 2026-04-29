# Contentful Agent Skills

Agent Skills for the Contentful platform — reusable instructions, scripts, and references that extend AI coding agents with Contentful-specific capabilities for personalization, optimization, and analytics.

Works with Claude Code, Cursor, GitHub Copilot, OpenAI Codex, Gemini CLI, and [30+ other agent platforms](https://agentskills.io).

## Install

```bash
npx skills add contentful/skills
```

## Available Skills

### Contentful

| Skill | Triggers | Status |
|-------|----------|--------|
| **contentful-guide** | "Contentful 101", "which Contentful API should I use", "which skill should I use" | Coming soon |
| **contentful-nextjs** | "add Contentful to Next.js", "Next.js Contentful setup", "Draft Mode Contentful" | Coming soon |
| **contentful-migration** | "write a migration", "create content type", "schema migration" | Coming soon |
| **contentful-personalization** | "set up personalization", "optimization readiness", "Ninetailed", "A/B test", "personalization not working", "experience API" | Coming soon |

## Platform Install Commands

```bash
# All platforms (auto-detects)
npx skills add contentful/skills

# Cursor (Plugin Marketplace)
/plugin marketplace add contentful/skills

# Cursor / Copilot / Codex
# Auto-discovers from .agents/skills/ when added to project

# Gemini CLI
gemini skills install contentful/skills
```

### Install a single skill

```bash
npx skills add contentful/skills --skill contentful-personalization
```

## Contentful MCP Server

If you want to interact with Contentful more easily through AI agents, use the Contentful MCP server:

- Docs: `https://www.contentful.com/developers/docs/tools/mcp-server/`
- It provides a simpler conversational interface to work with Contentful content and models.

## Contributing

See [AGENTS.md](AGENTS.md) & [CONTRIBUTING.md](CONTRIBUTING.md) for project conventions. Use the internal `skill-authoring` skill for guidance on creating new skills.

## Help and Support

- Open a GitHub issue for bugs and feature requests.
- For security issues, follow [SECURITY.md](SECURITY.md).
- Contentful support resources: https://www.contentful.com/help/getting-started/how-to-get-help/

## License

This project is licensed under [MIT](LICENSE).

Third-party notices and license automation docs:

- [NOTICE](NOTICE)
- [AUTOMATION-FOR-LICENSES.md](AUTOMATION-FOR-LICENSES.md)
