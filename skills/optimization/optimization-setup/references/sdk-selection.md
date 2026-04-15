# SDK Selection

Use this guide to choose between the stable Experience.js path and the new alpha optimization SDK.

## Current Options

- Stable SDK (recommended default for production): `@ninetailed/experience.js`
- Fresh-install alpha option: https://github.com/contentful/optimization

## Recommendation Matrix

Use stable `@ninetailed/experience.js` when:

- The project is production-critical
- The team needs battle-tested behavior and known integration patterns
- You need lower migration risk and predictable support

Consider alpha `contentful/optimization` when:

- The project is a fresh install
- The team accepts alpha maturity and potential API changes
- The goal includes early adoption and feedback loops

## Decision Rule

If the user does not explicitly ask for alpha, implement the stable path first.

When alpha is selected, clearly communicate:

- It is alpha and may change
- Migration effort may be required later
- Verification and rollback planning should be stricter than normal
