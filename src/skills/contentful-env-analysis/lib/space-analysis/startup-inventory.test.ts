import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { computeInventoryWarnings, gatherInventory, renderHumanInventory } from './startup-inventory.ts';

function fixture(): { dataDir: string; env: Record<string, string> } {
  const root = mkdtempSync(join(tmpdir(), 'exo-inventory-'));
  const dataDir = join(root, 'snapshot');
  mkdirSync(dataDir);
  writeFileSync(
    join(dataDir, 'summary.json'),
    JSON.stringify({
      space_id: 'space-1',
      space_name: 'Example Space',
      environment_id: 'master',
      api_host: 'api.contentful.com',
    }),
  );
  const db = new DatabaseSync(join(dataDir, 'contentful-unified.db'));
  db.exec(`
    CREATE TABLE content_type (content_type_id TEXT, name TEXT);
    CREATE TABLE field (
      content_type_id TEXT,
      field_id TEXT,
      name TEXT,
      field_type TEXT,
      position INTEGER
    );
    CREATE TABLE entries (
      entry_id TEXT,
      content_type_id TEXT,
      space_id TEXT,
      environment_id TEXT,
      sys_published_at TEXT
    );
    CREATE TABLE entry_fields (entry_id TEXT, field_key TEXT, locale TEXT, value_json TEXT);
    CREATE TABLE assets (asset_id TEXT);
    CREATE TABLE asset_fields (asset_id TEXT);
    CREATE TABLE component (component_id TEXT, name TEXT, is_coded INTEGER);
    CREATE TABLE component_property (component_id TEXT, kind TEXT);
    CREATE TABLE experience_template (experience_template_id TEXT, name TEXT);
    CREATE TABLE experience_template_property (experience_template_id TEXT, kind TEXT);
    CREATE TABLE exo_experience (experience_id TEXT, name TEXT, experience_template_id TEXT);
    CREATE TABLE exo_fragment (fragment_id TEXT, name TEXT, component_id TEXT);
    CREATE TABLE exo_data_assembly (data_assembly_id TEXT, name TEXT);
    CREATE TABLE tags (tag_id TEXT);
    CREATE TABLE taxonomy_concepts (concept_id TEXT);
    INSERT INTO content_type VALUES ('article', 'Article');
    INSERT INTO field VALUES
      ('article', 'title', 'Title', 'Symbol', 0),
      ('article', 'body', 'Body', 'RichText', 1);
    INSERT INTO entries VALUES ('entry-1', 'article', 'space-1', 'master', '2026-10-01T00:00:00Z');
    INSERT INTO entry_fields VALUES ('entry-1', 'title', 'en-US', '"Example"');
    INSERT INTO entry_fields VALUES (
      'entry-1',
      'related',
      'en-US',
      '{"sys":{"type":"Link","linkType":"Entry","id":"entry-1"}}'
    );
    INSERT INTO assets VALUES ('asset-1');
    INSERT INTO component VALUES ('hero', 'Hero', 1), ('landing-page', 'Landing page', 0);
    INSERT INTO component_property VALUES
      ('hero', 'content_property'),
      ('hero', 'design_property'),
      ('landing-page', 'slot');
    INSERT INTO experience_template VALUES ('landing-page-template', 'Landing page template');
    INSERT INTO experience_template_property VALUES ('landing-page-template', 'slot');
    INSERT INTO exo_experience VALUES ('homepage', 'Homepage', 'landing-page-template');
    INSERT INTO exo_fragment VALUES ('hero-fragment', 'Homepage hero', 'hero');
    INSERT INTO exo_data_assembly VALUES ('hero-content', 'Hero content');
    INSERT INTO tags VALUES ('featured');
    INSERT INTO taxonomy_concepts VALUES ('news');
  `);
  db.close();
  return { dataDir, env: { SPACE_ID: 'space-1', ENVIRONMENT_ID: 'master' } };
}

test('gathers and renders the deterministic space inventory', () => {
  const { dataDir, env } = fixture();
  const inventory = gatherInventory(dataDir);
  computeInventoryWarnings(inventory, env);

  assert.equal(inventory.contentTypeCount, 1);
  assert.equal(inventory.entryCount, 1);
  assert.equal(inventory.publishedEntryCount, 1);
  assert.equal(inventory.draftOnlyEntryCount, 0);
  assert.equal(inventory.assetCount, 1);
  assert.equal(inventory.tagCount, 1);
  assert.equal(inventory.taxonomyConceptCount, 1);
  assert.equal(inventory.componentCount, 2);
  assert.equal(inventory.componentCodedCount, 1);
  assert.equal(inventory.componentCompositeCount, 1);
  assert.equal(inventory.experienceTemplateCount, 1);
  assert.equal(inventory.experienceCount, 1);
  assert.equal(inventory.fragmentCount, 1);
  assert.equal(inventory.exoDataAssemblyCount, 1);
  assert.deepEqual(inventory.locales, ['en-US']);
  assert.deepEqual(inventory.contentTypes, [
    {
      id: 'article',
      name: 'Article',
      entryCount: 1,
      publishedEntryCount: 1,
      draftOnlyEntryCount: 0,
      potentiallyUnreferencedEntryCount: 0,
      fieldCount: 2,
    },
  ]);
  assert.deepEqual(inventory.richTextFields, [
    {
      contentTypeId: 'article',
      contentTypeName: 'Article',
      fieldId: 'body',
      fieldName: 'Body',
      entryCount: 1,
      populatedEntryCount: 0,
      emptyEntryCount: 1,
      entryLinkCount: 0,
    },
  ]);
  assert.deepEqual(inventory.components, [
    {
      id: 'hero',
      name: 'Hero',
      kind: 'coded',
      contentPropertyCount: 1,
      designPropertyCount: 1,
      slotCount: 0,
      fragmentCount: 1,
    },
    {
      id: 'landing-page',
      name: 'Landing page',
      kind: 'composite',
      contentPropertyCount: 0,
      designPropertyCount: 0,
      slotCount: 1,
      fragmentCount: 0,
    },
  ]);
  assert.deepEqual(inventory.experienceTemplates, [
    {
      id: 'landing-page-template',
      name: 'Landing page template',
      contentPropertyCount: 0,
      designPropertyCount: 0,
      slotCount: 1,
      experienceCount: 1,
    },
  ]);
  assert.deepEqual(inventory.experiences, [
    {
      id: 'homepage',
      name: 'Homepage',
      schemaId: 'landing-page-template',
      schemaName: 'Landing page template',
    },
  ]);
  assert.deepEqual(inventory.fragments, [
    {
      id: 'hero-fragment',
      name: 'Homepage hero',
      schemaId: 'hero',
      schemaName: 'Hero',
    },
  ]);
  assert.deepEqual(inventory.dataAssemblies, [{ id: 'hero-content', name: 'Hero content' }]);

  const human = renderHumanInventory(inventory);
  assert.match(human, /Example Space \[space-1\]/);
  assert.match(human, /Components:\s+2  \(1 coded, 1 composite\)/);
  assert.match(human, /Entries:\s+1  \(1 published, 0 draft-only\)/);
  assert.match(human, /Rich Text fields \(1\):/);
  assert.match(human, /Tags:\s+1/);
  assert.match(human, /Experiences:\s+1/);
  assert.match(human, /Fragments:\s+1/);
  assert.match(
    human,
    /Article \(article\): 1 entries \(1 published, 0 draft-only, 0 potentially unreferenced\), 2 fields/,
  );
  assert.match(human, /Article\.Body \(article\.body\): 0\/1 entries populated, 1 empty/);
  assert.match(human, /Hero \(hero\): coded, 1 content properties, 1 design properties/);
  assert.match(human, /Landing page template \(landing-page-template\).*1 experiences/);
  assert.match(human, /Homepage \(homepage\): template Landing page template/);
  assert.match(human, /Homepage hero \(hero-fragment\): component Hero/);
  assert.match(human, /Hero content \(hero-content\)/);
});

test('warns when the configured target does not match the snapshot identity', () => {
  const { dataDir } = fixture();
  const inventory = gatherInventory(dataDir);
  computeInventoryWarnings(inventory, { SPACE_ID: 'other-space', ENVIRONMENT_ID: 'preview' });

  assert.ok(inventory.warnings.some((warning) => warning.includes("SPACE_ID 'other-space'")));
  assert.ok(inventory.warnings.some((warning) => warning.includes("ENVIRONMENT_ID 'preview'")));
});

test('does not report an unavailable ExO collection as empty', () => {
  const { dataDir } = fixture();
  const db = new DatabaseSync(join(dataDir, 'contentful-unified.db'));
  db.exec('DELETE FROM component');
  db.close();
  writeFileSync(
    join(dataDir, 'summary.json'),
    JSON.stringify({
      space_id: 'space-1',
      environment_id: 'master',
      components: { status: 'unavailable' },
    }),
  );

  const inventory = gatherInventory(dataDir);
  computeInventoryWarnings(inventory, {});
  assert.match(renderHumanInventory(inventory), /Components:\s+unavailable/);
  assert.ok(!inventory.warnings.some((warning) => warning.includes('No existing ExO Components')));
});
