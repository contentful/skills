# TypeScript Scripts

How to set up a skill with TypeScript scripts running on Node.js.

## Directory layout

```
my-code-skill/
  SKILL.md
  package.json
  package-lock.json         Committed — pins dependency versions
  tsconfig.json
  .gitignore                node_modules/
  scripts/
    check                   Shell wrapper (chmod +x) → src/bin/check.ts
    fix                     Shell wrapper (chmod +x) → src/bin/fix.ts
  src/
    bin/
      check.ts              Entry point
      fix.ts                Entry point
    lib/
      validators.ts         Shared modules
      formatters.ts
    test/
      validators.test.ts    Unit tests
  references/
    api.md
```

The live `contentful-personalization` skill is built with skill-kit at the monorepo
level (`src/skills/contentful-personalization/`); this layout is a generic TypeScript
skill pattern.

## Shell wrappers

Each script in `scripts/` is a thin bash wrapper that delegates to the
TypeScript entry point via a runner like `tsx`:

```bash
#!/usr/bin/env bash
exec npx tsx "$(dirname "$0")/../src/bin/check.ts" "$@"
```

Make wrappers executable:

```bash
chmod +x scripts/check scripts/fix
```

Don't put logic in wrappers. They exist only to bridge `scripts/` (the
public interface) to `src/` (the implementation).

## package.json

```json
{
  "name": "@contentful/skill-contentful-personalization",
  "version": "1.0.0",
  "description": "Diagnose and fix Contentful optimization issues",
  "license": "MIT",
  "files": ["SKILL.md", "scripts/**", "references/**"],
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

Run `npm install` and commit `package-lock.json`. Add `node_modules/` to
the skill's `.gitignore`.

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts"]
}
```

## src/ layout

- `src/bin/` — Entry points. One file per script in `scripts/`. Each should
  parse arguments, call into `lib/`, and handle process exit.
- `src/lib/` — Shared modules used by multiple entry points. Validators,
  parsers, formatters, API clients.
- `src/test/` — Unit tests. No live API calls — mock external dependencies.
  Test pure logic: validators, parsers, formatters.

Internal imports use relative paths:

```typescript
// from src/bin/check.ts
import { validateConfig } from "../lib/validators.js";

// from src/lib/formatters.ts
import { CheckResult } from "./types.js";
```

## Entry point pattern

```typescript
// src/bin/check.ts
import { parseArgs } from "node:util";
import { runChecks } from "../lib/validators.js";

const { values } = parseArgs({
  options: {
    env: { type: "string", default: "development" },
    verbose: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.error(`Usage: check [OPTIONS]

Validate Contentful optimization configuration.

Options:
  --env <name>       Target environment (default: development)
  --verbose          Include detailed diagnostic output
  --dry-run          Show what would be checked without running
  -h, --help         Show this help message`);
  process.exit(0);
}

const result = await runChecks({
  env: values.env!,
  verbose: values.verbose!,
  dryRun: values["dry-run"]!,
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.summary.fail > 0 ? 1 : 0);
```

## Testing

Run from the skill root:

```bash
npx tsx --test src/test/*.test.ts
```

Or use a test runner like Jest or Vitest — whatever fits the project. The
key rules:

- No live API calls in unit tests — mock external dependencies
- Test pure logic: validators, parsers, formatters
- Use factory functions for test data: `makeConfig(overrides)`
