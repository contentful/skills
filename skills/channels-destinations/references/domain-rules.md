# Domain rules and setup checklist

Use for Channel properties, node types, and path behavior; verify edge cases against current API docs.

## Channel contract

- Channels are organization-wide; Destinations are environment-scoped.
- Define only properties the consuming app needs, with stable IDs and supported types. Channel properties are supplied per Destination; node properties are per node.
- Use at most one `Path` node property, only when path routing is part of the contract.
- Assess all linked Destinations before changing a published Channel contract.

## Node variants and structure

- **Experience:** serves its assigned Experience at the node route; publish the Experience before the node.
- **Folder:** groups descendants; does not serve an Experience.
- **Redirect:** points to a target. Check target references and inbound redirects before changing/removing it. The app resolves redirects and chooses HTTP status.
- Publish parents before children. A special empty-path/home node requires Path routing; verify current constraints before creating it and never add one by default.
- Nodes are not site navigation; sibling order is not configurable.

## Paths and advanced routing

- For paths, use the current API schema's representation and validation. Current documentation describes each node path as a local segment; avoid adding a leading slash unless the schema explicitly requires it. Empty string is reserved for the special empty-path node.
- Validate path uniqueness and hierarchy across the entire tree before writes. Never flatten or rewrite existing paths without checking descendants, redirects, and delivery impact.
- Dynamic route syntax, parameter count, wildcard/catch-all support, matching rules, and Experience parameter mapping are version-sensitive. Verify current published documentation and the target Experience contract; do not promise unsupported syntax based on an old RFC or prototype.
- Localization must be planned for both the Destination map and the Experience/application integration. Do not assume a Destination automatically selects or synchronizes localized Experiences.

## Permission and confirmation checks

- Channel access is organization-scoped; Destination/node access also depends on the target space. Use least privilege and actual API authorization; do not infer access from role names.
- Follow `SKILL.md` confirmation and hard lifecycle guardrails. Before destructive work, identify affected descendants, Experiences, inbound redirects, dependent Destinations, and publish state; see [API operations and lifecycle](api-workflows.md) for ordering.

