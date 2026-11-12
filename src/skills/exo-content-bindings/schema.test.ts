import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { schemaFromSdl } from './lib/schema.mjs';

const sdl = readFileSync(new URL('./fixtures/schema.graphql', import.meta.url), 'utf8');
const schema = schemaFromSdl(sdl);
const event = schema.getFields(schema.rootByName.Event.ref);

test('lists the content types of the environment and the asset type', () => {
  assert.deepEqual(
    schema.roots.map((root) => root.name),
    ['Asset', 'Event', 'Person', 'Talk', 'Venue', 'Workshop'],
  );
  assert.equal(schema.rootById.event.name, 'Event');
  assert.equal(schema.assetRoot?.ref.sys.linkType, 'Contentful:Asset');
  assert.equal(schema.nameToId.get('Workshop'), 'workshop');
});

test('reads names, types and requiredness from the schema, not from display labels', () => {
  assert.deepEqual(Object.keys(event), [
    'body',
    'featured',
    'host',
    'image',
    'sessionsCursorCollection',
    'speakersCursorCollection',
    'starts',
    'summary',
    'title',
    'venue',
  ]);
  assert.deepEqual(
    { type: event.title.type, required: event.title.required, fieldId: event.title.fieldId },
    { type: 'String', required: true, fieldId: 'f_title' },
  );
  assert.equal(event.body.type, 'RichText');
  assert.equal(event.starts.type, 'DateTime');
  assert.equal(event.featured.type, 'Boolean');
  assert.equal(event.image.ref?.sys.linkType, 'Contentful:Asset');
  // the GraphQL name carries the collection suffix; `name` is the content type's own field id
  assert.equal(event.sessionsCursorCollection.name, 'sessions');
  assert.equal(event.sessionsCursorCollection.required, true);
});

test('marks references the schema types as a union, including a union of one', () => {
  assert.equal(event.venue.type, 'TypeRef');
  assert.equal(event.venue.branch, undefined);
  assert.equal(event.host.type, 'TypeRef');
  assert.equal(event.host.branch, true);
  assert.equal(event.sessionsCursorCollection.items?.type, 'DiscriminatedUnion');
  assert.equal(event.sessionsCursorCollection.branch, true);
  assert.equal(event.speakersCursorCollection.items?.type, 'TypeRef');
  assert.equal(event.speakersCursorCollection.branch, undefined);
});

test('describes asset fields and leaves out system fields', () => {
  const asset = schema.getFields(schema.assetRoot!.ref);
  assert.deepEqual(Object.keys(asset), ['description', 'fileName', 'title', 'url', 'width']);
  assert.equal(asset.url.required, true);
  assert.equal(asset.width.type, 'Integer');
});

test('lists fields that reference another space or an external resource as unsupported', () => {
  const withResourceLink = schemaFromSdl(
    sdl.replace(
      '  starts: DateTime',
      '  partner: Venue @fieldResolver(kind: "resource-link", data: {fieldId: "f_partner"})\n  starts: DateTime',
    ),
  );
  assert.equal('partner' in withResourceLink.getFields(withResourceLink.rootByName.Event.ref), false);
  assert.deepEqual(
    withResourceLink.unsupported.map((field) => `${field.type}.${field.field}`),
    ['Event.partner'],
  );
});
