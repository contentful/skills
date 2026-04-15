# Common Errors and Fixes

## Provider Not Applied Globally

Symptoms:

- Some pages personalize, others never do.

Fix:

- Move provider higher in the app tree so all target components are wrapped.

## Incorrect Middleware Matcher

Symptoms:

- Personalization fails only on some routes.

Fix:

- Update matcher to include all personalized routes and exclude irrelevant paths.

## Missing Cookie Forwarding

Symptoms:

- Experience resolution behaves as if every visitor is new.

Fix:

- Forward required personalization cookies/headers in middleware and server paths.

## Hydration Mismatch

Symptoms:

- Browser warnings and visible variant flicker.

Fix:

- Align server and client initial render behavior and data contracts.

## Node APIs in Edge Code

Symptoms:

- Edge runtime exceptions during middleware execution.

Fix:

- Replace Node-only APIs with edge-compatible web APIs.
