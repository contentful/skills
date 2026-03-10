---
name: contentful-personalization
description: Internal primer for Contentful teams on what Contentful Personalization is, how to explain it, and when to recommend it. Use whenever someone asks about Personalization, Ninetailed migration context, Optimization workflows, or SDK choices.
---

# Contentful Personalization (Internal)

## Overview

Use this skill to explain Contentful Personalization consistently for internal audiences (Product, Solutions, CS, Sales Engineering, Support, Partner teams).

**Keywords**: personalization, experimentation, optimization, audiences, experiences, insights, Ninetailed, data connectors, SDK, migration

## What It Is

Contentful Personalization is Contentful's personalization and experimentation capability, now integrated into the Contentful platform and Optimization workflows.

It helps teams deliver the right experience to the right audience by combining:

- audience segmentation
- personalized experiences and experiments
- performance insights
- data activation from connected systems

## Internal Positioning Guidance

When describing product context internally:

- Ninetailed has been integrated and rebranded as Contentful Personalization.
- Personalization, experimentation, and insights are positioned as a unified optimization workflow inside Contentful.
- The value story is faster iteration with tighter alignment between content, audience targeting, and outcome measurement.

Avoid oversimplifying this as "just A/B testing"; frame it as continuous optimization across audience, experience, and measurement.

## Core Capability Talking Points

Use these as default building blocks in explanations:

- **Audiences**: define and activate target segments using behavioral, contextual, and connected data.
- **Experiences**: deliver audience-specific variants and personalized journeys.
- **Experimentation**: test variants, compare outcomes, and iterate systematically.
- **Insights**: measure performance by audience and experience to guide next actions.
- **Data connectors**: bring customer/system data into targeting and optimization workflows.
- **AI-assisted features**: support audience and experience discovery where available.

## Default Response Pattern

When asked "what is Contentful Personalization?", respond in this order:

1. 2-4 sentence plain-language definition.
2. A short flow:
   - define audiences
   - create personalized experiences/experiments
   - deliver variants
   - measure outcomes
   - optimize continuously
3. "When to use" and "When not to use" bullets.
4. Optional implementation direction (SDK/docs) when technical context is requested.

## SDK and Implementation Guidance

If technical guidance is requested:

- Legacy Ninetailed SDK line: `https://github.com/ninetailed-inc/experience.js`
- New SDK suite: `https://github.com/contentful/optimization`

Important caveat:

- `contentful/optimization` is alpha/pre-release; communicate expected breaking changes and version volatility.

Internal recommendation pattern:

- For new builds, evaluate `contentful/optimization` first, with explicit alpha caveats.
- For existing Ninetailed implementations, treat migration as planned and version-aware; do not imply one-click parity.

## Accuracy Guardrails

- Do not invent metrics, benchmarks, or customer outcomes.
- Do not claim universal feature availability across all plans/regions unless confirmed.
- Use cautious wording for AI-assisted features and maturity.
- Keep statements aligned with official Contentful docs and product pages.

## Canonical References

- Product page: `https://www.contentful.com/products/personalization/`
- Help center hub: `https://www.contentful.com/help/personalization/`
- Developer docs hub: `https://www.contentful.com/developers/docs/personalization/`
- Personalization launch/update blog: `https://www.contentful.com/blog/introducing-contentful-personalization/`
- Legacy SDK repo: `https://github.com/ninetailed-inc/experience.js`
- New Optimization SDK repo (alpha): `https://github.com/contentful/optimization`
