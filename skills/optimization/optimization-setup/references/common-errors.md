# Common Errors and Fixes

## Content Types Were Never Extended

Symptoms:

- Editors cannot attach experiences to entries.
- The baseline entry has no `nt_experiences` field.

Fix:

- Install and configure the Contentful Personalization app correctly.
- Extend the content types that should be personalizable.

## Wrong Package for Analytics

Symptoms:

- The setup mentions analytics, but no component insights appear.
- The project installed `@ninetailed/experience.js-plugin-analytics` expecting built-in experiment measurement.

Fix:

- Use `@ninetailed/experience.js-plugin-insights` for built-in measurement and component insights.

## Provider Not Applied Globally

Symptoms:

- Some pages personalize, others never do.

Fix:

- Move provider higher in the app tree so all target components are wrapped.

## Include Depth Too Shallow

Symptoms:

- Experiences appear to be missing.
- Variants do not resolve even though the entry is linked correctly.

Fix:

- Increase Contentful include depth so `nt_experience` and variant entries resolve.
- For nested pages, deep includes such as `10` are common.

## Incorrect Middleware Matcher

Symptoms:

- Personalization fails only on some routes.

Fix:

- Update matcher to include all personalized routes and exclude irrelevant paths.

## Duplicate Page Events

Symptoms:

- Analytics counts look too high.
- Page views fire twice per navigation.

Fix:

- In Pages Router, do not add manual navigation `page()` calls on top of the provider integration.
- In SSR or edge hybrid setups, use preflight on the server side.

## Missing Cookie Forwarding

Symptoms:

- Experience resolution behaves as if every visitor is new.

Fix:

- Forward required personalization cookies/headers in middleware and server paths.

## Cookie Set from the Wrong ID

Symptoms:

- Visitors appear to get new anonymous profiles unexpectedly.
- Redirect chains or profile drift appear after merges or relocations.

Fix:

- Always set `ntaid` from `response.data.profile.id`, not from the request cookie.

## Hydration Mismatch

Symptoms:

- Browser warnings and visible variant flicker.

Fix:

- Align server and client initial render behavior and data contracts.

## Preview Enabled in Production

Symptoms:

- Preview UI appears in live environments.
- Preview bundle weight and CMS-only behavior leak into production.

Fix:

- Gate preview plugin setup behind preview or development checks.
- Only instantiate preview when the required audience and experience data exists.

## Missing Geo Context

Symptoms:

- Geo audiences never match on server-rendered or edge-rendered requests.

Fix:

- Include `countryCode` from the edge platform in the server-side page event when available.

## Node APIs in Edge Code

Symptoms:

- Edge runtime exceptions during middleware execution.

Fix:

- Replace Node-only APIs with edge-compatible web APIs.
