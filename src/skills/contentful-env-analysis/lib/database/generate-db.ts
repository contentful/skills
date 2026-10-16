import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { dirname, join, resolve } from 'node:path';

type JsonObject = Record<string, unknown>;

const json = (value: unknown) => JSON.stringify(value);
const bool = (value: unknown) => (value == null ? null : value ? 1 : 0);
const record = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {};
const id = (value: unknown) => String(record(value).id ?? '');
const sys = (value: unknown) => record(record(value).sys);
const linkId = (value: unknown) => id(sys(value));
const resourceLinkId = (value: unknown) =>
  linkId(value) ||
  String(sys(value).urn ?? '')
    .split('/')
    .pop() ||
  null;
const valueType = (value: unknown) => (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value);
const text = (value: unknown) => (typeof value === 'string' ? value : value == null ? null : (json(value) ?? null));
const sqlValue = (value: unknown): SQLInputValue => {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Uint8Array) return value;
  return json(value) ?? null;
};
const sqlValues = (...values: unknown[]): SQLInputValue[] => values.map(sqlValue);
const metadataSchema = `
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, tag_id TEXT NOT NULL UNIQUE, name TEXT, visibility TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS taxonomy_concepts (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL UNIQUE, uri TEXT, pref_label TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
`;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeSummary(path: string, value: unknown): void {
  const temporary = mkdtempSync(join(dirname(path), '.summary-'));
  try {
    const file = join(temporary, 'summary.json');
    writeFileSync(file, JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
    renameSync(file, path);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function readArray(path: string | undefined, label: string): JsonObject[] {
  if (!path || !existsSync(path)) return [];
  const value = readJson(path);
  if (!Array.isArray(value)) throw new Error(`${label} JSON must be an array`);
  return value.filter((item): item is JsonObject => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

function items(path: string): JsonObject[] {
  if (!existsSync(path)) return [];
  const parsed = readJson(path);
  const value = record(parsed);
  const list = Array.isArray(value.items) ? value.items : Array.isArray(parsed) ? parsed : [];
  return list.filter((item): item is JsonObject => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg?.startsWith('--')) args.set(arg, argv[i + 1] ?? '');
  }
  const source = args.get('--source-dir');
  const contentTypesDir = args.get('--content-types-dir');
  if (!source && !contentTypesDir) throw new Error('--source-dir or --content-types-dir is required');
  const dbPath = args.get('--db-path');
  if (!dbPath) throw new Error('--db-path is required');
  return { args, source, contentTypesDir, dbPath: resolve(dbPath) };
}

const schema = `
PRAGMA foreign_keys = ON;
CREATE TABLE content_type (id INTEGER PRIMARY KEY AUTOINCREMENT, content_type_id TEXT NOT NULL UNIQUE, name TEXT, description TEXT, display_field TEXT, sys_type TEXT, sys_revision INTEGER, sys_created_at TEXT, sys_updated_at TEXT, sys_urn TEXT, space_id TEXT, environment_id TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE field (id INTEGER PRIMARY KEY AUTOINCREMENT, content_type_id TEXT NOT NULL, field_id TEXT NOT NULL, internal_field_id TEXT, position INTEGER NOT NULL, api_name TEXT, name TEXT, field_type TEXT, link_type TEXT, localized INTEGER, required INTEGER, disabled INTEGER, omitted INTEGER, validations_json TEXT, items_json TEXT, default_value_json TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(content_type_id, field_id), FOREIGN KEY(content_type_id) REFERENCES content_type(content_type_id) ON DELETE CASCADE);
CREATE TABLE entries (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id TEXT NOT NULL UNIQUE, content_type_id TEXT, sys_type TEXT, sys_created_at TEXT, sys_updated_at TEXT, sys_first_published_at TEXT, sys_published_at TEXT, sys_version INTEGER, sys_published_version INTEGER, sys_published_counter INTEGER, space_id TEXT, environment_id TEXT, created_by_id TEXT, updated_by_id TEXT, published_by_id TEXT, metadata_json TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE published_entries AS SELECT * FROM entries WHERE 0;
CREATE TABLE entry_fields (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id TEXT NOT NULL, field_key TEXT NOT NULL, locale TEXT NOT NULL, value_type TEXT NOT NULL, value_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(entry_id, field_key, locale), FOREIGN KEY(entry_id) REFERENCES entries(entry_id) ON DELETE CASCADE);
CREATE TABLE published_entry_fields AS SELECT * FROM entry_fields WHERE 0;
CREATE TABLE assets (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id TEXT NOT NULL UNIQUE, sys_type TEXT, sys_created_at TEXT, sys_updated_at TEXT, sys_first_published_at TEXT, sys_published_at TEXT, sys_version INTEGER, sys_published_version INTEGER, sys_published_counter INTEGER, space_id TEXT, environment_id TEXT, created_by_id TEXT, updated_by_id TEXT, published_by_id TEXT, metadata_json TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE asset_fields (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id TEXT NOT NULL, field_key TEXT NOT NULL, locale TEXT NOT NULL, value_type TEXT NOT NULL, value_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(asset_id, field_key, locale), FOREIGN KEY(asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE);
CREATE TABLE component (id INTEGER PRIMARY KEY AUTOINCREMENT, component_id TEXT NOT NULL UNIQUE, name TEXT, description TEXT, sys_type TEXT, sys_version INTEGER, sys_created_at TEXT, sys_updated_at TEXT, variant TEXT, variant_type TEXT, variant_dimension TEXT, space_id TEXT, environment_id TEXT, is_coded INTEGER NOT NULL DEFAULT 1, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE component_property (id INTEGER PRIMARY KEY AUTOINCREMENT, component_id TEXT NOT NULL, property_id TEXT NOT NULL, position INTEGER NOT NULL, kind TEXT NOT NULL, name TEXT, property_type TEXT, required INTEGER, validations_json TEXT, default_value_json TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(component_id, property_id, kind), FOREIGN KEY(component_id) REFERENCES component(component_id) ON DELETE CASCADE);
CREATE TABLE experience_template (id INTEGER PRIMARY KEY AUTOINCREMENT, experience_template_id TEXT NOT NULL UNIQUE, name TEXT, description TEXT, sys_type TEXT, sys_version INTEGER, sys_created_at TEXT, sys_updated_at TEXT, space_id TEXT, environment_id TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE experience_template_property (id INTEGER PRIMARY KEY AUTOINCREMENT, experience_template_id TEXT NOT NULL, property_id TEXT NOT NULL, position INTEGER NOT NULL, kind TEXT NOT NULL, name TEXT, property_type TEXT, required INTEGER, validations_json TEXT, default_value_json TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(experience_template_id, property_id, kind));
CREATE TABLE exo_experience (id INTEGER PRIMARY KEY AUTOINCREMENT, experience_id TEXT NOT NULL UNIQUE, name TEXT, experience_template_id TEXT, sys_version INTEGER, sys_created_at TEXT, sys_updated_at TEXT, space_id TEXT, environment_id TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE exo_fragment (id INTEGER PRIMARY KEY AUTOINCREMENT, fragment_id TEXT NOT NULL UNIQUE, name TEXT, component_id TEXT, sys_version INTEGER, sys_created_at TEXT, sys_updated_at TEXT, space_id TEXT, environment_id TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE exo_data_assembly (id INTEGER PRIMARY KEY AUTOINCREMENT, data_assembly_id TEXT NOT NULL UNIQUE, name TEXT, description TEXT, sys_version INTEGER, sys_created_at TEXT, sys_updated_at TEXT, space_id TEXT, environment_id TEXT, raw_json TEXT NOT NULL, ingested_at TEXT NOT NULL DEFAULT (datetime('now')));
${metadataSchema}
CREATE INDEX idx_entries_content_type ON entries(content_type_id);
CREATE INDEX idx_entry_fields_entry ON entry_fields(entry_id);
CREATE INDEX idx_asset_fields_asset ON asset_fields(asset_id);
CREATE INDEX idx_component_property_component ON component_property(component_id);
`;

function insertContentType(db: DatabaseSync, payload: JsonObject) {
  const s = sys(payload);
  const ctId = id(s);
  if (!ctId) return;
  const fields = Array.isArray(payload.fields) ? payload.fields : [];
  db.prepare(
    `INSERT INTO content_type (content_type_id,name,description,display_field,sys_type,sys_revision,sys_created_at,sys_updated_at,sys_urn,space_id,environment_id,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    ...sqlValues(
      ctId,
      payload.name,
      payload.description,
      payload.displayField,
      s.type,
      s.revision,
      s.createdAt,
      s.updatedAt,
      s.urn,
      linkId(s.space),
      linkId(s.environment),
      json({ ...payload, fields: undefined }),
    ),
  );
  db.prepare('DELETE FROM field WHERE content_type_id = ?').run(ctId);
  const stmt = db.prepare(
    'INSERT INTO field (content_type_id,field_id,internal_field_id,position,api_name,name,field_type,link_type,localized,required,disabled,omitted,validations_json,items_json,default_value_json,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  );
  fields.forEach((field, position) => {
    const f = record(field);
    const internalId = String(f.id ?? '');
    const apiName = String(f.apiName ?? internalId);
    if (!internalId) return;
    stmt.run(
      ...sqlValues(
        ctId,
        apiName,
        internalId,
        position,
        apiName,
        f.name,
        f.type,
        f.linkType,
        bool(f.localized),
        bool(f.required),
        bool(f.disabled),
        bool(f.omitted),
        json(f.validations ?? []),
        'items' in f ? json(f.items) : null,
        'defaultValue' in f ? json(f.defaultValue) : null,
        json(f),
      ),
    );
  });
}

function upsertFields(
  db: DatabaseSync,
  table: string,
  fieldsTable: string,
  entityId: string,
  payload: JsonObject,
  prefix: string,
) {
  const s = sys(payload);
  const fields = record(payload.fields);
  const body = { ...payload, fields: undefined };
  const columns =
    prefix === 'entry'
      ? [
          'entry_id',
          'content_type_id',
          'sys_type',
          'sys_created_at',
          'sys_updated_at',
          'sys_first_published_at',
          'sys_published_at',
          'sys_version',
          'sys_published_version',
          'sys_published_counter',
          'space_id',
          'environment_id',
          'created_by_id',
          'updated_by_id',
          'published_by_id',
          'metadata_json',
          'raw_json',
        ]
      : [
          'asset_id',
          'sys_type',
          'sys_created_at',
          'sys_updated_at',
          'sys_first_published_at',
          'sys_published_at',
          'sys_version',
          'sys_published_version',
          'sys_published_counter',
          'space_id',
          'environment_id',
          'created_by_id',
          'updated_by_id',
          'published_by_id',
          'metadata_json',
          'raw_json',
        ];
  const values =
    prefix === 'entry'
      ? [
          entityId,
          linkId(s.contentType),
          s.type ?? null,
          s.createdAt ?? null,
          s.updatedAt ?? null,
          s.firstPublishedAt ?? null,
          s.publishedAt ?? null,
          s.version ?? null,
          s.publishedVersion ?? null,
          s.publishedCounter ?? null,
          linkId(s.space),
          linkId(s.environment),
          linkId(s.createdBy),
          linkId(s.updatedBy),
          linkId(s.publishedBy),
          json(payload.metadata ?? {}),
          json(body),
        ]
      : [
          entityId,
          s.type ?? null,
          s.createdAt ?? null,
          s.updatedAt ?? null,
          s.firstPublishedAt ?? null,
          s.publishedAt ?? null,
          s.version ?? null,
          s.publishedVersion ?? null,
          s.publishedCounter ?? null,
          linkId(s.space),
          linkId(s.environment),
          linkId(s.createdBy),
          linkId(s.updatedBy),
          linkId(s.publishedBy),
          json(payload.metadata ?? {}),
          json(body),
        ];
  const key = prefix === 'entry' ? 'entry_id' : 'asset_id';
  db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(
    ...sqlValues(...values),
  );
  db.prepare(`DELETE FROM ${fieldsTable} WHERE ${key} = ?`).run(entityId);
  const stmt = db.prepare(
    `INSERT INTO ${fieldsTable} (${key},field_key,locale,value_type,value_json) VALUES (?,?,?,?,?)`,
  );
  for (const [fieldKey, localized] of Object.entries(fields)) {
    if (localized && typeof localized === 'object' && !Array.isArray(localized))
      for (const [locale, value] of Object.entries(localized as JsonObject))
        stmt.run(entityId, fieldKey, locale, valueType(value), json(value));
    else stmt.run(entityId, fieldKey, '__raw__', valueType(localized), json(localized));
  }
}

function insertSimple(db: DatabaseSync, table: string, key: string, payload: JsonObject, fields: string[]) {
  const s = sys(payload);
  const entityId = id(s);
  if (!entityId) return;
  const systemFields: Record<string, string> = {
    sys_type: 'type',
    sys_version: 'version',
    sys_created_at: 'createdAt',
    sys_updated_at: 'updatedAt',
  };
  const resourceLinks: Record<string, string> = {
    experience_template_id: 'experienceTemplate',
    component_id: 'component',
  };
  const names = [key, ...fields, 'raw_json'];
  const values = [
    entityId,
    ...fields.map((field) => {
      if (field === 'space_id' || field === 'environment_id') return linkId(s[field.replace('_id', '')]);
      if (field in systemFields) return s[systemFields[field]!] ?? null;
      if (field in resourceLinks) return resourceLinkId(s[resourceLinks[field]!]);
      if (field === 'is_coded') return 'componentTree' in payload ? 0 : 1;
      if (field === 'pref_label') return text(payload.prefLabel);
      return payload[field] ?? s[field] ?? null;
    }),
    json(payload),
  ];
  db.prepare(`INSERT OR REPLACE INTO ${table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`).run(
    ...sqlValues(...values),
  );
}

function insertProperties(
  db: DatabaseSync,
  table: string,
  parentColumn: string,
  parentId: string,
  payload: JsonObject,
) {
  db.prepare(`DELETE FROM ${table} WHERE ${parentColumn} = ?`).run(parentId);
  const statement = db.prepare(
    `INSERT INTO ${table} (${parentColumn},property_id,position,kind,name,property_type,required,validations_json,default_value_json,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?)`,
  );
  let position = 0;
  for (const [kind, key] of [
    ['content_property', 'contentProperties'],
    ['design_property', 'designProperties'],
    ['slot', 'slots'],
  ] as const) {
    for (const property of Array.isArray(payload[key]) ? payload[key] : []) {
      const item = record(property);
      if (!item.id) continue;
      statement.run(
        ...sqlValues(
          parentId,
          item.id,
          position++,
          kind,
          item.name,
          item.type,
          bool(item.required),
          'validations' in item ? json(item.validations) : null,
          'default' in item ? json(item.default) : null,
          json(item),
        ),
      );
    }
  }
}

export function buildDatabase(
  sourceDir: string,
  dbPath: string,
  extraFiles: { tags?: unknown[]; concepts?: unknown[] } = {},
  inputFiles: { entries?: string; publishedEntries?: string; assets?: string } = {},
) {
  mkdirSync(dirname(dbPath), { recursive: true });
  if (existsSync(dbPath)) unlinkSync(dbPath);
  const db = new DatabaseSync(dbPath);
  db.exec(schema);
  const contentTypePaths = existsSync(join(sourceDir, 'content-types'))
    ? readdirSync(join(sourceDir, 'content-types')).map((name) => join(sourceDir, 'content-types', name))
    : readdirSync(sourceDir)
        .filter((name) => name.startsWith('ct-') && name.endsWith('.json'))
        .map((name) => join(sourceDir, name));
  for (const path of contentTypePaths) {
    const value = readJson(path);
    const payloads = Array.isArray(value)
      ? value
      : Array.isArray(record(value).items)
        ? (record(value).items as unknown[])
        : [value];
    payloads.forEach((payload) => {
      if (payload && typeof payload === 'object' && !Array.isArray(payload))
        insertContentType(db, payload as JsonObject);
    });
  }
  for (const entry of readArray(inputFiles.entries ?? join(sourceDir, 'entries.json'), 'Entries'))
    if (id(sys(entry))) upsertFields(db, 'entries', 'entry_fields', id(sys(entry)), entry, 'entry');
  for (const entry of readArray(
    inputFiles.publishedEntries ?? join(sourceDir, 'published-entries.json'),
    'Published entries',
  ))
    if (id(sys(entry))) upsertFields(db, 'published_entries', 'published_entry_fields', id(sys(entry)), entry, 'entry');
  for (const asset of readArray(inputFiles.assets ?? join(sourceDir, 'assets.json'), 'Assets'))
    if (id(sys(asset))) upsertFields(db, 'assets', 'asset_fields', id(sys(asset)), asset, 'asset');
  for (const component of items(join(sourceDir, 'component-types.json'))) {
    insertSimple(db, 'component', 'component_id', component, [
      'name',
      'description',
      'sys_type',
      'sys_version',
      'sys_created_at',
      'sys_updated_at',
      'variant',
      'variant_type',
      'variant_dimension',
      'space_id',
      'environment_id',
      'is_coded',
    ]);
    insertProperties(db, 'component_property', 'component_id', id(sys(component)), component);
  }
  for (const template of items(join(sourceDir, 'templates.json'))) {
    insertSimple(db, 'experience_template', 'experience_template_id', template, [
      'name',
      'description',
      'sys_type',
      'sys_version',
      'sys_created_at',
      'sys_updated_at',
      'space_id',
      'environment_id',
    ]);
    insertProperties(db, 'experience_template_property', 'experience_template_id', id(sys(template)), template);
  }
  for (const experience of items(join(sourceDir, 'experiences.json')))
    insertSimple(db, 'exo_experience', 'experience_id', experience, [
      'name',
      'experience_template_id',
      'sys_version',
      'sys_created_at',
      'sys_updated_at',
      'space_id',
      'environment_id',
    ]);
  for (const fragment of items(join(sourceDir, 'fragments.json')))
    insertSimple(db, 'exo_fragment', 'fragment_id', fragment, [
      'name',
      'component_id',
      'sys_version',
      'sys_created_at',
      'sys_updated_at',
      'space_id',
      'environment_id',
    ]);
  for (const assembly of items(join(sourceDir, 'data-assemblies.json')))
    insertSimple(db, 'exo_data_assembly', 'data_assembly_id', assembly, [
      'name',
      'description',
      'sys_version',
      'sys_created_at',
      'sys_updated_at',
      'space_id',
      'environment_id',
    ]);
  for (const tag of extraFiles.tags ?? items(join(sourceDir, 'tags.json')))
    insertSimple(db, 'tags', 'tag_id', record(tag), ['name', 'visibility']);
  for (const concept of extraFiles.concepts ?? items(join(sourceDir, 'taxonomy-concepts.json')))
    insertSimple(db, 'taxonomy_concepts', 'concept_id', record(concept), ['uri', 'pref_label']);
  const tables = [
    'content_type',
    'field',
    'entries',
    'entry_fields',
    'published_entries',
    'published_entry_fields',
    'assets',
    'asset_fields',
    'component',
    'component_property',
    'experience_template',
    'experience_template_property',
    'exo_experience',
    'exo_fragment',
    'exo_data_assembly',
    'tags',
    'taxonomy_concepts',
  ];
  const counts = Object.fromEntries(
    tables.map((table) => {
      const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
      return [table, Number(row?.count ?? 0)];
    }),
  );
  const contentTypes = db
    .prepare(
      `
    SELECT ct.content_type_id AS id, ct.name,
      (SELECT COUNT(*) FROM entries e WHERE e.content_type_id = ct.content_type_id) AS entry_count,
      (SELECT COUNT(*) FROM field f WHERE f.content_type_id = ct.content_type_id) AS field_count
    FROM content_type ct
    ORDER BY entry_count DESC, ct.content_type_id
  `,
    )
    .all();
  const summary = {
    generated_at: new Date().toISOString(),
    tables: counts,
    content_types: contentTypes,
    locales: db
      .prepare("SELECT DISTINCT locale FROM entry_fields WHERE locale != '__raw__' ORDER BY locale")
      .all()
      .map((row) => row.locale),
  };
  db.close();
  writeSummary(join(dirname(dbPath), 'summary.json'), summary);
  return summary;
}

export function refreshEntries(
  dbPath: string,
  entriesByContentType: Record<string, JsonObject[]>,
  tagsAndConcepts: { tags?: unknown[]; concepts?: unknown[] } = {},
) {
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(metadataSchema);
    for (const [contentType, entries] of Object.entries(entriesByContentType)) {
      const stale = db
        .prepare('SELECT entry_id FROM entries WHERE content_type_id = ?')
        .all(contentType)
        .map((row) => row.entry_id);
      for (const entryId of stale) {
        db.prepare('DELETE FROM entry_fields WHERE entry_id = ?').run(entryId);
        db.prepare('DELETE FROM entries WHERE entry_id = ?').run(entryId);
      }
      for (const entry of entries)
        if (id(sys(entry))) upsertFields(db, 'entries', 'entry_fields', id(sys(entry)), entry, 'entry');
    }
    for (const tag of tagsAndConcepts.tags ?? [])
      insertSimple(db, 'tags', 'tag_id', record(tag), ['name', 'visibility']);
    for (const concept of tagsAndConcepts.concepts ?? [])
      insertSimple(db, 'taxonomy_concepts', 'concept_id', record(concept), ['uri', 'pref_label']);
  } finally {
    db.close();
  }
}

export function runGenerateDb(argv = process.argv.slice(2)): number {
  try {
    const parsed = parseArgs(argv);
    const sourceDir = parsed.source ?? parsed.contentTypesDir!;
    const summaryPath = join(dirname(parsed.dbPath), 'summary.json');
    let previousSummary: JsonObject = {};
    try {
      previousSummary = record(readJson(summaryPath));
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
    const summary = buildDatabase(
      sourceDir,
      parsed.dbPath,
      {},
      {
        entries: parsed.args.get('--entries-file'),
        publishedEntries: parsed.args.get('--published-entries-file'),
        assets: parsed.args.get('--assets-file'),
      },
    );
    if (Object.keys(previousSummary).length > 0) {
      writeSummary(summaryPath, { ...previousSummary, ...summary });
    }
    console.log(`Database: ${parsed.dbPath}`);
    return 0;
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
