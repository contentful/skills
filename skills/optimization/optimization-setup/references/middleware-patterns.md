# Middleware Patterns

Middleware is the most common source of setup failures. Treat matcher and cookie behavior as first-class design decisions.

## Matcher Guidance

- Include all personalized routes.
- Exclude static assets and unrelated routes.
- Start with explicit route groups, then widen only when necessary.

## Cookie and Header Forwarding

- Ensure personalization cookies are available where experience resolution runs.
- Keep forwarding logic consistent between middleware and server-rendering paths.
- Validate behavior for both first-time and returning visitors.

## Edge Runtime Constraints

- Do not use Node-only APIs in edge middleware.
- Prefer web-standard APIs supported by the edge runtime.
- Add fallback behavior for unsupported operations.

## Verification Checklist

1. Middleware executes for intended URLs.
2. Matcher does not capture static assets unnecessarily.
3. Cookie values are present in downstream resolution logic.
4. No runtime errors from unsupported APIs.
