---
name: author-content-bindings
description: >-
  Create or update Contentful Binding Sets: target-scoped content binding configurations
  that map CMS entries or assets to public content properties on Components and
  Experience Templates. Binding Sets are stored as Data Assemblies. Uses the
  current CMA contract, target GraphQL schema, and Experience UI compatibility
  checks. Use when asked to create a Binding Set, author a Data Assembly, wire
  CMS content to a component, map an entry or asset to a template, or configure
  content bindings. Also triggers on "content binding", "data assembly",
  "binding set", "prebinding", and "hydrate a component". Not for building a
  component tree, filling a slot, or choosing the concrete source on an existing
  Experience or Experience Fragment.
license: MIT
argument-hint: "[space id] [component or template]"
allowed-tools: Bash(curl *) mcp__contentful-mcp__* mcp__plugin_contentful_contentful-mcp__* mcp__chrome-devtools__* mcp__plugin_*chrome-devtools*__*
metadata:
  author: contentful
  version: "1.0.0"
---

# Author Content Bindings

Create or update **Binding Sets**: target-scoped content binding configurations
that map CMS data into a Component or Experience Template's public content
properties. Binding Sets are stored as Data Assemblies. They are not an
instance-level choice of a specific entry, and one Data Assembly belongs to one
Component or Experience Template only.

## Scope

| Request | Correct layer |
| --- | --- |
| "Create a Binding Set" or "map a page hero to Hero" | This skill: Binding Set authoring. |
| "Choose the entry for this Experience" | Instance-level binding; it consumes a Binding Set. |
| "Put this Component in a slot" or "build the tree" | Component or template assembly. |

The target tree reads through `$contentProperties/...`. Every Binding Set return key
must therefore be an existing public content-property ID. Do not create return
values that no Component or template reads.

## Required access

This skill is CMA-led by default. Before inspecting or changing a space, obtain
an authorized CMA token for the target space and environment. Prefer `CMA_TOKEN`
or an agent-accessible secret store; do not ask users to paste a token into
chat when a secure channel is available. A token pasted as a last resort should
be revoked after use.

When the user provides a target URL, parse it before opening a browser or
making a request:

```text
https://app.contentful.com/spaces/{spaceId}/environments/{environmentId}/components/{componentId}
https://app.contentful.com/spaces/{spaceId}/environments/{environmentId}/templates/{templateId}
https://app.contentful.com/spaces/{spaceId}/environments/{environmentId}/experience-templates/{templateId}
```

Resolve `components` to the Component CMA endpoint and `templates` or
`experience-templates` to the Experience Template CMA endpoint
(`/experience_templates/{templateId}`). Preserve the original URL for final
handoff. If the target route is not recognized, ask rather than guessing.

Use the original target URL in the final handoff. When the target was resolved
only from IDs, construct the app URL with `/components/{componentId}` for a
Component or `/templates/{templateId}` for an Experience Template.

The URL identifies the target; it does not authorize access. If the user
explicitly asks to author through a logged-in browser session or another
supported authenticated method, use that method instead of CMA while keeping
the same plan-and-approval safeguards. Do not use a browser session to retrieve
a CMA token. Otherwise, if the token is unavailable, ask for secure CMA access
and stop before CMA authoring.

Before each CMA request, require the token without printing it:

```bash
: "${CMA_TOKEN:?CMA_TOKEN must be set by a secret store or environment}"
```

## Workflow

1. **Resolve the target.** Confirm space, environment, target kind, and target
   ID. Fetch the target, its existing Binding Sets,
   content types, and representative source entries. Before using a Content
   Type in a planned parameter, query branch, or reference path, read it
   directly. A `404` can mean it was deleted or is unreadable: omit an
   optional alternative, or block a required mapping.
2. **Fetch the target GraphQL schema.** Immediately before designing mappings,
   fetch `graphql_schema`. It is the source of truth for GraphQL field names,
   concrete versus abstract return types, and valid ordering enums.
   Pair it with Content-Type fields to establish reference topology, allowed
   types, and requiredness. Use Component/Experience Template and content-type
   metadata for user-facing labels, descriptions, and semantics in the Binding
   Plan; keep IDs secondary.
3. **Classify the request.** Map only public `contentProperties`. A slot child
   owns its own Binding Set. Do not map a design property or a private child
   property.
4. **Create a Binding Plan.** Start with a short target line and a readable
   target-property-to-CMS-source table, then show the title, description,
   resolver shape, and every intentional omission. Keep requiredness as
   validation evidence; surface it only when it changes the plan. Get explicit
   approval before any write.
5. **Construct one complete persisted Binding Set body.** Use the current sys-free
   format, an ordered `parameters` array, and the pattern that matches the
   source shape. See [CMA workflow](references/cma-workflow.md) and
   [resolver patterns](references/resolver-patterns.md).
6. **Write, link, and re-read.** Save the Binding Set, re-read it, preserve and
   verify the target's Binding Set links. CMA acceptance alone is not proof
   that the Binding Set is editable.
7. **Verify in the UI when a logged-in session is already available.** Reopen
   the exact Binding Set and confirm it loads and is editable. Otherwise, ask
   the user to check the linked target in their browser and do not claim UI
   editability.
8. **Hand off publication.** Ask the user to review and publish through the
   Component or Experience Template editor. Do not publish a Binding Set
   through a CMA `/published` endpoint.

## Non-negotiable construction rules

| Concern | Required behavior |
| --- | --- |
| CMA body | Send `metadata`, `name`, `description`, ordered `parameters`, `resolvers`, and `return`. Never send top-level `sys` or `sys.dataType`. |
| Parameters | Each newly authored parameter is mandatory: set explicit `required: true`. Do not use a keyed parameter map. |
| Schema | Trace every selected GraphQL path against the current target schema. Use the Content-Type definition for reference topology, allowed types, and requiredness; use the schema for GraphQL type behavior. |
| `$on.type` | Use it at every `UNION` or `INTERFACE` selection boundary, including a one-member union. Use an ordinary selector for a concrete `OBJECT`. |
| Pointers | Keep `_node` and collection envelopes in `$from.source`. Prefer a direct selector path for a single `Link<Entry>` to a concrete `OBJECT`, unless a same-environment UI Binding Set differs; use an inner mapping for a union/interface branch, collection, or transformation. |
| Requiredness | Never map an optional source to a required target without a verified query-level guarantee. |
| Content-Type availability | Directly read every planned parameter type and every allowed type on a selected `Link<Entry>` or `Array<Link<Entry>>`. Treat a `404` as deleted or unreadable; omit it or block the mapping. |
| Collections | Never use `items/0`, `items/1`, or another index to fill individual required nested inputs. Use separate inputs only when independent selection is acceptable; otherwise report a modeling gap. |
| Static root collections | Use the UI-shaped locked `Record` query parameter, with the same ID as its resolver. Bind `limit` and schema-validated `$order` variables to its `Number` and `OrderExpression` fallback fields. This keeps the behavior fixed while matching the editor's persisted format. |
| Target ownership | A Data Assembly belongs to one Component or Experience Template. Never link the same Data Assembly to another target; create a distinct Data Assembly even when the contracts and mappings are identical. |
| UI check | When a logged-in browser session is already available, reopen the exact Binding Set and confirm it is editable. Otherwise, report **CMA-valid; UI editability unverified** and ask the user to check the target in their browser. |

## User-facing language

In a Binding Plan, status update, mapping summary, or error explanation, use a
target property or parameter's display label or title when available; show its
ID only when it disambiguates duplicates, is needed for copy/paste, or the user
asks for technical detail. Describe the editor-visible outcome: the target
property, the CMS source, and the action the user can take. Do not foreground
resolver-pointer mechanics, root transport paths, or GraphQL type inference
unless the user asks for a technical diagnosis. The final review payload can
contain persisted resolver syntax because it is needed to review the Binding
Set itself.

Before approval, lead with concise target context and the mapping table.
Existing Binding Sets only affect the new-versus-update decision, so mention
them only when that changes the plan; do not render a JSON or pseudo-JSON
before/after `dataAssemblies` comparison. Keep `(required)` out of human-facing
property labels, parameter labels, names, descriptions, and mapping summaries.
`required: true` remains in the persisted body and matters in user-facing copy
only when it creates a mapping constraint or error.

## Binding Plan and names

Show the complete plan before writing. For each Binding Set include:

- target Component or Experience Template and public content-property labels;
- parameter labels and allowed Entry or Asset types;
- source fields and mapping evidence; explain requiredness only for an
  actionable mismatch;
- resolver kind and GraphQL shape;
- intentional omissions and any requested API-only exception;
- a user-facing Binding Set name and description.

The editor already shows the owning Component or template. Do not repeat that
name in the Binding Set name. Emphasize the distinct author-visible
**functionality** or outcome; use the description to explain what it does and
how it gets its data. Naming one source type is useful for a single-input
Binding Set, but when several inputs or source types are involved, describe
their behavior together rather than listing technical contracts.

```text
Avoid: CTA Section — Title and AI Action Templates
Prefer: Recent AI actions
        Uses a selected title and displays the three most recently published AI actions.
```

## Reference guide

| Need | Read |
| --- | --- |
| Current endpoints, token handling, persisted body, link lifecycle, and UI verification | [CMA workflow](references/cma-workflow.md) |
| Complete entity, collection, and Asset examples | [Resolver patterns](references/resolver-patterns.md) |
| Complete RichText, polymorphic, and nested-contract examples | [Advanced resolver patterns](references/advanced-patterns.md) |
| Schema type tracing, canonical pointers, requiredness, depth, and API-only exceptions | [UI-compatible mappings](references/ui-compatible-mappings.md) |

## Final report

After every write, re-read the saved Binding Set and render a review projection. Use a
documented native collapsible mechanism when the active harness provides one;
in Codex, use HTML `<details>`. Use the harness's documented expandable form
when known, or fall back to a normal Markdown heading with a `jsonc` code block
when none is available. Do not invent a collapsible syntax. In every form,
include the full `metadata`, `name`, `description`, `parameters`, `resolvers`,
and `return`; omit only server-assigned `sys` with a short comment that it is
not relevant for review. Follow with target-link verification and, when an
authenticated browser session was already available, the UI-check outcome.
Without that session, report UI editability as unverified, ask the user to
check that the Binding Set renders and is meaningful, and end with the direct
target URL as a clickable Markdown link. Never call it UI-compatible without
that check.

For general Contentful concepts or API selection, use the `contentful-guide`
skill. For content-model migrations, use the `contentful-migration` skill.
