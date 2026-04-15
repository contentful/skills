# Provider Patterns

Use these patterns to avoid scope and hydration problems.

## Next.js App Router

Preferred approach:

1. Keep root layout server-first where possible.
2. Put client-only provider initialization in a dedicated client wrapper component.
3. Wrap the full app subtree that needs personalization.

Checklist:

- Provider is high enough to cover all personalizable components.
- Server/client boundaries are explicit.
- Initial render is deterministic between server and client.

## Next.js Pages Router

Preferred approach:

1. Initialize provider in `pages/_app.tsx`.
2. Keep provider config stable across navigation.
3. Ensure server-rendered defaults and client hydration are aligned.

Checklist:

- `_app.tsx` wraps all page components.
- Provider receives required environment values.
- No per-page provider duplication.

## Hydration Safety Rules

- Do not render personalized variant on server and baseline on client for the same first paint.
- Avoid non-deterministic branching during initial render.
- Keep initial data contracts consistent for baseline and variant props.
