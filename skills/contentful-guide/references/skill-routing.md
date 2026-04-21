# Skill Routing

Use these intent rules to choose the right skill.

## Stay in `contentful-guide`

Stay here when the user asks:

- "What is X in Contentful?"
- "Which API should I use?"
- "Where are the right docs for this task?"
- "What is the difference between space/environment/content type?"
- "How do environment aliases work?"
- "How do I use Contentful MCP?"
- "Is there an MCP server for Contentful?"

## Route to `the contentful-nextjs skill`

Route when the user asks to:

- add Contentful to an existing Next.js app,
- fetch content in App Router or Pages Router,
- set up preview with Next.js Draft Mode,
- configure Next.js env vars and Contentful client setup.
- implement alias-aware environment configuration in Next.js.

## Route to personalization skills

Route when the user asks about:

- personalization, experimentation, or optimization setup,
- Ninetailed/optimization SDK workflows,
- troubleshooting optimization behavior.

Use the appropriate contentful-personalization skill for setup, readiness, development, or diagnostics.

## Notes

- If user intent mixes concepts and implementation, answer conceptually in 1-3 bullets, then route.
- If framework is not Next.js, do not force Next.js instructions; route to platform docs instead.
- For MCP questions, first share the MCP docs path, then route to implementation skills only if app code changes are requested.
