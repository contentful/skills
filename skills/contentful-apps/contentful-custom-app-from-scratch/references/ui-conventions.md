# UI Conventions

Use this reference when building or reviewing Contentful-facing UI in a custom
app. The goal is an app that feels native to the Contentful web app rather than
a separate mini-product.

## Components and Icons

- Use real Forma 36 components (`@contentful/f36-components`) instead of custom
  recreations. Custom look-alikes drift from the design system, miss
  accessibility behavior, and do not receive upstream fixes.
- Use Forma 36 icons (`@contentful/f36-icons`) and avoid mixing icon systems
  unless the user has a deliberate reason.
- Prefer Forma 36 interaction patterns such as `Select`, `Autocomplete`,
  `Multiselect`, `Modal`, and `FormControl` over bespoke controls.
- Keep a clear button hierarchy: one primary action per view, secondary and
  transparent variants for the rest.
- Use Forma 36 spacing and color tokens instead of hardcoded values.
- If the installed Forma 36 version limits an ideal solution, say so and choose
  the closest native-feeling fallback.

## Copy

- Use sentence case for headings, labels, buttons, and helper text. Keep the
  official capitalization of product and app names.
- Keep helper text short and place it directly under the control it explains.
- Write error messages that say what went wrong and what the user can do next.

## Configuration Screens

- Use a single centered column, roughly 900px wide, with left-aligned headings,
  copy, and controls.
- Start with a page heading and a short paragraph explaining what the app does
  and what setup is needed.
- Structure the page as stacked sections (for example: configure access, assign
  content types, set up rules). Give each section a heading and a one-line
  instruction underneath.
- Let section spacing do most of the visual grouping. Avoid nesting cards inside
  cards unless a subsection truly needs its own container.
- Mark required fields and validate them before installation completes.
- For content type assignment, prefer a multi-select dropdown with search,
  checkbox rows, an optional select-all, a selected count, and selected items
  shown as pills. When fields must also be chosen, group fields under their
  content type rather than inventing a new chooser.
- Present repeated configuration (rules, mappings) as aligned rows or grouped
  accordions so open, closed, and mixed states share the same left edge.

## Runtime Locations

- Entry sidebar: keep panels compact and scannable, with left-aligned metadata
  and restrained helper text.
- Dialogs: keep layout compact, show selection counts, and do not let secondary
  elements such as chip trays dominate the dialog height.
- When a configuration screen and an entry-level dialog solve the same task,
  keep their layout and control choices consistent so they feel like one
  component family.
- Show loading, empty, error, and permission states wherever they affect the
  main workflow.
- Explain destructive or irreversible actions before they run.

## Accessibility

- Keep primary flows keyboard-usable.
- Give every control a visible or accessible label.
- Do not rely on color or icon-only affordances to convey meaning; pair icons
  with text or accessible labels.
- Surface status changes (saving, saved, failed) as explicit text, not only
  visual cues.

## Review Before Handoff

Compare the result against Forma 36 documentation and comparable public apps in
`https://github.com/contentful/apps`. Fix misaligned spacing, inconsistent
control widths, and non-native patterns before calling the UI done.

Useful docs:

- Forma 36: `https://f36.contentful.com/`
