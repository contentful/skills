# Contentful Agent Skills

Agent Skills for the Contentful platform — reusable instructions, scripts, and references that extend AI coding agents with Contentful-specific capabilities for personalization, optimization, and analytics.

Works with Claude Code, Cursor, GitHub Copilot, OpenAI Codex, Gemini CLI, and [30+ other agent platforms](https://agentskills.io).

## Install

```bash
npx skills add contentful/skills
```

## Contentful MCP Server

If you want to interact with Contentful more easily through AI agents, use the Contentful MCP server:

- Docs: `https://www.contentful.com/developers/docs/tools/mcp-server/`
- It provides a simpler conversational interface to work with Contentful content and models.

## Available Skills

### Contentful

| Skill | Triggers | Status |
|-------|----------|--------|
| **contentful-guide** | "Contentful 101", "which Contentful API should I use", "which skill should I use" | Coming soon |
| **contentful-nextjs** | "add Contentful to Next.js", "Next.js Contentful setup", "Draft Mode Contentful" | Coming soon |
| **contentful-migration** | "write a migration", "create content type", "schema migration" | Coming soon |

### Optimization

| Skill | Triggers | Status |
|-------|----------|--------|
| **optimization-readiness** | "check optimization readiness", "audit personalization setup" | Coming soon |
| **optimization-setup** | "set up optimization", "configure personalization" | Coming soon |
| **optimization-dev** | "build personalization component", "add analytics hook" | Coming soon |
| **optimization-doctor** | "diagnose optimization issues", "troubleshoot personalization" | Coming soon |

## Platform Install Commands

```bash
# All platforms (auto-detects)
npx skills add contentful/skills

# Claude Code
claude /install-skill contentful/skills

# Cursor / Copilot / Codex
# Auto-discovers from .agents/skills/ when added to project

# Gemini CLI
gemini skills install contentful/skills
```

### Install a single skill

```bash
npx skills add contentful/skills --skill optimization-readiness
```

## Contributing

See [AGENTS.md](AGENTS.md) & [CONTRIBUTING.md](CONTRIBUTING.md) for project conventions. Use the internal `skill-authoring` skill for guidance on creating new skills.

## License

[MIT](LICENSE)
