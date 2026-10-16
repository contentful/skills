import { existsSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLOutputValue } from 'node:sqlite';
import { join } from 'node:path';

import { parseArgs, requiredStringArg, stringArg } from '../shared/args.ts';

interface ContentTypeInventory {
  id: string;
  name: string;
  entryCount: number;
  publishedEntryCount: number;
  draftOnlyEntryCount: number;
  potentiallyUnreferencedEntryCount: number;
  fieldCount: number;
}

interface RichTextFieldInventory {
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  entryCount: number;
  populatedEntryCount: number;
  emptyEntryCount: number;
  entryLinkCount: number;
}

interface ComponentInventory {
  id: string;
  name: string;
  kind: 'coded' | 'composite';
  contentPropertyCount: number;
  designPropertyCount: number;
  slotCount: number;
  fragmentCount: number;
}

interface ExperienceTemplateInventory {
  id: string;
  name: string;
  contentPropertyCount: number;
  designPropertyCount: number;
  slotCount: number;
  experienceCount: number;
}

interface ExoInstanceInventory {
  id: string;
  name: string;
  schemaId: string | null;
  schemaName: string | null;
}

interface DataAssemblyInventory {
  id: string;
  name: string;
}

export interface SpaceInventory {
  spaceId: string | null;
  spaceName: string | null;
  environmentId: string | null;
  apiHost: string | null;
  contentTypeCount: number;
  entryCount: number;
  publishedEntryCount: number;
  draftOnlyEntryCount: number;
  assetCount: number;
  tagCount: number;
  taxonomyConceptCount: number;
  componentCount: number;
  componentCodedCount: number;
  componentCompositeCount: number;
  experienceTemplateCount: number;
  experienceCount: number;
  fragmentCount: number;
  exoDataAssemblyCount: number;
  componentNames: string[];
  components: ComponentInventory[];
  experienceTemplates: ExperienceTemplateInventory[];
  experiences: ExoInstanceInventory[];
  fragments: ExoInstanceInventory[];
  dataAssemblies: DataAssemblyInventory[];
  contentTypes: ContentTypeInventory[];
  richTextFields: RichTextFieldInventory[];
  locales: string[];
  dbPath: string;
  dbPresent: boolean;
  summaryPresent: boolean;
  warnings: string[];
  exoCollectionStatus?: Partial<
    Record<'components' | 'experienceTemplates' | 'experiences' | 'fragments' | 'dataAssemblies', string>
  >;
}

type StringMap = Record<string, string>;

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function numberValue(value: SQLOutputValue | undefined): number {
  return typeof value === 'number' || typeof value === 'bigint' ? Number(value) : 0;
}

function readSummary(path: string, warnings: string[]): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    warnings.push('summary.json is present but could not be parsed.');
    return {};
  }
}

function collectionStatus(summary: Record<string, unknown>, key: string): string | undefined {
  const value = summary[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return stringValue((value as Record<string, unknown>).status) ?? undefined;
}

export function loadEnvironmentFile(path: string): StringMap {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return [];
        const [key, ...rest] = trimmed.split('=');
        const raw = rest.join('=').trim();
        const value =
          raw.length >= 2 && raw[0] === raw.at(-1) && (raw[0] === '"' || raw[0] === "'") ? raw.slice(1, -1) : raw;
        return [[key!.trim(), value]];
      }),
  );
}

function tableExists(db: DatabaseSync, name: string): boolean {
  return db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined;
}

function scalar(db: DatabaseSync, sql: string, ...params: SQLOutputValue[]): number {
  try {
    const row = db.prepare(sql).get(...params);
    return numberValue(row ? Object.values(row)[0] : undefined);
  } catch {
    return 0;
  }
}

function referencedEntryIds(db: DatabaseSync): Set<string> {
  return new Set(
    db
      .prepare(
        `
    SELECT DISTINCT json_extract(node.value, '$.sys.id') AS entry_id
    FROM entry_fields field, json_tree(field.value_json) node
    WHERE node.type = 'object'
      AND json_extract(node.value, '$.sys.linkType') = 'Entry'
      AND json_type(node.value, '$.sys.id') = 'text'
  `,
      )
      .all()
      .flatMap((row) => (typeof row.entry_id === 'string' ? [row.entry_id] : [])),
  );
}

export function gatherInventory(dataDir: string): SpaceInventory {
  const dbPath = join(dataDir, 'contentful-unified.db');
  const summaryPath = join(dataDir, 'summary.json');
  const warnings: string[] = [];
  const summary = readSummary(summaryPath, warnings);
  const inventory: SpaceInventory = {
    spaceId: stringValue(summary.space_id),
    spaceName: stringValue(summary.space_name),
    environmentId: stringValue(summary.environment_id),
    apiHost: stringValue(summary.api_host),
    contentTypeCount: 0,
    entryCount: 0,
    publishedEntryCount: 0,
    draftOnlyEntryCount: 0,
    assetCount: 0,
    tagCount: 0,
    taxonomyConceptCount: 0,
    componentCount: 0,
    componentCodedCount: 0,
    componentCompositeCount: 0,
    experienceTemplateCount: 0,
    experienceCount: 0,
    fragmentCount: 0,
    exoDataAssemblyCount: 0,
    componentNames: [],
    components: [],
    experienceTemplates: [],
    experiences: [],
    fragments: [],
    dataAssemblies: [],
    contentTypes: [],
    richTextFields: [],
    locales: [],
    dbPath,
    dbPresent: existsSync(dbPath),
    summaryPresent: existsSync(summaryPath),
    warnings,
    exoCollectionStatus: {
      components: collectionStatus(summary, 'components'),
      experienceTemplates: collectionStatus(summary, 'experienceTemplates'),
      experiences: collectionStatus(summary, 'experiences'),
      fragments: collectionStatus(summary, 'experienceFragments'),
      dataAssemblies: collectionStatus(summary, 'dataAssemblies'),
    },
  };

  if (!inventory.dbPresent) {
    warnings.push(`Database not found at ${dbPath}.`);
    return inventory;
  }

  let db: DatabaseSync;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true, allowExtension: false });
  } catch (error) {
    warnings.push(`Database could not be opened: ${error instanceof Error ? error.message : String(error)}`);
    return inventory;
  }

  try {
    inventory.contentTypeCount = scalar(db, 'SELECT COUNT(*) FROM content_type');
    inventory.entryCount = scalar(db, 'SELECT COUNT(*) FROM entries');
    inventory.publishedEntryCount = scalar(db, 'SELECT COUNT(*) FROM entries WHERE sys_published_at IS NOT NULL');
    inventory.draftOnlyEntryCount = scalar(db, 'SELECT COUNT(*) FROM entries WHERE sys_published_at IS NULL');
    inventory.assetCount = scalar(db, 'SELECT COUNT(*) FROM assets');
    if (tableExists(db, 'tags')) inventory.tagCount = scalar(db, 'SELECT COUNT(*) FROM tags');
    if (tableExists(db, 'taxonomy_concepts')) {
      inventory.taxonomyConceptCount = scalar(db, 'SELECT COUNT(*) FROM taxonomy_concepts');
    }
    inventory.componentCount = scalar(db, 'SELECT COUNT(*) FROM component');
    if (tableExists(db, 'component')) {
      inventory.componentCodedCount = scalar(db, 'SELECT COUNT(*) FROM component WHERE is_coded = 1');
      inventory.componentCompositeCount = scalar(db, 'SELECT COUNT(*) FROM component WHERE is_coded = 0');
      inventory.componentNames = db
        .prepare('SELECT name FROM component WHERE name IS NOT NULL ORDER BY name LIMIT 5')
        .all()
        .flatMap((row) => (typeof row.name === 'string' ? [row.name] : []));
      inventory.components = db
        .prepare(
          `
        SELECT c.component_id, c.name, c.is_coded,
          SUM(CASE WHEN cp.kind = 'content_property' THEN 1 ELSE 0 END) AS content_properties,
          SUM(CASE WHEN cp.kind = 'design_property' THEN 1 ELSE 0 END) AS design_properties,
          SUM(CASE WHEN cp.kind = 'slot' THEN 1 ELSE 0 END) AS slots,
          (SELECT COUNT(*) FROM exo_fragment f WHERE f.component_id = c.component_id) AS fragments
        FROM component c
        LEFT JOIN component_property cp ON cp.component_id = c.component_id
        GROUP BY c.component_id, c.name, c.is_coded
        ORDER BY c.name, c.component_id
      `,
        )
        .all()
        .flatMap((row) =>
          typeof row.component_id === 'string'
            ? [
                {
                  id: row.component_id,
                  name: stringValue(row.name) ?? row.component_id,
                  kind: numberValue(row.is_coded) === 1 ? ('coded' as const) : ('composite' as const),
                  contentPropertyCount: numberValue(row.content_properties),
                  designPropertyCount: numberValue(row.design_properties),
                  slotCount: numberValue(row.slots),
                  fragmentCount: numberValue(row.fragments),
                },
              ]
            : [],
        );
    }
    if (tableExists(db, 'experience_template')) {
      inventory.experienceTemplateCount = scalar(db, 'SELECT COUNT(*) FROM experience_template');
      inventory.experienceTemplates = db
        .prepare(
          `
        SELECT t.experience_template_id, t.name,
          SUM(CASE WHEN p.kind = 'content_property' THEN 1 ELSE 0 END) AS content_properties,
          SUM(CASE WHEN p.kind = 'design_property' THEN 1 ELSE 0 END) AS design_properties,
          SUM(CASE WHEN p.kind = 'slot' THEN 1 ELSE 0 END) AS slots,
          (SELECT COUNT(*) FROM exo_experience e
            WHERE e.experience_template_id = t.experience_template_id) AS experiences
        FROM experience_template t
        LEFT JOIN experience_template_property p
          ON p.experience_template_id = t.experience_template_id
        GROUP BY t.experience_template_id, t.name
        ORDER BY t.name, t.experience_template_id
      `,
        )
        .all()
        .flatMap((row) =>
          typeof row.experience_template_id === 'string'
            ? [
                {
                  id: row.experience_template_id,
                  name: stringValue(row.name) ?? row.experience_template_id,
                  contentPropertyCount: numberValue(row.content_properties),
                  designPropertyCount: numberValue(row.design_properties),
                  slotCount: numberValue(row.slots),
                  experienceCount: numberValue(row.experiences),
                },
              ]
            : [],
        );
    }
    if (tableExists(db, 'exo_experience')) {
      inventory.experienceCount = scalar(db, 'SELECT COUNT(*) FROM exo_experience');
      inventory.experiences = db
        .prepare(
          `
        SELECT e.experience_id, e.name, e.experience_template_id, t.name AS template_name
        FROM exo_experience e
        LEFT JOIN experience_template t
          ON t.experience_template_id = e.experience_template_id
        ORDER BY e.name, e.experience_id
      `,
        )
        .all()
        .flatMap((row) =>
          typeof row.experience_id === 'string'
            ? [
                {
                  id: row.experience_id,
                  name: stringValue(row.name) ?? row.experience_id,
                  schemaId: stringValue(row.experience_template_id),
                  schemaName: stringValue(row.template_name),
                },
              ]
            : [],
        );
    }
    if (tableExists(db, 'exo_fragment')) {
      inventory.fragmentCount = scalar(db, 'SELECT COUNT(*) FROM exo_fragment');
      inventory.fragments = db
        .prepare(
          `
        SELECT f.fragment_id, f.name, f.component_id, c.name AS component_name
        FROM exo_fragment f
        LEFT JOIN component c ON c.component_id = f.component_id
        ORDER BY f.name, f.fragment_id
      `,
        )
        .all()
        .flatMap((row) =>
          typeof row.fragment_id === 'string'
            ? [
                {
                  id: row.fragment_id,
                  name: stringValue(row.name) ?? row.fragment_id,
                  schemaId: stringValue(row.component_id),
                  schemaName: stringValue(row.component_name),
                },
              ]
            : [],
        );
    }
    if (tableExists(db, 'exo_data_assembly')) {
      inventory.exoDataAssemblyCount = scalar(db, 'SELECT COUNT(*) FROM exo_data_assembly');
      inventory.dataAssemblies = db
        .prepare(
          `
        SELECT data_assembly_id, name
        FROM exo_data_assembly
        ORDER BY name, data_assembly_id
      `,
        )
        .all()
        .flatMap((row) =>
          typeof row.data_assembly_id === 'string'
            ? [
                {
                  id: row.data_assembly_id,
                  name: stringValue(row.name) ?? row.data_assembly_id,
                },
              ]
            : [],
        );
    }
    if (!inventory.spaceId && tableExists(db, 'entries')) {
      const row = db.prepare('SELECT space_id, environment_id FROM entries WHERE space_id IS NOT NULL LIMIT 1').get();
      inventory.spaceId = stringValue(row?.space_id);
      inventory.environmentId ??= stringValue(row?.environment_id);
    }
    if (tableExists(db, 'entry_fields')) {
      inventory.locales = db
        .prepare("SELECT DISTINCT locale FROM entry_fields WHERE locale != '__raw__' ORDER BY locale")
        .all()
        .flatMap((row) => (typeof row.locale === 'string' ? [row.locale] : []));
    }
    if (tableExists(db, 'content_type')) {
      const referencedIds = tableExists(db, 'entry_fields') ? referencedEntryIds(db) : new Set<string>();
      inventory.contentTypes = db
        .prepare(
          `SELECT ct.content_type_id, ct.name
         FROM content_type ct
         ORDER BY (SELECT COUNT(*) FROM entries e WHERE e.content_type_id = ct.content_type_id) DESC,
           ct.name`,
        )
        .all()
        .flatMap((row) => {
          if (typeof row.content_type_id !== 'string' || typeof row.name !== 'string') return [];
          return [
            {
              id: row.content_type_id,
              name: row.name,
              entryCount: scalar(db, 'SELECT COUNT(*) FROM entries WHERE content_type_id = ?', row.content_type_id),
              publishedEntryCount: scalar(
                db,
                'SELECT COUNT(*) FROM entries WHERE content_type_id = ? AND sys_published_at IS NOT NULL',
                row.content_type_id,
              ),
              draftOnlyEntryCount: scalar(
                db,
                'SELECT COUNT(*) FROM entries WHERE content_type_id = ? AND sys_published_at IS NULL',
                row.content_type_id,
              ),
              potentiallyUnreferencedEntryCount: db
                .prepare('SELECT entry_id FROM entries WHERE content_type_id = ?')
                .all(row.content_type_id)
                .filter((entry) => typeof entry.entry_id === 'string' && !referencedIds.has(entry.entry_id)).length,
              fieldCount: scalar(db, 'SELECT COUNT(*) FROM field WHERE content_type_id = ?', row.content_type_id),
            },
          ];
        });
      if (tableExists(db, 'field')) {
        inventory.richTextFields = db
          .prepare(
            `
          SELECT f.content_type_id, ct.name AS content_type_name, f.field_id, f.name AS field_name
          FROM field f
          JOIN content_type ct ON ct.content_type_id = f.content_type_id
          WHERE f.field_type = 'RichText'
          ORDER BY ct.name, f.position
        `,
          )
          .all()
          .flatMap((row) => {
            if (
              typeof row.content_type_id !== 'string' ||
              typeof row.content_type_name !== 'string' ||
              typeof row.field_id !== 'string'
            )
              return [];
            return [
              {
                contentTypeId: row.content_type_id,
                contentTypeName: row.content_type_name,
                fieldId: row.field_id,
                fieldName: typeof row.field_name === 'string' ? row.field_name : row.field_id,
                entryCount: scalar(db, 'SELECT COUNT(*) FROM entries WHERE content_type_id = ?', row.content_type_id),
                populatedEntryCount: scalar(
                  db,
                  `
              SELECT COUNT(*) FROM entries e
              WHERE e.content_type_id = ? AND EXISTS (
                SELECT 1 FROM entry_fields ef, json_tree(ef.value_json) value
                WHERE ef.entry_id = e.entry_id AND ef.field_key = ?
                  AND ((value.key = 'value' AND typeof(value.value) = 'text' AND trim(value.value) != '')
                    OR (value.key = 'linkType' AND value.value = 'Entry'))
              )
            `,
                  row.content_type_id,
                  row.field_id,
                ),
                emptyEntryCount: 0,
                entryLinkCount: scalar(
                  db,
                  `
              SELECT COUNT(*) FROM entries e
              WHERE e.content_type_id = ? AND EXISTS (
                SELECT 1 FROM entry_fields ef, json_tree(ef.value_json) value
                WHERE ef.entry_id = e.entry_id AND ef.field_key = ?
                  AND value.key = 'linkType' AND value.value = 'Entry'
              )
            `,
                  row.content_type_id,
                  row.field_id,
                ),
              },
            ];
          });
        for (const field of inventory.richTextFields) {
          field.emptyEntryCount = field.entryCount - field.populatedEntryCount;
        }
      }
    }
  } catch (error) {
    warnings.push(
      `Database present but unreadable or corrupt: ${error instanceof Error ? error.message : String(error)}. ` +
        'Falling back to summary.json identity only.',
    );
  } finally {
    db.close();
  }
  return inventory;
}

export function computeInventoryWarnings(inventory: SpaceInventory, env: StringMap): void {
  if (!inventory.spaceId) {
    inventory.warnings.push(
      'Space identity unknown — summary.json is missing and no space_id found in the DB. ' +
        'Run `fetch` to regenerate the space export.',
    );
  }
  if (inventory.spaceId && env.SPACE_ID && env.SPACE_ID !== inventory.spaceId) {
    inventory.warnings.push(
      `SpaceEnv mismatch: .env SPACE_ID '${env.SPACE_ID}' != database space_id '${inventory.spaceId}'. ` +
        'Writes would target a different space than the DB.',
    );
  }
  if (inventory.environmentId && env.ENVIRONMENT_ID && env.ENVIRONMENT_ID !== inventory.environmentId) {
    inventory.warnings.push(
      `SpaceEnv mismatch: .env ENVIRONMENT_ID '${env.ENVIRONMENT_ID}' != database environment_id ` +
        `'${inventory.environmentId}'.`,
    );
  }
  if (
    inventory.dbPresent &&
    inventory.componentCount === 0 &&
    (!inventory.exoCollectionStatus?.components || inventory.exoCollectionStatus.components === 'ok')
  ) {
    inventory.warnings.push('No existing ExO Components found in this snapshot.');
  }
  if (inventory.dbPresent && inventory.contentTypeCount === 0) {
    inventory.warnings.push('No content types found — the database may be empty or malformed.');
  }
  if (inventory.dbPresent && inventory.entryCount === 0) {
    inventory.warnings.push('No entries found — the space appears to have no content.');
  }
}

export function renderHumanInventory(inventory: SpaceInventory): string {
  const exoCount = (key: keyof NonNullable<SpaceInventory['exoCollectionStatus']>, count: number): string => {
    const status = inventory.exoCollectionStatus?.[key];
    return status && status !== 'ok' ? status : String(count);
  };
  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '  Space inventory (from contentful-unified.db)',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `  Space:        ${inventory.spaceName ?? '(unknown)'} [${inventory.spaceId ?? '?'}]`,
    `  Environment:  ${inventory.environmentId ?? '(unknown)'}`,
    `  API host:     ${inventory.apiHost ?? '(unknown)'}`,
    `  Database:     ${inventory.dbPath}`,
    '',
    `  Content types:      ${inventory.contentTypeCount}`,
    `  Entries:            ${inventory.entryCount}  (${inventory.publishedEntryCount} published, ` +
      `${inventory.draftOnlyEntryCount} draft-only)`,
    `  Assets:             ${inventory.assetCount}`,
    `  Tags:               ${inventory.tagCount}`,
    `  Taxonomy concepts:  ${inventory.taxonomyConceptCount}`,
  ];
  let componentDetail = '';
  if (inventory.componentCodedCount || inventory.componentCompositeCount) {
    componentDetail = `  (${inventory.componentCodedCount} coded, ${inventory.componentCompositeCount} composite)`;
  } else if (inventory.componentNames.length > 0) {
    componentDetail = `  (e.g. ${inventory.componentNames.join(', ')})`;
  }
  lines.push(
    `  Components:         ${exoCount('components', inventory.componentCount)}${componentDetail}`,
    `  Experience Templates: ${exoCount('experienceTemplates', inventory.experienceTemplateCount)}`,
    `  Experiences:        ${exoCount('experiences', inventory.experienceCount)}`,
    `  Fragments:          ${exoCount('fragments', inventory.fragmentCount)}`,
    `  Data assemblies:    ${exoCount('dataAssemblies', inventory.exoDataAssemblyCount)}`,
    `  Locales:            ${inventory.locales.join(', ') || '(none)'}`,
  );
  if (inventory.contentTypes.length > 0) {
    lines.push('', '  Content types:');
    for (const contentType of inventory.contentTypes) {
      lines.push(
        `    - ${contentType.name} (${contentType.id}): ` +
          `${contentType.entryCount} entries (${contentType.publishedEntryCount} published, ` +
          `${contentType.draftOnlyEntryCount} draft-only, ` +
          `${contentType.potentiallyUnreferencedEntryCount} potentially unreferenced), ` +
          `${contentType.fieldCount} fields`,
      );
    }
  }
  if (inventory.richTextFields.length > 0) {
    lines.push('', `  Rich Text fields (${inventory.richTextFields.length}):`);
    for (const field of inventory.richTextFields) {
      lines.push(
        `    - ${field.contentTypeName}.${field.fieldName} (${field.contentTypeId}.${field.fieldId}): ` +
          `${field.populatedEntryCount}/${field.entryCount} entries populated, ` +
          `${field.emptyEntryCount} empty, ${field.entryLinkCount} with Entry links`,
      );
    }
  }
  if (inventory.components.length > 0) {
    lines.push('', '  ExO Components:');
    for (const component of inventory.components) {
      lines.push(
        `    - ${component.name} (${component.id}): ${component.kind}, ` +
          `${component.contentPropertyCount} content properties, ${component.designPropertyCount} design properties, ` +
          `${component.slotCount} slots, ${component.fragmentCount} fragments`,
      );
    }
  }
  if (inventory.experienceTemplates.length > 0) {
    lines.push('', '  ExO Experience Templates:');
    for (const template of inventory.experienceTemplates) {
      lines.push(
        `    - ${template.name} (${template.id}): ${template.contentPropertyCount} content properties, ` +
          `${template.designPropertyCount} design properties, ${template.slotCount} slots, ` +
          `${template.experienceCount} experiences`,
      );
    }
  }
  if (inventory.experiences.length > 0) {
    lines.push('', '  ExO Experiences:');
    for (const experience of inventory.experiences) {
      const template = experience.schemaName ?? experience.schemaId ?? '(unknown template)';
      lines.push(`    - ${experience.name} (${experience.id}): template ${template}`);
    }
  }
  if (inventory.fragments.length > 0) {
    lines.push('', '  ExO Fragments:');
    for (const fragment of inventory.fragments) {
      const component = fragment.schemaName ?? fragment.schemaId ?? '(unknown component)';
      lines.push(`    - ${fragment.name} (${fragment.id}): component ${component}`);
    }
  }
  if (inventory.dataAssemblies.length > 0) {
    lines.push('', '  ExO Data Assemblies:');
    for (const assembly of inventory.dataAssemblies) {
      lines.push(`    - ${assembly.name} (${assembly.id})`);
    }
  }
  if (inventory.warnings.length > 0) {
    lines.push('');
    for (const warning of inventory.warnings) lines.push(`  ⚠ WARNING: ${warning}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function runInventory(argv = process.argv.slice(2)): number {
  try {
    const args = parseArgs(argv);
    const dataDir = requiredStringArg(args, 'data-dir');
    const render = requiredStringArg(args, 'render');
    if (render !== 'human' && render !== 'json') throw new Error('--render must be human or json');
    const envFile = stringArg(args, 'env-file') ?? '.env';
    const inventory = gatherInventory(dataDir);
    computeInventoryWarnings(inventory, loadEnvironmentFile(envFile));
    process.stdout.write(
      `${render === 'json' ? JSON.stringify({ schemaVersion: 1, inventory }, null, 2) : renderHumanInventory(inventory)}\n`,
    );
    return 0;
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
