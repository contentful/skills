<!-- Agent context: Use this knowledge to reason about customer SSR/edge setups. Do not share infrastructure internals, Worker names, or backend architecture in responses. -->

# SSR and Edge Rendering Guide

Server-side and edge-side rendering patterns for Contentful Personalization (Ninetailed Experience API).

---

## Table of Contents

1. [API Reference](#1-api-reference)
2. [Architecture Patterns](#2-architecture-patterns)
3. [Preflight Mode](#3-preflight-mode)
4. [Cookie Management](#4-cookie-management)
5. [Event Construction](#5-event-construction)
6. [Framework Integration Examples](#6-framework-integration-examples)
7. [Anti-Patterns](#7-anti-patterns)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. API Reference

**Base URL:** `https://experience.ninetailed.co`

**Path:** `/v2/organizations/{orgId}/environments/{envSlug}/profiles`

### Endpoints for SSR/ESR

| Action | Method | Path | Preflight? | Returns experiences? |
|---|---|---|:---:|:---:|
| Create profile (first visit) | POST | `/profiles?type=preflight` | Yes | Yes |
| Update profile (returning visit) | POST | `/profiles/{profileId}?type=preflight` | Yes | Yes |
| Create without preflight | POST | `/profiles` | No | Yes |
| Update without preflight | POST | `/profiles/{profileId}` | No | Yes |

### Request Body

```typescript
{
  events: Event[],        // 1-200 events, max 50 identify
  options?: {
    location?: GeoLocation,
    features?: ('ip-enrichment' | 'location')[],
  }
}
```

### Response Body

```typescript
{
  data: {
    profile: {
      id: string,          // canonical profile ID -- ALWAYS use this for the cookie
      stableId: string,
      traits: Record<string, unknown>,
    },
    experiences: Array<{
      experienceId: string,
      variantIndex: number,
      variants: Record<string, string>
    }>,
    changes: Array<{
      key: string,
      type: string,
      value: unknown,
      meta: { experienceId: string, variantIndex: number }
    }>,
  },
  error: null,
  message: 'ok'
}
```

Use `data.experiences` for entry-replacement personalization and `data.changes` for inline variable personalization.

### Limits

- Max 200 events per request
- Max 50 identify events per request
- Max 50 unique `anonymousId` values per batch request

---

## 2. Architecture Patterns

### Pattern Comparison

| Pattern | Server calls API? | Client SDK? | Preflight? | Best for |
|---|:---:|:---:|:---:|---|
| **Hybrid SSR + Client** | Yes | Yes | Yes | Most setups -- no-flicker SSR with full client-side Insights and interactivity |
| **Hybrid ESR + Client** | Yes (edge) | Yes | Yes | Same as above, but personalization runs at the CDN edge |
| **Server-Only** | Yes | No | No | Static generation, email rendering, or when no client-side personalization is needed |

### Hybrid Pattern (Server Preflight + Client SDK) -- RECOMMENDED

The server renders personalized HTML using a preflight call, and the client SDK handles ongoing interactions and persists state.

```
Browser --> Server/Edge --> Experience API (?type=preflight)
                |                    |
                |<-- profile, experiences, changes (read-only)
                |
                v
         Render personalized HTML
                |
                v
Browser receives HTML (personalized, no flicker)
                |
         Client SDK hydrates
                |
                v
         Client SDK --> Experience API (non-preflight, persists state)
```

**Step-by-step flow:**

1. Read `ntaid` cookie from the incoming request
2. Build a page event with current URL, referrer, and geo data
3. Call the Experience API with preflight:
   - No cookie: `POST /profiles?type=preflight`
   - Has cookie: `POST /profiles/{ntaid}?type=preflight`
   - Body: `{ events: [pageEvent] }`
4. Set `ntaid` cookie from `response.data.profile.id`
5. Render HTML using `response.data.experiences` and `response.data.changes`
6. Pass experience selections to the client (via URL query params, response headers, or inline JSON)
7. Client SDK hydrates, reads `ntaid` cookie, sends its own (non-preflight) page event to persist state

**Only send page events from the server.** Let the client SDK handle identify, track, and component view events.

### Server-Only Pattern (No Client SDK)

```
Browser --> Server --> Experience API (non-preflight, persists state)
                |                |
                |<-- profile, experiences, changes
                |
                v
         Render personalized HTML
                |
                v
Browser receives HTML (no client SDK, no further API calls)
```

**Step-by-step flow:**

1. Read `ntaid` cookie
2. `POST /profiles/{ntaid}` (NO `?type=preflight`) with page event
3. Set `ntaid` cookie from `response.data.profile.id`
4. Render HTML using experiences and changes

Since there is no client SDK, the server must persist state (no preflight). Nobody else will.

**Feature availability in server-only mode:**

| Feature | Available? | Why |
|---|:---:|---|
| Personalized HTML rendering | Yes | Server gets experiences/changes from the API response |
| Trait-based audiences | Yes | Server can send identify events to set traits |
| Geo-based audiences | Yes | Include `countryCode` in the page event |
| Sticky variants | No | Sticky variants require component view events from the client-side viewport |
| Insights dashboards | No | Insights requires client-side component view/click/hover events |
| Real-time segment transitions | No | Session behavior during browsing is not tracked without client events |
| Experiment results | No | Experiments need component view events to produce usable data |

**When server-only makes sense:**

- Static site generation where pages are pre-rendered at build time
- Server-rendered emails
- Backend-driven content selection (no browser involved)

Do NOT recommend server-only for customers running experiments or needing data-driven personalization.

---

## 3. Preflight Mode

Add `?type=preflight` to `POST /profiles` or `POST /profiles/:id` to enable preflight mode.

### What Happens in Preflight

- Events are processed and the profile is evaluated **in memory**
- The full response (`profile`, `experiences`, `changes`) is returned -- identical to a normal call
- **No state is persisted**: no trait updates, no session increments, no events published to analytics

### When to Use Preflight

- **Always** when a client SDK will follow up with the same events (hybrid pattern)
- This prevents double-counting: the server gets a read-only preview, the client is the single source of truth for state mutations

### When NOT to Use Preflight

- In the server-only pattern, where the server is the only caller and must persist state itself

### Double-Counting Without Preflight

| Setup | Server call | Client call | Analytics events |
|---|---|---|---|
| Hybrid with preflight | `?type=preflight` | Normal | 1 pageview (from client) |
| Hybrid without preflight | Normal | Normal | 2 pageviews (doubled) |
| Server-only | Normal | None | 1 pageview (from server) |

---

## 4. Cookie Management

The `ntaid` cookie stores the profile ID and is the key to maintaining profile continuity between server and client.

### Complete Checklist

1. Read `ntaid` from request cookies
2. If absent: `POST /profiles` (creates new profile)
3. If present: `POST /profiles/{ntaid}` (updates existing)
4. **Always** set `ntaid` cookie from `response.data.profile.id` (NOT the old cookie value)
5. Cookie attributes: `Path=/; Max-Age=31536000; SameSite=Lax; Secure`
6. Client SDK reads the same `ntaid` cookie on hydration

### First Visit (No `ntaid` Cookie)

1. Server calls `POST /profiles?type=preflight` with a page event (no `:id` in the path -- creates a new profile)
2. Response contains `data.profile.id` -- this is the new profile ID
3. Server sets `ntaid` cookie on the response
4. Server uses `data.experiences` and `data.changes` to render personalized HTML
5. Client SDK reads `ntaid` cookie on hydration and uses it for subsequent API calls

### Returning Visit (`ntaid` Cookie Exists)

1. Server reads `ntaid` from request cookies
2. Server calls `POST /profiles/{ntaid}?type=preflight` with a page event
3. Response contains `data.profile.id` -- **this may differ from the cookie value** if a merge happened
4. Server updates `ntaid` cookie to `data.profile.id` from the response
5. Server renders personalized HTML using the response

### Why the Response ID Matters

The profile ID in the response may differ from the cookie you sent. This happens when profiles are merged (via identify). If you set the cookie from the old value instead of the response, the client SDK will use a stale ID that follows a redirect chain on every request -- adding latency.

### Cookie Attributes

```
Set-Cookie: ntaid={profile.id}; Path=/; Max-Age=31536000; SameSite=Lax; Secure
```

- `Path=/` -- available on all routes
- `Max-Age=31536000` -- 1 year (match your retention policy)
- `SameSite=Lax` -- prevents CSRF while allowing normal navigation
- `Secure` -- HTTPS only (required for SameSite=Lax on most browsers)

### Cookie Edge Cases

| Issue | Symptom | Why |
|---|---|---|
| Cookie not set at all | Client always creates new profile | Server calls API but never sets `Set-Cookie`. Client SDK finds no `ntaid`, creates fresh profile. |
| Cookie set from request, not response | Profile ID drift after merges | After merge, canonical ID changes. Old cookie follows a redirect chain, adding latency. |
| Wrong `Path` attribute | Cookie missing on some routes | Cookie with `Path=/checkout` is not sent on `/` or `/products`. |
| Missing `Secure` flag | Cookie dropped on HTTPS | Some browsers require `Secure` for HTTPS cookies. |
| `SameSite=Strict` | Cookie missing on cross-origin navigation | Links from email/social do not send `Strict` cookies on first request. |
| Domain mismatch | Edge and client use different profiles | Cookie on `cdn.example.com` is not visible to `app.example.com`. |

---

## 5. Event Construction

### Common Fields (All Event Types)

```typescript
{
  type: 'page' | 'track' | 'identify' | 'screen' | 'component',
  channel: 'web' | 'mobile' | 'server',  // use 'server' for SSR/ESR
  messageId: string,       // unique per event -- use crypto.randomUUID()
  timestamp: string,       // ISO 8601 -- when the event occurred
  context: {
    library: { name: string, version: string },
    location?: {
      countryCode?: string,   // ISO 3166-1 alpha-2 -- critical for geo audiences
      city?: string,
      region?: string,
    },
    page?: {
      path: string,
      query: Record<string, string | string[]>,
      referrer: string,
      search: string,
      url: string,
    },
  },
}
```

### Key Field Requirements

| Field | Required? | Notes |
|---|:---:|---|
| `type` | Yes | `'page'`, `'track'`, `'identify'` |
| `channel` | Yes | Use `'server'` for server-side calls to distinguish from client traffic |
| `messageId` | Yes | Unique per event. Use `crypto.randomUUID()` |
| `timestamp` | Yes | ISO 8601 string |
| `context.library` | Yes | Identifies the calling system. Set `name` and `version` |
| `context.location` | No | **Include `countryCode` if your edge platform provides it** -- without it, geo-based audiences cannot evaluate |
| `context.page` | Yes (page events) | Current page information |

### Page Event (Complete)

```typescript
const pageEvent = {
  type: 'page' as const,
  channel: 'server' as const,
  messageId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  sentAt: new Date().toISOString(),
  context: {
    library: { name: 'my-app-edge', version: '1.0.0' },
    page: {
      path: '/products/shoes',
      query: Object.fromEntries(searchParams),
      referrer: request.headers.get('referer') ?? '',
      search: url.search,
      url: url.toString(),
    },
    location: {
      countryCode: 'US',  // ISO 3166-1 alpha-2 -- CRITICAL for geo audiences
    },
  },
  properties: {
    path: '/products/shoes',
    query: Object.fromEntries(searchParams),
    referrer: request.headers.get('referer') ?? '',
    search: url.search,
    url: url.toString(),
    title: 'Shoes',
  },
};
```

### Identify Event (Login/Signup ONLY)

Triggers a **profile merge** when `userId` is non-empty -- an expensive operation. Only send during moments of identification.

```typescript
const identifyEvent = {
  type: 'identify' as const,
  channel: 'server' as const,
  messageId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  sentAt: new Date().toISOString(),
  userId: externalUserId,  // MUST be an external ID, NEVER the profile ID (ntaid)
  traits: {
    email: 'user@example.com',
    plan: 'premium',
  },
  context: {
    library: { name: 'my-app-edge', version: '1.0.0' },
  },
};
```

**userId behavior:**

| `userId` value | Behavior | Performance impact |
|---|---|---|
| Non-empty external ID | Merge event -- resolves redirects, merges data | Significantly slower than page event |
| Empty string (`''`) | Trait update only -- applies traits without triggering merge | Normal performance |
| Profile ID (ntaid) | **Self-merge anti-pattern** -- creates redirect cycle, breaks continuity | Severe -- see Anti-Pattern #2 |

### Track Event

Custom events. Safe to send from server-side, no merge overhead.

```typescript
{
  type: 'track',
  event: 'purchase_completed',
  properties: { orderId: 'order-456', total: 99.99 },
  channel: 'server',
  messageId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  context: { library: { name: 'my-app-edge', version: '1.0.0' } },
}
```

### Platform-Specific Geo Data

| Platform | Country Code Source |
|---|---|
| Vercel Edge | `request.geo.country` |
| Next.js Middleware | `request.geo?.country` (Vercel only -- self-hosted needs IP geolocation or CDN header) |

---

## 6. Framework Integration Examples

Every server-side integration follows the same general flow:

1. **Extract** `ntaid` cookie from incoming request
2. **Build** a page event with geo data from the edge platform (`context.location.countryCode`)
3. **Call** `POST /profiles/{ntaid}?type=preflight` (or `/profiles?type=preflight` for first visit)
4. **Set** `ntaid` cookie from `response.data.profile.id` on the outgoing response
5. **Pass** `data.experiences` and `data.changes` to the rendering layer
6. **Handle** errors by serving baseline (unpersonalized) content -- never block rendering on API failures

### Next.js Middleware (Complete Example)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

const ORG_ID = process.env.NINETAILED_ORG_ID;
const ENV_SLUG = process.env.NINETAILED_ENV_SLUG || 'main';
const API_BASE = `https://experience.ninetailed.co/v2/organizations/${ORG_ID}/environments/${ENV_SLUG}/profiles`;

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|static).*)'],
};

export async function middleware(request: Request) {
  const cookies = new Map(
    request.headers
      .get('cookie')
      ?.split('; ')
      .map((c) => {
        const [k, ...v] = c.split('=');
        return [k, v.join('=')] as [string, string];
      }) ?? []
  );
  const ntaid = cookies.get('ntaid');

  const url = new URL(request.url);
  const pageEvent = {
    type: 'page' as const,
    channel: 'server' as const,
    messageId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    context: {
      library: { name: 'my-app-middleware', version: '1.0.0' },
      page: {
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        referrer: request.headers.get('referer') ?? '',
        search: url.search,
        url: url.toString(),
      },
      // Geo data: request.geo?.country is only available on Vercel
    },
    properties: {
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      referrer: request.headers.get('referer') ?? '',
      search: url.search,
      url: url.toString(),
      title: '',
    },
  };

  const apiUrl = ntaid
    ? `${API_BASE}/${ntaid}?type=preflight&locale=en`
    : `${API_BASE}?type=preflight&locale=en`;

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [pageEvent] }),
      signal: AbortSignal.timeout(2000),
    });

    if (!apiResponse.ok) {
      return NextResponse.next();  // Serve baseline on API failure
    }

    const { data } = await apiResponse.json();
    const profileId = data.profile.id;
    const experiences = data.experiences ?? [];

    // Encode experience selections into query params for the page to read
    const experienceParam = experiences
      .map(
        (e: { experienceId: string; variantIndex: number }) =>
          `${e.experienceId}=${e.variantIndex}`
      )
      .sort()
      .join(',');

    const rewriteUrl = new URL(request.url);
    if (experienceParam) {
      rewriteUrl.searchParams.set('nt', experienceParam);
    }

    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set('ntaid', profileId, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: true,
    });

    return response;
  } catch {
    return NextResponse.next();  // Serve baseline on timeout or network error
  }
}
```

**Next.js-specific notes:**

- Runs at the edge by default on Vercel, or in Node.js in self-hosted setups
- Geo data available via `request.geo?.country` (Vercel only -- self-hosted needs IP geolocation or a CDN header)
- Use `NextResponse.rewrite()` to pass experience selections to page components without changing the visible URL
- Use `AbortSignal.timeout(2000)` to prevent slow API calls from blocking page loads
- Matcher should exclude static assets: `['/((?!_next|api|favicon.ico|static).*)']`

### Passing Experience Selections to the Client

| Approach | Pros | Cons |
|---|---|---|
| URL query params (e.g., `?nt=exp1=0,exp2=1`) | Works with CDN caching (different variant combos get different cache keys) | Pollutes the URL |
| Response headers (e.g., `x-ninetailed-experiences`) | Does not pollute the URL | Requires client to read headers |
| Inline JSON in HTML | Simplest approach | Requires HTML manipulation at the edge |

### JS SDK (`@ninetailed/experience.js-shared`)

If you prefer using the SDK wrapper instead of raw `fetch`:

- `NinetailedApiClient` wraps the HTTP calls: `upsertProfile({ profileId, events, preflight: true })`
- `preflight: true` adds `?type=preflight` to the request
- The SDK handles URL construction and request formatting
- You still need to manage the `ntaid` cookie yourself -- the SDK does not do cookie management
- `result.profile.id` is the canonical profile ID to use for the cookie

---

## 7. Anti-Patterns

These cause real production issues. Every server-side integration must be checked against all of them.

### Anti-Pattern #1: Identify on Every Page Load

**What the code looks like:** Any identify event inside middleware, edge handler, or `getServerSideProps` that runs on every page load. The condition is usually "if user traits exist" or "if customer ID exists" -- which is true on every authenticated request, not just login.

**What happens:** An identify event with a non-empty `userId` triggers a **profile merge** operation. The system resolves redirect chains, fetches and merges data, and writes redirect pointers. This is significantly slower than a page event. When called on every page load, redirect chains grow linearly with request volume. The system has self-healing that shortens chains, but it cannot keep up with per-page-load identify storms. Eventually timeouts increase progressively and may cause 500 errors.

**The fix:** Only send identify events during **moments of identification** -- login, signup, account linking. Use a session cookie flag (e.g., `nt_identified`) to avoid re-identifying within the same session.

```typescript
// Pseudo-code for server-side identify guard
const hasIdentified = cookies.get('nt_identified') === '1';
const events = [pageEvent];

if (userId && !hasIdentified) {
  events.push(identifyEvent);
  // Set session cookie after successful API call
  response.cookies.set('nt_identified', '1', { maxAge: 0 }); // session cookie
}
```

After fixing, existing redirect chains self-heal gradually. Improvement should be visible within days without any data migration.

### Anti-Pattern #2: Self-Merge (Using Profile ID as userId)

**What the code looks like:**

```typescript
// WRONG: falls back to profile ID when no customer ID
userId: customerId || ntaid || '';

// CORRECT: only use external identity, omit identify if no external ID
userId: customerId || '';
```

**What happens:** When `userId` equals the profile's own ID, the system tries to merge the profile with itself. This creates a redirect cycle. The cycle detection catches it but not before potentially allocating a new canonical ID (breaking cookie continuity) and causing the user to get a fresh profile on next visit, losing all trait history and experience selections.

**The fix:** `userId` must always be an **external** user identity. If you do not have an external user ID, do not send an identify event at all.

### Anti-Pattern #3: Server-Side Calls Moving Profiles Away from Users

**What happens:** The Experience API monitors which data center calls each profile. If calls consistently come from far away, the system relocates the profile closer to the caller. For client-side calls, this moves the profile closer to the user (good). For server-side calls from a centralized server, this moves the profile near the server but far from the user's browser. If both server and client call the same profile from different regions, the profile can ping-pong between data centers.

**Mitigation:**

- **Edge deployments** (Vercel Edge, etc.) naturally call from near the user, reducing this risk significantly.
- **For centralized servers:** Use preflight mode to reduce write operations. Ensure your client SDK is also running so the profile receives calls from the user's actual location.
- **Batch endpoints** (`POST /events`, `POST /import/events`) do NOT trigger relocation. If you do not need experience variant selections in the response (e.g., a backend job syncing traits), use these instead.

### Anti-Pattern #4: Sequential API Calls per Page Load

**What the code looks like:** Two separate calls for identify and page events instead of batching them in one request.

**What happens:** Two sequential calls double your latency budget. Worse: if one is an identify and one is a page event, the identify creates a merge and redirect that the page event then has to traverse.

**The fix:** Batch all events into a single API call. The `events` array accepts up to 200 events.

### Anti-Pattern #5: Missing Cookie Propagation

**What the code looks like:** Setting the cookie from the request value or not setting it at all, instead of using `response.data.profile.id`.

**What happens:** If the cookie and client SDK use different profile IDs, you get duplicate profiles with separate trait histories and experience selections.

**The fix:** **Always** set the `ntaid` cookie from `response.data.profile.id`. Trust the response, not the old cookie value.

### Anti-Pattern #6: Missing Preflight in Hybrid Setup

**What the code looks like:** Server-side API call without `?type=preflight` when a client SDK also runs on the page.

**What happens:** Without preflight, both server and client persist the same events. Result: 2x pageviews in analytics, 2x trait updates, potential race conditions on profile state.

**The fix:** Add `?type=preflight` to the server-side call. The server gets the same response but nothing is persisted.

### Anti-Pattern #7: Missing countryCode for Geo Audiences

**What the code looks like:** Server-side event construction that omits `context.location.countryCode` even though the edge platform provides geolocation data.

**What happens:** Without `countryCode`, geo-based audiences cannot evaluate on the server. The API falls back to IP-based geolocation, which may resolve to your server's location, not the user's.

**The fix:** Extract from platform-specific headers and include in `context.location`.

### Bonus Anti-Pattern: UTM/Query Params Sent as Identify Traits

**What the code looks like:** Identify event on every page load with traits like `{ query_params: "?utm_source=..." }`.

**What happens:** Same as identify-on-every-page-load. UTM-based targeting should use event count rules (pageview rules matching on URL or event properties), not trait rules. Event count rules do not require identify at all -- page events are enough.

**The fix:** Restructure the audience to use event count rules instead of trait rules. If the audience cannot be changed immediately, guard identify with a session cookie flag.

---

## 8. Troubleshooting

### Timeouts / Slow API Responses

| Timeout Pattern | Root Cause | Fix |
|---|---|---|
| Gradual increase over days/weeks | Identify on every page load (redirect chains growing) | Move identify to login/signup only. Chains self-heal over days. |
| Sudden spike after deploy | New code added identify to server flow, or server region changed | Check deploy dates vs error spike dates. |
| Consistent ~5s timeouts | Client-side AbortController timeout, not an API issue | Check client config `requestTimeout`. |
| Intermittent, no pattern | Network issues or WAF false positives | Check server location vs API edge. |

### Duplicate Profiles

**Symptom:** Customer sees two different profile IDs for the same user.

**Most likely cause:** The `ntaid` cookie is not being set from the API response's `profile.id`.

**Other causes:** `userId` in identify set to the profile's own ID (self-merge).

**Fix:** Set `ntaid` cookie from `data.profile.id` in every API response. Always trust the response.

### 403 Forbidden Errors

**Symptom:** Intermittent 403s from the Experience API. Same config works from client SDK.

**Most likely cause:** WAF false positive. Server-side requests have non-browser user agents and come from cloud IP ranges, which can trip different rule sets than browser requests.

**Fix:** Contact support with server's user agent string and IP ranges to add a WAF exception. Fallback-to-baseline handling already protects end users.

### Missing Insights Data

**Symptom:** Insights dashboards empty despite personalization working correctly.

**Most likely cause:** Server-only setup with no client SDK sending component events. Insights requires client-side viewport detection.

**Fix:** Keep the client SDK with the Insights plugin. Use the hybrid pattern with preflight on the server.

### Double-Counted Pageviews

**Symptom:** Analytics shows 2x the expected pageview count.

**Most likely cause:** Hybrid setup without `?type=preflight` on the server call.

**Fix:** Add `?type=preflight` to the server-side call.

### Geo Audiences Not Matching

**Symptom:** Geo-based audiences do not evaluate correctly for server-side rendered pages.

**Most likely cause:** Missing `countryCode` in server events. The API falls back to IP-based geolocation, which resolves to the server's location.

**Fix:** Include `countryCode` from the edge platform (see Platform-Specific Geo Data table above).

### Profile ID Changes Between Requests

**Symptom:** The profile ID stored in the cookie keeps changing.

**Most likely cause:** Profile was merged between requests, or self-merge is creating new canonical IDs.

**Fix:** Always use `data.profile.id` from the latest response. Check for self-merge (userId = ntaid).

### Identify Event Red Flags (Code Review Checklist)

| Red Flag | What It Looks Like | Why It Breaks |
|---|---|---|
| Identify in per-request handler | Identify event inside middleware or `getServerSideProps` | Every page load adds a redirect hop. Merge is significantly slower than page, and each subsequent merge must traverse the growing chain. |
| userId fallback to profile ID | `userId: customerId \|\| ntaid \|\| ''` | System tries to merge profile with itself. User gets fresh profile on next visit. |
| Two sequential API calls | Separate calls for identify and page events | Two round trips. First call creates redirect, second call must traverse it. |
| UTM/query params as identify traits | `traits: { query_params: "?utm_source=..." }` on every page load | Same as identify-on-every-page-load. Audience should use event count rules instead. |
| Missing preflight in hybrid | Server call without `?type=preflight` when client SDK also runs | Both server and client persist same events. 2x everything in analytics. |
