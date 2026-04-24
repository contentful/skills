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

### Personalization

| Skill | Triggers | Status |
|-------|----------|--------|
| **contentful-personalization-readiness** | "check optimization readiness", "audit personalization setup" | Coming soon |
| **contentful-personalization-setup** | "set up optimization", "configure personalization" | Coming soon |
| **contentful-personalization-dev** | "build personalization component", "add analytics hook" | Coming soon |
| **contentful-personalization-doctor** | "diagnose optimization issues", "troubleshoot personalization" | Coming soon |

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
npx skills add contentful/skills --skill contentful-personalization-readiness
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

This project is licensed under [MIT](LICENSE).

Third-party notices and license automation docs:

- [NOTICE](NOTICE)
- [AUTOMATION-FOR-LICENSES.md](AUTOMATION-FOR-LICENSES.md)
