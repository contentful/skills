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

## Entry Has Unpublished Changes (nt_experiences not in CDA)

Symptoms:

- Personalization is set up correctly in code.
- Experiences are wired to an entry in Contentful.
- Variants never show; the baseline always renders.
- Preview mode may work correctly while production does not.

Root cause:

- When an experience is attached to a baseline entry via the `nt_experiences` field, the entry must be re-published for the CDA (Content Delivery API) to include the updated data.
- If the entry is saved but not published, the CPA (Content Preview API) has the experience data but the CDA does not.
- The CDA only returns published content. Code using `.withoutUnresolvableLinks` silently strips unpublished references.

Fix:

- Open the baseline entry in Contentful.
- Check if it shows "Changed" status (indicating unpublished changes).
- Publish the entry.
- Also verify that the referenced experience entries and variant entries are published.
- Publishing order: publish variants first, then experiences, then the baseline entry.
- Use the doctor's content inspection (CDA vs CPA comparison) to verify.

## Experience or Variant Entries Not Published

Symptoms:

- The `nt_experiences` field is set on the baseline entry and published.
- But the CDA response shows `nt_experiences` as unresolved links.
- Or experiences resolve but `nt_variants` within them are unresolved links.
- `ExperienceMapper.isExperienceEntry()` filters out the unresolved entries, so personalization silently does nothing.

Root cause:

- The `nt_experience` entries referenced by `nt_experiences` are in draft state.
- Or the variant entries referenced by `nt_variants` within the experience are in draft state.
- The CDA only returns published content; unpublished references become unresolved links or are removed by `.withoutUnresolvableLinks`.

Fix:

- Publish all `nt_experience` entries referenced by the baseline.
- Publish all variant entries referenced by those experiences.
- Publishing order matters: publish variants first, then experiences, then the baseline entry.
- After publishing, verify by fetching the entry from the CDA with `include: 3` or higher and checking that `nt_experiences` contains fully resolved entries with `fields` objects.
