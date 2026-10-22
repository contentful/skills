import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const FETCH_SPACE = fileURLToPath(
  new URL('../../../../../skills/contentful-env-analysis/scripts/main.js', import.meta.url),
);
const SPACE = 'space-1';
const ENVIRONMENT = 'env-1';
const ALPHA_HEADER = 'x-contentful-enable-alpha-feature';
const ALPHA_FEATURE = 'new-exo-entity-types';

interface StubRoute {
  status: number;
  count?: number;
  location?: string;
  message?: string;
}

interface RecordedRequest {
  method: string;
  collection: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

interface Stub {
  port: number;
  requests: RecordedRequest[];
  close: () => Promise<void>;
}

interface StubOptions {
  environmentId?: string;
  /** Serve `entries` as a real CMA collection: honour `skip` and report `total`, so paging terminates.
   * The ExO routes deliberately do the opposite. */
  paginateEntries?: boolean;
  paginateAssets?: boolean;
  entriesByContentType?: Record<string, unknown[]>;
  entries?: unknown[];
  assets?: unknown[];
  metadata?: { tags?: unknown[]; concepts?: unknown[] };
  rateLimitOnce?: string;
}

/** How many entries the paginated CMA stub holds — more than one cursor page at the fetcher's limit. */
const PAGINATED_ENTRY_COUNT = 1500;

/** Requests to a collection, ignoring the item id path segment DELETE/GET-by-id use. The space-level
 * `GET /spaces/<id>` that the fetcher makes for the space name has no environment segment, so it
 * maps to the reserved key "space". */
function collectionOf(url: string, environmentId = ENVIRONMENT): string {
  const path = url.split('?')[0] ?? '';
  const segments = path.split('/').filter(Boolean);
  if (segments.includes('concepts')) return 'concepts';
  const envIndex = segments.indexOf(encodeURIComponent(environmentId));
  if (envIndex >= 0) return segments[envIndex + 1] ?? '';
  return segments[0] === 'spaces' && segments.length === 2 ? 'space' : '';
}

/**
 * An ExO API stand-in. `routes` maps a collection name to the status it answers and how many items it
 * holds. Items are returned for every `skip`, which is what the real server does on these collections
 * so a full ExO page must be reported as incomplete rather than paged indefinitely.
 */
async function startStub(routes: Record<string, StubRoute>, options: StubOptions = {}): Promise<Stub> {
  const requests: RecordedRequest[] = [];

  const handler = (req: IncomingMessage, res: ServerResponse): void => {
    const url = req.url ?? '';
    const collection = collectionOf(url, options.environmentId);
    requests.push({ method: req.method ?? 'GET', collection, url, headers: req.headers });

    if (
      options.rateLimitOnce === collection &&
      requests.filter((request) => request.collection === collection).length === 1
    ) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'X-Contentful-RateLimit-Reset': '0.001' });
      res.end(JSON.stringify({ message: 'stubbed 429' }));
      return;
    }

    if ((options.paginateEntries && collection === 'entries') || (options.paginateAssets && collection === 'assets')) {
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const limit = Number(params.get('limit') ?? '100');
      const skip = Number(params.get('pageNext') ?? params.get('skip') ?? '0');
      const page = Array.from({ length: Math.max(0, Math.min(limit, PAGINATED_ENTRY_COUNT - skip)) }, (_, i) => ({
        sys: { id: `entry-${skip + i}`, version: 1 },
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const next = skip + limit < PAGINATED_ENTRY_COUNT ? `${url.split('?')[0]}?pageNext=${skip + limit}` : undefined;
      res.end(JSON.stringify({ items: page, pages: next ? { next } : {} }));
      return;
    }

    if (collection === 'entries' && options.entriesByContentType) {
      const type = new URL(`http://stub${url}`).searchParams.get('content_type');
      const items = options.entriesByContentType[type ?? ''] ?? [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ total: items.length, items }));
      return;
    }

    if (collection === 'entries' && options.entries) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ items: options.entries, pages: {} }));
      return;
    }

    if (collection === 'assets' && options.assets) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ items: options.assets, pages: {} }));
      return;
    }

    if ((collection === 'tags' || collection === 'concepts') && options.metadata) {
      const id = url.split('?')[0]?.split('/').filter(Boolean).at(-1);
      const item = (options.metadata[collection] ?? []).find((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const sys = (value as Record<string, unknown>).sys;
        return Boolean(
          sys && typeof sys === 'object' && !Array.isArray(sys) && (sys as Record<string, unknown>).id === id,
        );
      });
      if (!item) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `${collection} item not found` }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(item));
      return;
    }

    const route = routes[collection];
    if (route && route.status !== 200) {
      res.writeHead(route.status, {
        'Content-Type': 'application/json',
        ...(route.location ? { Location: route.location } : {}),
      });
      res.end(JSON.stringify({ message: route.message ?? `stubbed ${route.status}` }));
      return;
    }
    if (collection === 'space') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ name: 'Stub Space', sys: { organization: { sys: { id: 'org-1' } } } }));
      return;
    }
    if (route === undefined) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `no stub route for ${collection}` }));
      return;
    }
    const items = Array.from({ length: route.count ?? 0 }, (_, i) => ({
      sys:
        collection === 'content_types'
          ? {
              id: `${collection}-${i}`,
              type: 'ContentType',
              space: { sys: { type: 'Link', linkType: 'Space', id: SPACE } },
              environment: { sys: { type: 'Link', linkType: 'Environment', id: ENVIRONMENT } },
              createdAt: '2026-01-01T00:00:00.000Z',
              createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
              version: 1,
            }
          : { id: `${collection}-${i}`, type: undefined, version: 1 },
      ...(collection === 'content_types'
        ? {
            name: `${collection}-${i}`,
            displayField: 'title',
            fields: [
              {
                id: 'title',
                name: 'Title',
                type: 'Symbol',
                validations: [],
                defaultValue: { 'en-US': 'Untitled' },
              },
              {
                id: 'externalEntry',
                name: 'External entry',
                type: 'ResourceLink',
                validations: [],
                allowedResources: [
                  {
                    type: 'Contentful:Entry',
                    source: 'crn:contentful:::content:spaces/$self/environments/$self',
                    contentTypes: ['product'],
                  },
                ],
              },
            ],
          }
        : {}),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items, pages: {} }));
  };

  const server: Server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('stub server did not bind a port');
  }

  return {
    port: address.port,
    requests,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

async function runTool(
  script: string,
  args: string[],
  port: number,
  options: { apiHost?: string; hostSource?: 'file' | 'environment' | 'flag' } = {},
): Promise<{ status: number; stdout: string; stderr: string }> {
  const root = mkdtempSync(join(tmpdir(), 'env-fetch-test-'));
  const work = join(root, 'work');
  const envFile = join(root, 'credentials file.env');
  mkdirSync(work);
  writeFileSync(join(work, '.env'), 'SPACE_ID=wrong-space\n');
  writeFileSync(
    envFile,
    [
      ...(options.hostSource === 'environment' || options.hostSource === 'flag'
        ? []
        : [`API_HOST=${options.apiHost ?? 'api.contentful.com'}`]),
      `SPACE_ID=${SPACE}`,
      `ENVIRONMENT_ID=${ENVIRONMENT}`,
      'CONTENTFUL_CMA_TOKEN=stub-token',
    ].join('\n'),
  );
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          '--import',
          new URL('test-transport.ts', import.meta.url).href,
          script,
          'fetch',
          `--dir=${work}`,
          `--env-file=${envFile}`,
          ...args,
          ...(options.hostSource === 'flag' ? ['--api-host', options.apiHost!] : []),
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            API_HOST: options.hostSource === 'environment' ? options.apiHost : undefined,
            CONTENTFUL_CMA_TOKEN: 'stub-token',
            ENV_ANALYSIS_TEST_PORT: String(port),
            HTTP_PROXY: '',
            HTTPS_PROXY: '',
            ALL_PROXY: '',
            NO_PROXY: '*',
          },
        },
      );
      let stdout = '',
        stderr = '';
      child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
        stderr += chunk;
      });
      const timer = setTimeout(() => child.kill('SIGKILL'), 60_000);
      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on('close', (status, signal) => {
        clearTimeout(timer);
        if (status === null) reject(new Error(`Fetch killed by ${signal}`));
        else resolve({ status, stdout, stderr });
      });
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const FETCH_ROUTES: Record<string, StubRoute> = {
  content_types: { status: 200, count: 0 },
  entries: { status: 200, count: 0 },
  assets: { status: 200, count: 0 },
  components: { status: 200, count: 0 },
  experience_templates: { status: 200, count: 1 },
  experiences: { status: 200, count: 2 },
  experience_fragments: { status: 200, count: 3 },
  data_assemblies: { status: 200, count: 0 },
};

/** The single space folder fetch-space.ts creates under --out-dir. */
function spaceDir(outDir: string): string {
  const folders = readdirSync(outDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.equal(folders.length, 1, `expected one space folder, saw: ${folders.join(', ')}`);
  return join(outDir, folders[0] ?? '');
}

test('fetch-space rejects unapproved API hosts from every configuration source before sending credentials', async () => {
  const stub = await startStub(FETCH_ROUTES);
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-host-'));
  try {
    for (const hostSource of ['file', 'environment', 'flag'] as const) {
      for (const apiHost of [
        'https://untrusted.invalid',
        'https://api.contentful.com.untrusted.invalid',
        'http://api.contentful.com',
        `http://127.0.0.1:${stub.port}`,
        'https://api.contentful.com:8443',
        'https://user:password@api.contentful.com',
        'https://api.contentful.com@untrusted.invalid',
        'https://api.contentful.com/path',
        'https://api.contentful.com/../',
        'https://api.contentful.com?query',
        'https://api.contentful.com#fragment',
        'https://api.contentful.com\\@untrusted.invalid',
      ]) {
        const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port, { apiHost, hostSource });
        assert.equal(run.status, 1, `${hostSource}: ${apiHost}`);
        assert.match(run.stderr, /API_HOST must be/);
        assert.doesNotMatch(run.stderr, /stub-token|password/);
      }
    }
    assert.equal(stub.requests.length, 0);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space supports canonical US and EU hosts from every configuration source', async () => {
  const stub = await startStub(FETCH_ROUTES);
  const outDir = mkdtempSync(join(tmpdir(), 'env-fetch-regions-'));
  try {
    for (const hostSource of ['file', 'environment', 'flag'] as const) {
      for (const apiHost of [
        'api.contentful.com',
        'https://api.eu.contentful.com/',
        'HTTPS://API.CONTENTFUL.COM:443/',
      ]) {
        const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port, { apiHost, hostSource });
        assert.equal(run.status, 0, run.stderr);
      }
    }
    assert.ok(stub.requests.length > 0);
    assert.ok(stub.requests.every((request) => request.method === 'GET'));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space does not follow redirects or expose credentials in API errors', async () => {
  for (const [status, location] of [
    [301, 'https://untrusted.invalid/redirect-target'],
    [302, 'https://untrusted.invalid/redirect-target'],
    [303, 'https://untrusted.invalid/redirect-target'],
    [307, 'https://untrusted.invalid/redirect-target'],
    [308, 'https://untrusted.invalid/redirect-target'],
    [307, '/redirect-target'],
    [401, undefined],
  ] as const) {
    const stub = await startStub({
      ...FETCH_ROUTES,
      space: {
        status,
        location,
        message: 'Reflected Authorization: Bearer stub-token',
      },
    });
    const outDir = mkdtempSync(join(tmpdir(), 'env-fetch-redirect-'));
    try {
      const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port);
      assert.equal(run.status, 1, run.stderr);
      assert.ok(run.stderr.includes(`HTTP ${status}`), run.stderr);
      assert.equal(stub.requests.length, 1, 'redirect target must not receive any request');
      assert.equal(stub.requests[0].headers.authorization, 'Bearer stub-token');
      assert.doesNotMatch(run.stdout + run.stderr, /stub-token|Authorization|headers|redirect-target/);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
      await stub.close();
    }
  }
});

test('fetch-space dry-run reports the selected target without downloading or revealing credentials', async () => {
  const stub = await startStub(FETCH_ROUTES);
  const outDir = mkdtempSync(join(tmpdir(), 'env-fetch-dry-run-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--dry-run', '--out-dir', outDir], stub.port, {
      apiHost: 'api.eu.contentful.com',
    });
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), {
      spaceId: SPACE,
      environmentId: ENVIRONMENT,
      apiOrigin: 'https://api.eu.contentful.com',
      outputDir: outDir,
    });
    assert.doesNotMatch(run.stdout + run.stderr, /stub-token|Authorization/);
    assert.deepEqual(readdirSync(outDir), []);
    assert.equal(stub.requests.length, 0);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space refuses to reuse a snapshot without the configured identity', async () => {
  const stub = await startStub(FETCH_ROUTES);
  const dir = mkdtempSync(join(tmpdir(), 'exo-fetch-reuse-'));
  try {
    writeFileSync(join(dir, 'contentful-unified.db'), '');
    for (const [summary, error] of [
      ['{ not json', /no valid summary\.json/],
      ['[]', /no valid summary\.json/],
      [JSON.stringify({ space_id: 'other-space', environment_id: ENVIRONMENT }), /does not belong/],
    ] as const) {
      writeFileSync(join(dir, 'summary.json'), summary);
      const result = await runTool(FETCH_SPACE, ['--out-dir', dir, '--skip-if-present'], stub.port);
      assert.equal(result.status, 1);
      assert.match(result.stderr, error);
    }
    assert.equal(stub.requests.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space records the real experiences count and requests the renamed collection', async () => {
  const stub = await startStub(FETCH_ROUTES);
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-out-'));
  try {
    const resultFile = join(outDir, 'snapshot-path.txt');
    const run = await runTool(FETCH_SPACE, [`--out-dir=${outDir}`, '--result-file', resultFile], stub.port);

    assert.equal(run.status, 0, run.stderr);
    assert.equal(readFileSync(resultFile, 'utf8'), spaceDir(outDir));
    assert.ok(stub.requests.every((request) => request.method === 'GET'));
    assert.equal(stub.requests.filter((request) => request.collection === 'space').length, 1);
    assert.match(run.stdout, /Fetched 0 entries, 0 tags, 0 taxonomy concepts/);
    assert.ok(stub.requests.some((r) => r.collection === 'experiences'));
    assert.equal(
      stub.requests.some((r) => r.collection === 'experiences_temp'),
      false,
      'requested the dead experiences_temp collection',
    );
    for (const request of stub.requests) {
      assert.equal(request.headers[ALPHA_HEADER], ALPHA_FEATURE, `missing ${ALPHA_HEADER}`);
    }
    const summary = readFileSync(join(spaceDir(outDir), 'summary.json'), 'utf8');
    assert.match(
      summary,
      /"experiences":\s*\{\s*"status":\s*"ok",\s*"collection":\s*"experiences",\s*"count":\s*2\s*\}/,
    );
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space sanitizes the snapshot folder without changing the environment ID sent to the API', async () => {
  const environmentId = 'preview/../Env\\1';
  const stub = await startStub(FETCH_ROUTES, { environmentId });
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-environment-path-'));
  try {
    const run = await runTool(
      FETCH_SPACE,
      ['--out-dir', outDir, '--keep-db', '--environment-id', environmentId],
      stub.port,
    );
    assert.equal(run.status, 0, run.stderr);
    const snapshotDir = spaceDir(outDir);
    assert.match(basename(snapshotDir), /^stub-space-preview-Env-1-\d+$/);
    assert.ok(
      stub.requests.some((request) =>
        request.url.includes(`/environments/${encodeURIComponent(environmentId)}/entries`),
      ),
    );
    const summary = JSON.parse(readFileSync(join(snapshotDir, 'summary.json'), 'utf8'));
    assert.equal(summary.environment_id, environmentId);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space persists tags and taxonomy concepts referenced by entries and assets', async () => {
  const entry = {
    sys: { id: 'entry-1' },
    fields: {},
    metadata: {
      tags: [{ sys: { id: 'entry-tag' } }],
      concepts: [{ sys: { id: 'entry-concept' } }, { sys: { id: 'missing-concept' } }],
    },
  };
  const asset = {
    sys: { id: 'asset-1' },
    fields: {},
    metadata: {
      tags: [{ sys: { id: 'asset-tag' } }],
      concepts: [{ sys: { id: 'asset-concept' } }],
    },
  };
  const stub = await startStub(
    {
      ...FETCH_ROUTES,
      entries: { status: 200 },
      assets: { status: 200 },
      tags: { status: 200 },
      concepts: { status: 200 },
    },
    {
      entries: [entry],
      assets: [asset],
      metadata: {
        tags: [
          { sys: { id: 'entry-tag' }, name: 'Entry tag', visibility: 'public' },
          { sys: { id: 'asset-tag' }, name: 'Asset tag', visibility: 'private' },
        ],
        concepts: [
          { sys: { id: 'entry-concept' }, uri: 'https://example.com/entry', prefLabel: { 'en-US': 'Entry concept' } },
          { sys: { id: 'asset-concept' }, uri: 'https://example.com/asset', prefLabel: { 'en-US': 'Asset concept' } },
        ],
      },
    },
  );
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-metadata-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--out-dir', outDir, '--keep-db'], stub.port);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stderr, /WARNING: referenced taxonomy concepts not found: missing-concept/);

    const summary = JSON.parse(readFileSync(join(spaceDir(outDir), 'summary.json'), 'utf8'));
    assert.deepEqual(summary.metadata, {
      referencedTags: 2,
      fetchedTags: 2,
      missingTagIds: [],
      referencedConcepts: 3,
      fetchedConcepts: 2,
      missingConceptIds: ['missing-concept'],
    });

    const db = new DatabaseSync(join(spaceDir(outDir), 'contentful-unified.db'));
    try {
      assert.deepEqual(
        db
          .prepare('SELECT tag_id, name FROM tags ORDER BY tag_id')
          .all()
          .map((row) => ({ ...row })),
        [
          { tag_id: 'asset-tag', name: 'Asset tag' },
          { tag_id: 'entry-tag', name: 'Entry tag' },
        ],
      );
      assert.deepEqual(
        db
          .prepare('SELECT concept_id, pref_label FROM taxonomy_concepts ORDER BY concept_id')
          .all()
          .map((row) => ({ ...row })),
        [
          { concept_id: 'asset-concept', pref_label: '{"en-US":"Asset concept"}' },
          { concept_id: 'entry-concept', pref_label: '{"en-US":"Entry concept"}' },
        ],
      );
    } finally {
      db.close();
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space refreshes a legacy database and persists referenced metadata', async () => {
  const page = {
    sys: { id: 'page-entry', contentType: { sys: { id: 'page' } } },
    fields: {},
    metadata: {
      tags: [{ sys: { id: 'page-tag' } }],
      concepts: [{ sys: { id: 'page-concept' } }],
    },
  };
  const stub = await startStub(
    { entries: { status: 200 } },
    {
      entriesByContentType: { article: [], page: [page] },
      metadata: {
        tags: [{ sys: { id: 'page-tag' }, name: 'Page tag', visibility: 'public' }],
        concepts: [{ sys: { id: 'page-concept' }, uri: 'https://example.com/page', prefLabel: 'Page concept' }],
      },
    },
  );
  const dir = mkdtempSync(join(tmpdir(), 'exo-fetch-refresh-'));
  const dbPath = join(dir, 'contentful-unified.db');
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE content_type (content_type_id TEXT PRIMARY KEY);
    CREATE TABLE entries (
      entry_id TEXT PRIMARY KEY, content_type_id TEXT, sys_type TEXT,
      sys_created_at TEXT, sys_updated_at TEXT, sys_first_published_at TEXT, sys_published_at TEXT,
      sys_version INTEGER, sys_published_version INTEGER, sys_published_counter INTEGER,
      space_id TEXT, environment_id TEXT, created_by_id TEXT, updated_by_id TEXT, published_by_id TEXT,
      metadata_json TEXT, raw_json TEXT NOT NULL, ingested_at TEXT,
      FOREIGN KEY (content_type_id) REFERENCES content_type(content_type_id)
    );
    CREATE TABLE entry_fields (
      entry_id TEXT NOT NULL, field_key TEXT NOT NULL, locale TEXT NOT NULL,
      value_type TEXT NOT NULL, value_json TEXT NOT NULL, ingested_at TEXT,
      UNIQUE (entry_id, field_key, locale), FOREIGN KEY (entry_id) REFERENCES entries(entry_id) ON DELETE CASCADE
    );
  `);
  db.prepare('INSERT INTO content_type VALUES (?)').run('article');
  db.prepare('INSERT INTO content_type VALUES (?)').run('page');
  db.prepare('INSERT INTO content_type VALUES (?)').run('other');
  db.prepare('INSERT INTO entries (entry_id, content_type_id, raw_json) VALUES (?, ?, ?)').run(
    'stale',
    'article',
    '{}',
  );
  db.prepare('INSERT INTO entries (entry_id, content_type_id, raw_json) VALUES (?, ?, ?)').run('keep', 'other', '{}');
  db.prepare(
    'INSERT INTO entry_fields (entry_id, field_key, locale, value_type, value_json) VALUES (?, ?, ?, ?, ?)',
  ).run('stale', 'title', 'en-US', 'string', '"old"');
  db.close();

  try {
    const run = await runTool(
      FETCH_SPACE,
      ['--refresh-db', dbPath, '--content-type', 'article', '--content-type', 'page'],
      stub.port,
    );
    assert.equal(run.status, 0, run.stderr);
    const refreshed = new DatabaseSync(dbPath);
    assert.deepEqual(
      refreshed
        .prepare('SELECT entry_id, content_type_id FROM entries ORDER BY entry_id')
        .all()
        .map((row) => ({ ...row })),
      [
        { entry_id: 'keep', content_type_id: 'other' },
        { entry_id: 'page-entry', content_type_id: 'page' },
      ],
    );
    assert.equal(
      refreshed.prepare('SELECT COUNT(*) AS count FROM entry_fields WHERE entry_id = ?').get('stale')?.count,
      0,
    );
    assert.equal(refreshed.prepare('SELECT name FROM tags WHERE tag_id = ?').get('page-tag')?.name, 'Page tag');
    assert.equal(
      refreshed.prepare('SELECT pref_label FROM taxonomy_concepts WHERE concept_id = ?').get('page-concept')
        ?.pref_label,
      'Page concept',
    );
    refreshed.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space records an unreadable collection as unavailable, not as zero, and keeps going', async () => {
  const stub = await startStub({ ...FETCH_ROUTES, experiences: { status: 404 } });
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-out-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port);

    // A space without ExO enabled is the normal first-run state, so the fetch must still succeed.
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /UNAVAILABLE — \/experiences is not served for this space/);
    assert.doesNotMatch(run.stdout, /Fetching experiences\.\.\. 0 found/);

    const dir = spaceDir(outDir);
    const summary = readFileSync(join(dir, 'summary.json'), 'utf8');
    assert.match(summary, /"experiences":\s*\{\s*"status":\s*"unavailable"/);
    assert.doesNotMatch(summary, /"experiences":\s*\{\s*"status":\s*"ok"/);
    // No raw file, so nothing downstream can read an asserted-empty collection as fact.
    assert.equal(existsSync(join(dir, 'raw', 'experiences.json')), false);
    // The collections that did answer are still recorded normally.
    assert.match(
      summary,
      /"experienceFragments":\s*\{\s*"status":\s*"ok",\s*"collection":\s*"experience_fragments",\s*"count":\s*3\s*\}/,
    );
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space records an unavailable components collection and writes no component file', async () => {
  const stub = await startStub({ ...FETCH_ROUTES, components: { status: 404 } });
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-out-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port);

    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /UNAVAILABLE — \/components is not served for this space/);
    assert.match(run.stdout, /recorded as unavailable, not 0/);

    const dir = spaceDir(outDir);
    const summary = readFileSync(join(dir, 'summary.json'), 'utf8');
    assert.match(summary, /"components":\s*\{\s*"status":\s*"unavailable"/);
    assert.equal(existsSync(join(dir, 'raw', 'component-types.json')), false);
    // Data Assemblies are found through links on components, so their count is not a reliable zero
    // either and must not be recorded as a clean one.
    assert.match(summary, /"dataAssemblies":\s*\{\s*"status":\s*"unavailable"/);
    assert.equal(existsSync(join(dir, 'raw', 'data-assemblies.json')), false);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space records a page-filling ExO collection as truncated and writes no raw file', async () => {
  // The pre-fix reader paginated with `skip`, which the server ignores, so a collection at or above the
  // page size looped forever accumulating duplicates instead of terminating.
  const stub = await startStub({ ...FETCH_ROUTES, experience_fragments: { status: 200, count: 1000 } });
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-out-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port);

    // The snapshot is still written, with an honest record, but a run that could not read a collection
    // in full must not exit 0: the DB records that collection as 0 because the raw file was withheld.
    assert.equal(run.status, 1, 'an incomplete snapshot must not report success');
    assert.match(run.stdout, /TRUNCATED — \/experience_fragments filled the 1000-item page/);
    assert.match(run.stderr, /this snapshot is incomplete/);

    const dir = spaceDir(outDir);
    const summary = readFileSync(join(dir, 'summary.json'), 'utf8');
    assert.match(summary, /"experienceFragments":\s*\{\s*"status":\s*"truncated"/);
    assert.equal(existsSync(join(dir, 'raw', 'fragments.json')), false);
    // One request only. Paging would have re-read the same page.
    assert.equal(stub.requests.filter((r) => r.collection === 'experience_fragments').length, 1);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space uses cursor pagination for CMA collections', async () => {
  // The client must recover from a rate limit itself. CMA returns pages.next as a relative URL, and
  // the fetcher must extract only its cursor token.
  const stub = await startStub(FETCH_ROUTES, { paginateEntries: true, rateLimitOnce: 'entries' });
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-out-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port);

    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /Fetched 1500 entries/);
    assert.equal(stub.requests.filter((r) => r.collection === 'entries').length, 3);
    assert.match(stub.requests.filter((r) => r.collection === 'entries')[2]?.url ?? '', /pageNext=1000/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space pages assets after a rate limit without changing the cursor token', async () => {
  const stub = await startStub(FETCH_ROUTES, { paginateAssets: true, rateLimitOnce: 'assets' });
  const outDir = mkdtempSync(join(tmpdir(), 'env-fetch-assets-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port);
    assert.equal(run.status, 0, run.stderr);
    const requests = stub.requests.filter((request) => request.collection === 'assets');
    assert.equal(requests.length, 3);
    assert.match(requests[2].url, /pageNext=1000/);
    const db = new DatabaseSync(join(spaceDir(outDir), 'contentful-unified.db'), { readOnly: true });
    try {
      assert.equal(db.prepare('SELECT COUNT(*) AS count FROM assets').get()?.count, 1500);
    } finally {
      db.close();
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});

test('fetch-space still fails loudly on a status that is not 404 or 403', async () => {
  const stub = await startStub({ ...FETCH_ROUTES, experiences: { status: 503 } });
  const outDir = mkdtempSync(join(tmpdir(), 'exo-fetch-out-'));
  try {
    const run = await runTool(FETCH_SPACE, ['--out-dir', outDir], stub.port);

    assert.notEqual(run.status, 0, 'a 503 must not be degraded into unavailable');
    assert.match(run.stderr, /HTTP 503/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    await stub.close();
  }
});
