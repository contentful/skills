# Running Migrations

How to execute migration scripts using the Contentful CLI and programmatic API.

## Prerequisites

Install Contentful CLI as a dev dependency (if not already installed):

```bash
npm install --save-dev contentful-cli
```

Requires Node.js 18 or later.

Do not use `npx contentful-migration` as a CLI command. The migration CLI command is in `contentful-cli`, and should be run via `npx contentful ...`.

You need a **Content Management API (CMA) access token** with write access to the target space.

Create it in one of these places:
- Account settings -> CMA tokens: `https://app.contentful.com/account/profile/cma_tokens`
- Space-scoped CMA tokens page: `https://app.contentful.com/spaces/<SPACE_ID>/api/cma_tokens`

## CLI Usage (Contentful CLI)

```bash
npx contentful space migration --space-id <space-id> --management-token <cma-token> <migration-file>
```

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--space-id` | `-s` | Space ID (required) |
| `--environment-id` | `-e` | Environment (default: `master`) |
| `--management-token` | `--mt` | CMA access token |
| `--yes` | `-y` | Skip confirmation prompt |
| `--retry-limit` | | Retries before failure (default: 5) |
| `--config` | | Path to JSON config file |

### Examples

```bash
# Run against master
npx contentful space migration -s abc123 --management-token "$CMA_TOKEN" 001-create-blog.ts

# Run against a sandbox environment
npx contentful space migration -s abc123 -e sandbox --management-token "$CMA_TOKEN" 001-create-blog.ts

# Skip confirmation
npx contentful space migration -s abc123 -e sandbox --management-token "$CMA_TOKEN" -y 001-create-blog.ts

# Run multiple migrations in order
for f in migrations/*.ts; do
  npx contentful space migration -s abc123 -e sandbox --management-token "$CMA_TOKEN" -y "$f"
done
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CONTENTFUL_SPACE_ID` | Space ID used by CLI examples and scripts |
| `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN` | CMA token used to set `--management-token` |
| `CONTENTFUL_ENVIRONMENT_ID` | Optional default environment ID (for example `master` or `sandbox`) |

```bash
# .env
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_MANAGEMENT_ACCESS_TOKEN=your_cma_token
CONTENTFUL_ENVIRONMENT_ID=sandbox
```

Where to find each value:
- `CONTENTFUL_SPACE_ID`: in the Contentful URL (`/spaces/<SPACE_ID>/...`) or **Space settings -> API keys**.
- `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN`: **Account settings -> CMA tokens** (`https://app.contentful.com/account/profile/cma_tokens`) or `https://app.contentful.com/spaces/<SPACE_ID>/api/cma_tokens`.
- `CONTENTFUL_ENVIRONMENT_ID`: **Space settings -> Environments** (for example `master`, `sandbox`, `staging`).

If any required value is missing, ask the user to populate it in `.env` before running migrations.

```bash
CMA_TOKEN="${CONTENTFUL_MANAGEMENT_ACCESS_TOKEN}"
npx contentful space migration -s abc123 -e sandbox --management-token "$CMA_TOKEN" 001-create-blog.ts
```

## Programmatic API

Use `runMigration()` to run migrations from Node.js scripts, test runners, or CI pipelines.

Install the library for programmatic usage:

```bash
npm install contentful-migration
```

```typescript
import { runMigration } from 'contentful-migration'

// From a file
await runMigration({
  filePath: './migrations/001-create-blog.ts',
  spaceId: 'abc123',
  accessToken: process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN!,
  environmentId: 'sandbox',
  yes: true,
})

// From a function
await runMigration({
  migrationFunction: (migration) => {
    migration.createContentType('test', { name: 'Test' })
  },
  spaceId: 'abc123',
  accessToken: process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN!,
  environmentId: 'sandbox',
  yes: true,
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePath` | string | — | Path to migration file (use this or `migrationFunction`) |
| `migrationFunction` | function | — | Migration function directly |
| `spaceId` | string | — | Space ID (required) |
| `accessToken` | string | — | CMA token (required) |
| `environmentId` | string | `'master'` | Target environment |
| `yes` | boolean | `false` | Skip confirmation |
| `retryLimit` | number | `5` | Retry attempts |
| `requestBatchSize` | number | `100` | Batch size for API requests |
| `headers` | object | — | Custom HTTP headers |
| `host` | string | — | Custom API host |

## Environment Strategy

Never run untested migrations directly against your production environment.

**Recommended workflow:**

1. **Create a sandbox environment** from master (via the Contentful web app or CMA).

2. **Run migrations against sandbox:**
   ```bash
   npx contentful space migration -s abc123 -e sandbox --management-token "$CMA_TOKEN" 001-create-blog.ts
   ```

3. **Verify** the content model and entries look correct in the web app.

4. **Run against master** (or your production environment alias):
   ```bash
   npx contentful space migration -s abc123 -e master --management-token "$CMA_TOKEN" 001-create-blog.ts
   ```

5. **Delete the sandbox** when done (via the web app or CMA).

For teams using **environment aliases**, point your production alias to the migrated environment rather than running migrations against the aliased environment directly.

## Migration File Organization

Name migration files with sequential prefixes so they run in order:

```
migrations/
  001-create-author.ts
  002-create-blog-post.ts
  003-add-excerpt-to-blog-post.ts
  004-transform-categories.ts
  005-delete-legacy-widget.ts
```

Guidelines:
- One logical change per file
- Use descriptive names that explain what the migration does
- Keep the numbering sequential with zero-padded prefixes
- Commit migration files to version control
- Never edit a migration that has already been applied — write a new one instead

## Testing Migrations

1. **Sandbox environments** are the primary testing mechanism. Create one, run the migration, verify, delete.

2. **Dry-run approach:** Use `context.makeRequest` to read current state, log what would change, and return early:
   ```typescript
   import type { MigrationFunction } from 'contentful-migration'

   const migration: MigrationFunction = async (migration, { makeRequest }) => {
     const types = await makeRequest({ method: 'GET', url: '/content_types' })
     console.log('Would affect:', types.items.map((t: any) => t.sys.id))
     return
   }

   export = migration
   ```

3. **Programmatic tests:** Use `runMigration()` in your test suite against a dedicated test environment.

## CI/CD Integration

Run migrations as part of your deployment pipeline:

```bash
#!/usr/bin/env bash
set -euo pipefail

SPACE_ID="${CONTENTFUL_SPACE_ID}"
ENV_ID="${DEPLOY_ENV:-master}"

for migration in migrations/*.ts; do
  echo "Running: $migration"
  npx contentful space migration \
    --space-id "$SPACE_ID" \
    --environment-id "$ENV_ID" \
    --management-token "$CONTENTFUL_MANAGEMENT_ACCESS_TOKEN" \
    --yes \
    "$migration"
done
```

This script reads `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN` from your shell environment and passes it to `--management-token`.

Track which migrations have been applied (e.g., in a version entry or external state file) to avoid re-running completed migrations.
