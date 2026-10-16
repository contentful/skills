import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { createClient } from 'contentful-management';
import type { PlainClientAPI } from 'contentful-management';
import { buildDatabase, refreshEntries } from '../database/generate-db.ts';

type JsonObject = Record<string, unknown>;
type Collection<T = JsonObject> = { items?: T[]; pages?: { next?: string }; total?: number };

const PAGE_LIMIT = 1000;
const ALPHA_HEADERS = {
  'X-Contentful-Enable-Alpha-Feature': 'new-exo-entity-types',
};

function object(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {};
}

function linkId(value: unknown) {
  const id = object(object(value).sys).id;
  return typeof id === 'string' ? id : '';
}

function envFileValues(): Record<string, string> {
  const path = process.env.CONTENTFUL_ENV_FILE;
  if (!path || !existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return [];
        const [key, ...rest] = trimmed.split('=');
        return [
          [
            key!.trim(),
            rest
              .join('=')
              .trim()
              .replace(/^['"]|['"]$/g, ''),
          ],
        ];
      }),
  );
}

function args(argv: string[]) {
  const env = envFileValues();
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg?.startsWith('--')) values.set(arg, argv[i + 1] ?? '');
  }
  const get = (flag: string, envKey: string, fallback?: string) =>
    values.get(flag) || env[envKey] || process.env[envKey] || fallback;
  return {
    token: get('--token', 'CONTENTFUL_CMA_TOKEN'),
    spaceId: get('--space-id', 'SPACE_ID'),
    environmentId: get('--environment-id', 'ENVIRONMENT_ID'),
    apiHost: get('--api-host', 'API_HOST', 'api.contentful.com')!,
    outDir: values.get('--out-dir'),
    keepDb: values.has('--keep-db'),
    skipIfPresent: values.has('--skip-if-present'),
    resultFile: values.get('--result-file'),
    refreshDb: values.get('--refresh-db'),
    contentTypes: argv.flatMap((value, index) =>
      value === '--content-type' && argv[index + 1] ? [argv[index + 1]!] : [],
    ),
  };
}

function hostUrl(host: string) {
  const value = host.replace(/\/$/, '');
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
}

function errorStatus(error: unknown): number {
  const value = object(error);
  const direct = Number(value.status || value.statusCode || object(value.response).status || 0);
  if (direct) return direct;
  const match = String(value.message ?? error).match(/(?:"status"\s*:\s*|HTTP\s+)(\d{3})/i);
  return match ? Number(match[1]) : 0;
}

async function rawGet<T>(client: PlainClientAPI, path: string, headers = ALPHA_HEADERS): Promise<T> {
  return client.raw.get<T>(path, { headers });
}

function nextPageToken(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    const token = new URL(value, 'https://api.contentful.com').searchParams.get('pageNext');
    return token ?? (value.includes('/') || value.includes('?') ? undefined : value);
  } catch {
    return value;
  }
}

async function fetchCursorCollection<T>(fetchPage: (pageNext?: string) => Promise<Collection<T>>): Promise<T[]> {
  const items: T[] = [];
  let pageNext: string | undefined;
  while (true) {
    const page = await fetchPage(pageNext);
    items.push(...(page.items ?? []));
    const next = nextPageToken(page.pages?.next);
    if (!next || next === pageNext) return items;
    pageNext = next;
  }
}

async function fetchExoCollection(client: PlainClientAPI, path: string, headers = ALPHA_HEADERS) {
  try {
    const response = await rawGet<Collection>(client, `${path}?limit=${PAGE_LIMIT}`, headers);
    const items = (response.items ?? []).filter(
      (item): item is JsonObject => Boolean(item) && typeof item === 'object',
    );
    if (items.length >= PAGE_LIMIT)
      return { items, status: 'truncated', detail: `response filled the ${PAGE_LIMIT}-item page` };
    return { items, status: 'ok' };
  } catch (error) {
    const message = formatError(error);
    if ([403, 404].includes(errorStatus(error))) return { items: [], status: 'unavailable', detail: message };
    throw error;
  }
}

export function idsFromEntries(entries: unknown[], assets: unknown[] = []): { tagIds: string[]; conceptIds: string[] } {
  const tags = new Set<string>();
  const concepts = new Set<string>();
  for (const resource of [...entries, ...assets]) {
    const metadata = object(object(resource).metadata);
    for (const link of Array.isArray(metadata.tags) ? metadata.tags : []) {
      const id = object(object(link).sys).id;
      if (typeof id === 'string') tags.add(id);
    }
    for (const link of Array.isArray(metadata.concepts) ? metadata.concepts : []) {
      const id = object(object(link).sys).id;
      if (typeof id === 'string') concepts.add(id);
    }
  }
  return { tagIds: [...tags].sort(), conceptIds: [...concepts].sort() };
}

async function fetchReferencedMetadata(
  client: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  organizationId: string,
  entries: unknown[],
  assets: unknown[] = [],
) {
  const { tagIds, conceptIds } = idsFromEntries(entries, assets);
  const fetchReferenced = async <T>(ids: string[], fetch: (id: string) => Promise<T>) => {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          return { id, item: await fetch(id) };
        } catch (error) {
          if (errorStatus(error) === 404) return { id };
          throw error;
        }
      }),
    );
    return {
      items: results.flatMap((result) => ('item' in result ? [result.item] : [])),
      missingIds: results.flatMap((result) => ('item' in result ? [] : [result.id])),
    };
  };
  const tags = await fetchReferenced(tagIds, (tagId) => client.tag.get({ spaceId, environmentId, tagId }));
  const concepts = await fetchReferenced(conceptIds, (conceptId) => client.concept.get({ organizationId, conceptId }));
  if (tags.missingIds.length) console.warn(`WARNING: referenced tags not found: ${tags.missingIds.join(', ')}`);
  if (concepts.missingIds.length) {
    console.warn(`WARNING: referenced taxonomy concepts not found: ${concepts.missingIds.join(', ')}`);
  }
  return {
    tags: tags.items,
    concepts: concepts.items,
    counts: {
      referencedTags: tagIds.length,
      fetchedTags: tags.items.length,
      missingTagIds: tags.missingIds,
      referencedConcepts: conceptIds.length,
      fetchedConcepts: concepts.items.length,
      missingConceptIds: concepts.missingIds,
    },
  };
}

function linkedDataAssemblyIds(entities: JsonObject[]): string[] {
  const ids = new Set<string>();
  for (const entity of entities) {
    for (const link of Array.isArray(entity.dataAssemblies) ? entity.dataAssemblies : []) {
      const urn = object(object(link).sys).urn;
      if (typeof urn === 'string' && urn.includes('/')) ids.add(urn.slice(urn.lastIndexOf('/') + 1));
    }
  }
  return [...ids].sort();
}

async function fetchDataAssemblies(
  client: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  templates: { items: JsonObject[]; status: string },
  components: { items: JsonObject[]; status: string },
) {
  const ids = linkedDataAssemblyIds([...templates.items, ...components.items]);
  const assemblies: JsonObject[] = [];
  const skipped: string[] = [];
  for (const dataAssemblyId of ids) {
    try {
      assemblies.push((await client.dataAssembly.get({ spaceId, environmentId, dataAssemblyId })) as JsonObject);
    } catch (error) {
      if ([403, 404].includes(errorStatus(error))) skipped.push(dataAssemblyId);
      else throw error;
    }
  }
  const readable = templates.status === 'ok' && components.status === 'ok';
  const result = {
    items: assemblies,
    status: readable && skipped.length === 0 ? 'ok' : 'unavailable',
    collection: 'data_assemblies',
    discovery: 'links on experience_templates and components, not a collection listing',
    linked: ids.length,
    fetched: assemblies.length,
    ...(readable && skipped.length ? { detail: `linked assemblies not found: ${skipped.join(', ')}` } : {}),
    ...(!readable ? { detail: 'at least one link source could not be read, so the set of links is unknown' } : {}),
  };
  return result;
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8');
}

function collectionSummary(
  collection: string,
  result: { items: JsonObject[]; status: string; detail?: string; fetched?: number },
) {
  const count = result.fetched ?? result.items.length;
  const countField = collection === 'data_assemblies' ? 'fetched' : 'count';
  return {
    status: result.status,
    collection,
    ...(result.status === 'ok' ? { [countField]: count } : {}),
    ...(result.detail ? { detail: result.detail } : {}),
  };
}

function formatError(error: unknown) {
  const value = object(error);
  const status = errorStatus(error);
  return status
    ? `HTTP ${status}: ${String(value.message ?? error)}`
    : error instanceof Error
      ? error.message
      : String(error);
}

export async function fetchSpace(options: ReturnType<typeof args>): Promise<number> {
  const missing = [
    ['token', options.token],
    ['space-id', options.spaceId],
    ['environment-id', options.environmentId],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) throw new Error(`missing ${missing.join(', ')}; provide flags or the working .env`);
  const token = options.token!;
  const spaceId = options.spaceId!;
  const environmentId = options.environmentId!;
  if (options.skipIfPresent && options.outDir && existsSync(join(resolve(options.outDir), 'contentful-unified.db'))) {
    const summaryPath = join(resolve(options.outDir), 'summary.json');
    let summary: JsonObject;
    try {
      summary = existsSync(summaryPath) ? object(JSON.parse(readFileSync(summaryPath, 'utf8'))) : {};
    } catch {
      throw new Error(`existing snapshot has no valid summary.json: ${resolve(options.outDir)}`);
    }
    if (!Object.keys(summary).length)
      throw new Error(`existing snapshot has no valid summary.json: ${resolve(options.outDir)}`);
    if (summary.space_id !== spaceId || summary.environment_id !== environmentId)
      throw new Error(`existing snapshot does not belong to ${spaceId}/${environmentId}: ${options.outDir}`);
    console.log(`Using existing snapshot: ${resolve(options.outDir)}`);
    if (options.resultFile) writeFileSync(options.resultFile, resolve(options.outDir), 'utf8');
    return 0;
  }
  const parsedHost = new URL(hostUrl(options.apiHost));
  const localHttp =
    parsedHost.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsedHost.hostname);
  if (parsedHost.protocol !== 'https:' && !localHttp) {
    throw new Error('API_HOST must use HTTPS; HTTP is allowed only for explicit loopback hosts used in local testing');
  }
  const client = createClient({
    accessToken: token,
    host: parsedHost.host,
    insecure: localHttp,
    retryLimit: 5,
    throttle: '70%',
    headers: ALPHA_HEADERS,
  });
  const space = await client.space.get({ spaceId });
  const organizationId = linkId(object(space.sys).organization);
  if (!organizationId) throw new Error(`space ${spaceId} did not return sys.organization.sys.id`);
  const base = `/spaces/${encodeURIComponent(spaceId)}/environments/${encodeURIComponent(environmentId)}`;
  if (options.refreshDb) {
    if (!existsSync(options.refreshDb)) throw new Error(`SQLite db not found: ${options.refreshDb}`);
    const fetched: Record<string, JsonObject[]> = {};
    for (const contentType of new Set(options.contentTypes)) {
      const entries = await fetchCursorCollection((pageNext) => {
        const query = new URLSearchParams({
          cursor: 'true',
          limit: String(PAGE_LIMIT),
          content_type: contentType,
          ...(pageNext ? { pageNext } : {}),
        });
        return rawGet<Collection>(client, `${base}/entries?${query}`);
      });
      fetched[contentType] = entries;
    }
    const entries = Object.values(fetched).flat();
    const tagsAndConcepts = await fetchReferencedMetadata(client, spaceId, environmentId, organizationId, entries);
    refreshEntries(resolve(options.refreshDb), fetched, tagsAndConcepts);
    console.log(
      `Refreshed ${Object.values(fetched).reduce((count, entries) => count + entries.length, 0)} entries in ${options.refreshDb}`,
    );
    return 0;
  }
  const spaceName = space.name || spaceId;
  const outRoot = resolve(options.outDir || join(dirname(new URL(import.meta.url).pathname), '..', '..', '..', 'data'));
  mkdirSync(outRoot, { recursive: true });
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 15);
  const environmentSlug = environmentId.replace(/[^a-zA-Z0-9_-]+/g, '-');
  const dataDir = join(
    outRoot,
    `${String(spaceName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${environmentSlug}-${stamp}`,
  );
  const rawDir = join(dataDir, 'raw');
  mkdirSync(rawDir, { recursive: true });
  if (options.skipIfPresent && existsSync(join(dataDir, 'contentful-unified.db'))) return 0;

  console.log(`Space: ${spaceName} (${spaceId}), environment: ${environmentId}`);
  console.log(`Output: ${dataDir}`);
  const contentTypes = await fetchCursorCollection((pageNext) => {
    const query = new URLSearchParams({ cursor: 'true', limit: String(PAGE_LIMIT), ...(pageNext ? { pageNext } : {}) });
    return rawGet<Collection>(client, `${base}/content_types?${query}`);
  });
  const assets = await fetchCursorCollection((pageNext) => {
    const query = new URLSearchParams({ cursor: 'true', limit: String(PAGE_LIMIT), ...(pageNext ? { pageNext } : {}) });
    return rawGet<Collection>(client, `${base}/assets?${query}`);
  });
  const entries = await fetchCursorCollection((pageNext) => {
    const query = new URLSearchParams({ cursor: 'true', limit: String(PAGE_LIMIT), ...(pageNext ? { pageNext } : {}) });
    return rawGet<Collection>(client, `${base}/entries?${query}`);
  });
  const tagsAndConcepts = await fetchReferencedMetadata(
    client,
    spaceId,
    environmentId,
    organizationId,
    entries,
    assets,
  );
  writeJson(join(rawDir, 'ct-all.json'), { items: contentTypes });
  writeJson(join(rawDir, 'entries.json'), entries);
  writeJson(join(rawDir, 'assets.json'), assets);
  writeJson(join(rawDir, 'tags.json'), { items: tagsAndConcepts.tags });
  writeJson(join(rawDir, 'taxonomy-concepts.json'), { items: tagsAndConcepts.concepts });

  const componentTypes = await fetchExoCollection(client, `${base}/components`);
  const templates = await fetchExoCollection(client, `${base}/experience_templates`);
  const dataAssemblies = await fetchDataAssemblies(client, spaceId, environmentId, templates, componentTypes);
  const experiences = await fetchExoCollection(client, `${base}/experiences`);
  const fragments = await fetchExoCollection(client, `${base}/experience_fragments`);
  for (const [name, collection] of [
    ['component-types.json', componentTypes],
    ['templates.json', templates],
    ['data-assemblies.json', dataAssemblies],
    ['experiences.json', experiences],
    ['fragments.json', fragments],
  ] as const) {
    if (collection.status === 'ok') writeJson(join(rawDir, name), { items: collection.items });
    else if (collection.status === 'truncated')
      console.log(
        `TRUNCATED — /${name.replace('.json', '').replace('component-types', 'components').replace('templates', 'experience_templates').replace('fragments', 'experience_fragments')} filled the ${PAGE_LIMIT}-item page`,
      );
    else
      console.log(
        `UNAVAILABLE — /${name.replace('.json', '').replace('component-types', 'components').replace('templates', 'experience_templates').replace('fragments', 'experience_fragments')} is not served for this space; recorded as unavailable, not 0`,
      );
  }

  const dbPath = join(dataDir, 'contentful-unified.db');
  const summary = buildDatabase(rawDir, dbPath);
  const exoEntities = {
    components: collectionSummary('components', componentTypes),
    experienceTemplates: collectionSummary('experience_templates', templates),
    dataAssemblies: collectionSummary('data_assemblies', dataAssemblies),
    experiences: collectionSummary('experiences', experiences),
    experienceFragments: collectionSummary('experience_fragments', fragments),
  };
  Object.assign(summary, {
    space_id: spaceId,
    space_name: spaceName,
    environment_id: environmentId,
    api_host: options.apiHost,
    metadata: tagsAndConcepts.counts,
    ...exoEntities,
    exo_entities: exoEntities,
  });
  writeJson(join(dataDir, 'summary.json'), summary);
  if (!options.keepDb) writeFileSync(`${dbPath}.gz`, gzipSync(readFileSync(dbPath)));
  if (!options.keepDb) await import('node:fs/promises').then(({ unlink }) => unlink(dbPath));
  if (options.resultFile) writeFileSync(options.resultFile, dataDir, 'utf8');
  if (
    Object.values({ componentTypes, templates, dataAssemblies, experiences, fragments }).some(
      (collection) => collection.status === 'truncated',
    )
  ) {
    console.error('ERROR: this snapshot is incomplete because an ExO collection was truncated');
    return 1;
  }
  console.log(
    `Fetched ${entries.length} entries, ${tagsAndConcepts.tags.length} tags, ${tagsAndConcepts.concepts.length} taxonomy concepts`,
  );
  return 0;
}

export async function runFetchSpace(argv = process.argv.slice(2)): Promise<number> {
  try {
    return await fetchSpace(args(argv));
  } catch (error) {
    console.error(`ERROR: ${formatError(error)}`);
    return 1;
  }
}
