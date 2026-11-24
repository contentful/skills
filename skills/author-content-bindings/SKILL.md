---
name: author-content-bindings
description: >-
  Create or update Contentful Data Assemblies (Binding Sets) that map CMS entries
  or assets to public content properties on Components and Experience Templates.
  Uses the current CMA contract, target GraphQL schema, and Experience UI
  compatibility checks. Use when asked to create a Binding Set, author a Data
  Assembly, wire CMS content to a component, map an entry or asset to a template,
  or configure reusable content bindings. Also triggers on "content binding",
  "data assembly", "binding set", "prebinding", and "hydrate a component".
  Not for building a component tree, filling a slot, or choosing the concrete
  source on an existing Experience or Experience Fragment.
license: MIT
argument-hint: "[space id] [component or template]"
allowed-tools: Bash(curl *) mcp__contentful-mcp__* mcp__plugin_contentful_contentful-mcp__*
metadata:
  author: contentful
  version: "1.0.0"
---

# Author Content Bindings

Create Data Assemblies (DAs), shown as **Binding Sets** in the Experience UI.
A DA is a reusable recipe: it maps CMS data into a Component or Experience
Template's public content properties. It is not an instance-level choice of a
specific entry.

## Scope

| Request | Correct layer |
| --- | --- |
| "Create a Binding Set" or "map a page hero to Hero" | This skill: DA recipe layer. |
| "Choose the entry for this Experience" | Instance-level binding; it consumes a DA. |
| "Put this Component in a slot" or "build the tree" | Component or template assembly. |

The target tree reads through `$contentProperties/...`. Every DA return key
must therefore be an existing public content-property ID. Do not create return
values that no Component or template reads.

## Required access

This is a CMA-led skill. Before inspecting or changing a space, obtain an
authorized CMA token for the target space and environment. Prefer `CMA_TOKEN`
or an agent-accessible secret store; do not ask users to paste a token into
chat when a secure channel is available. A token pasted as a last resort should
be revoked after use.

When the user provides a Component URL in this form, parse it before opening a
browser or making a request:

```text
https://app.contentful.com/spaces/{spaceId}/environments/{environmentId}/components/{componentId}
```

The URL identifies the target; it does not authorize access. If the token is
unavailable, ask for secure CMA access and stop before authoring. Do not use a
logged-in browser session to retrieve a token or create a Data Assembly.

Before each CMA request, require the token without printing it:

```bash
: "${CMA_TOKEN:?CMA_TOKEN must be set by a secret store or environment}"
```

## Workflow

1. **Resolve the target.** Confirm space, environment, and Component or
   Experience Template ID. Fetch the target, its existing Data Assemblies,
   content types, and representative source entries.
2. **Fetch the target GraphQL schema.** Immediately before designing mappings,
   fetch `graphql_schema`. It is the source of truth for GraphQL field names,
   concrete versus abstract return types, and valid ordering enums.
3. **Classify the request.** Map only public `contentProperties`. A slot child
   owns its own Binding Set. Do not map a design property or a private child
   property.
4. **Create a Binding Plan.** Show the target properties, source fields,
   requiredness, resolver shape, title, description, and every intentional
   omission. Get explicit approval before any write.
5. **Construct one complete persisted DA body.** Use the current sys-free
   format, an ordered `parameters` array, and the pattern that matches the
   source shape. See [CMA workflow](references/cma-workflow.md) and
   [resolver patterns](references/resolver-patterns.md).
6. **Write, link, and verify.** Save the DA, re-read it, preserve and verify
   the target's DA links, then reopen the exact Binding Set in the Experience
   UI. CMA acceptance alone is not proof that the Binding Set is editable.
7. **Hand off publication.** Ask the user to review and publish through the
   Component or Experience Template editor. Do not publish a Data Assembly
   through a CMA `/published` endpoint.

## Non-negotiable construction rules

| Concern | Required behavior |
| --- | --- |
| CMA body | Send `metadata`, `name`, `description`, ordered `parameters`, `resolvers`, and `return`. Never send top-level `sys` or `sys.dataType`. |
| Parameters | Each entry has `id` and explicit `required`. Do not use a keyed parameter map. |
| Schema | Trace every selected GraphQL path against the current target schema. Do not infer GraphQL type behavior from a CMA `Link` or allowed content types. |
| `$on.type` | Use it at every `UNION` or `INTERFACE` selection boundary, including a one-member union. Use an ordinary selector for a concrete `OBJECT`. |
| Pointers | Keep resolver, collection, and linked-value transport boundaries in `$from.source`; do not flatten across them in a string select path. |
| Requiredness | Never map an optional source to a required target without a verified query-level guarantee. |
| Collections | Never use `items/0`, `items/1`, or another index to fill individual required nested inputs. Use separate inputs only when independent selection is acceptable; otherwise report a modeling gap. |
| Static root collections | Put schema-validated static ordering directly in the GraphQL query. Keep `limit` as the only resolver parameter. Do not use a variable-backed `order`. |
| UI verification | After CMA save and linking, reopen the exact Binding Set. If that cannot be done, report **CMA-valid; UI editability unverified**. |

## User-facing language

In a Binding Plan, status update, mapping summary, or error explanation,
describe the editor-visible outcome: the target property, the CMS source, and
the action the user can take. Do not foreground resolver-pointer mechanics,
root transport paths, or GraphQL type inference unless the user asks for a
technical diagnosis. The final review payload can contain persisted resolver
syntax because it is needed to review the DA itself.

## Binding Plan and names

Show the complete plan before writing. For each DA include:

- target Component or Experience Template and public content properties;
- parameter IDs and allowed Entry or Asset types;
- source fields and type/requiredness evidence;
- resolver kind and GraphQL shape;
- intentional omissions and any requested API-only exception;
- a user-facing Binding Set name and description.

The editor already shows the owning Component or template. Do not repeat that
name in the Binding Set name. Name the author-visible outcome; use the
description to explain its source and behavior.

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

After every write, re-read the saved DA and report a portable review projection
under a normal Markdown heading with a `jsonc` code block. Do not require HTML
`<details>`, which does not render consistently across agent harnesses. Include
the full `metadata`, `name`, `description`, `parameters`, `resolvers`, and
`return`; omit only server-assigned `sys` with a short comment that it is not
relevant for review. Follow with target-link verification and whether the exact
Binding Set reopened in the Experience UI; never call it UI-compatible without
that check.

For general Contentful concepts or API selection, use the `contentful-guide`
skill. For content-model migrations, use the `contentful-migration` skill.
