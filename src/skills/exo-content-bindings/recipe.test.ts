import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildBody, compileCollection, editorCheck, readRecipe } from './lib/recipe.mjs';
import type { DataAssembly, Expression, Recipe } from './lib/recipe.mjs';
import { schemaFromSdl } from './lib/schema.mjs';

const schema = schemaFromSdl(readFileSync(new URL('./fixtures/schema.graphql', import.meta.url), 'utf8'));
const pick = (id: string, type: string) => ({ id, name: id, allowedTypes: [type] });
const entry = (parameter: string) => ({ resolverType: 'graphql' as const, parameters: { id: `$parameters/${parameter}` } });
const on = (type: string, select: Expression): Expression => ({ $on: { type: { [type]: select } } });
const fromMain = (select: Expression): Expression => ({ $from: { source: '$resolvers/main', select } });
const saved = (id: string, recipe: Recipe, referenced: Record<string, DataAssembly> = {}): DataAssembly => ({
  sys: { id },
  ...buildBody(recipe, { schema, referenced }),
});

const eventRecipe: Recipe = {
  name: 'Default',
  parameters: [pick('eventId', 'Event')],
  resolvers: { main: entry('eventId') },
  return: {
    title: fromMain(on('Event', 'title')),
    body: fromMain(on('Event', 'body')),
    image: fromMain(on('Event', 'image/url')),
    city: fromMain(on('Event', 'venue/city')),
    host: fromMain(on('Event', { $from: { source: 'host', select: on('Person', 'name') } })),
    sessions: fromMain(
      on('Event', {
        $from: {
          source: 'sessionsCursorCollection/items',
          select: { $on: { type: { Talk: { title: 'title', text: 'abstract' }, Workshop: { title: 'title' } } } },
        },
      }),
    ),
  },
};

test('writes one query per entry resolver: sorted fields, branches for unions, rich text as its document', () => {
  const body = buildBody(eventRecipe, { schema });
  assert.equal(
    body.resolvers.main.query,
    `query ($id: ID!) {
  _node(id: $id) {
    __typename
    ... on Event {
      body {
        document: json
      }
      host {
        __typename
        ... on Person {
          name
        }
      }
      image {
        url
      }
      sessionsCursorCollection {
        items {
          __typename
          ... on Talk {
            abstract {
              document: json
            }
            title
          }
          ... on Workshop {
            title
          }
        }
      }
      title
      venue {
        city
      }
    }
  }
}`,
  );
  assert.deepEqual(body.resolvers.main.parameters, { id: '$parameters/eventId' });
  assert.deepEqual(body.return.title, { $from: { source: '$resolvers/main/_node', select: on('Event', 'title') } });
  assert.deepEqual(body.parameters, [
    {
      id: 'eventId',
      required: true,
      name: 'eventId',
      type: 'ResourceLink',
      allowedResources: [
        {
          type: 'Contentful:Entry',
          source: 'crn:contentful:::content:spaces/$self/environments/$self',
          allowedTypes: ['event'],
        },
      ],
    },
  ]);
});

test('refuses a selection through a union without $on, before anything reaches the API', () => {
  const unbranched: Recipe = { ...eventRecipe, return: { host: fromMain(on('Event', 'host/name')) } };
  assert.throws(() => buildBody(unbranched, { schema }), /does not fit this environment's schema.*\$on/s);
  const unbranchedList: Recipe = {
    ...eventRecipe,
    return: { sessions: fromMain(on('Event', { $from: { source: 'sessionsCursorCollection/items', select: { title: 'title' } } })) },
  };
  assert.throws(() => buildBody(unbranchedList, { schema }), /does not fit this environment's schema/);
});

test('refuses unknown content types and hand-written queries', () => {
  assert.throws(
    () => buildBody({ ...eventRecipe, parameters: [pick('eventId', 'Concert')] }, { schema }),
    /"Concert" is not a content type/,
  );
  const raw = { ...eventRecipe, resolvers: { main: { source: 'Contentful:GraphQL', query: '{ event(id: "1") { title } }' } } };
  assert.throws(() => buildBody(raw, { schema }), /unknown or unsupported resolver/);
});

test('writes a query collection with a locked limit and the order in the query', () => {
  const { parameterDefinition, ...latest } = compileCollection('latest', {
    contentTypeName: 'Event',
    limit: 3,
    order: ['sys_publishedAt_DESC'],
  });
  const body = buildBody(
    {
      parameters: [{ id: 'latest', name: 'Latest events', required: true, ...parameterDefinition }],
      resolvers: { latest },
      return: {
        items: { $from: { source: '$resolvers/latest/eventCursorCollection/items', select: { title: 'title', city: 'venue/city' } } },
      },
    },
    { schema },
  );
  assert.equal(
    body.resolvers.latest.query,
    `query ($limit: Int!) {
  eventCursorCollection(limit: $limit, order: [sys_publishedAt_DESC]) {
    items {
      __typename
      title
      venue {
        city
      }
    }
  }
}`,
  );
  assert.deepEqual(body.resolvers.latest.parameters, { limit: '$parameters/latest/limit' });
  assert.deepEqual(body.parameters[0], {
    id: 'latest',
    required: true,
    name: 'Latest events',
    type: 'Record',
    locked: true,
    fields: [{ type: 'Number', id: 'limit', fallbackValue: 3 }],
  });
  assert.equal(editorCheck(schema, { sys: { id: 'latest-events' }, ...body }).state, 'editable');
});

test('feeds a nested recipe from an editor pick, or from a reference on the picked entry by its id', () => {
  const venueCard = saved('venue-card', {
    name: 'Default',
    parameters: [pick('venueId', 'Venue')],
    resolvers: { main: entry('venueId') },
    return: { name: fromMain(on('Venue', 'name')) },
  });
  const link = {
    sys: {
      type: 'ResourceLink' as const,
      linkType: 'Contentful:DataAssembly',
      urn: 'crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/venue-card',
    },
  };
  const parent: Recipe = {
    name: 'Default',
    parameters: [pick('eventId', 'Event'), pick('otherVenueId', 'Venue')],
    resolvers: {
      main: entry('eventId'),
      derived: {
        resolverType: 'dataAssembly',
        dataAssembly: link,
        parameters: { venueId: { $from: { source: '$resolvers/main', select: 'venue' } } },
      },
      picked: { resolverType: 'dataAssembly', dataAssembly: link, parameters: { venueId: '$parameters/otherVenueId' } },
    },
    return: {
      title: fromMain(on('Event', 'title')),
      venue: { $from: '$resolvers/derived' },
      other: { $from: '$resolvers/picked' },
    },
  };
  const body = buildBody(parent, { schema, referenced: { 'venue-card': venueCard } });
  assert.deepEqual(body.resolvers.derived.parameters, { venueId: '$resolvers/main/_node/venue/_id' });
  assert.deepEqual(body.resolvers.picked.parameters, { venueId: '$parameters/otherVenueId' });
  assert.match(body.resolvers.main.query ?? '', /venue \{\n\s+_id\n\s+\}/);
  assert.deepEqual(body.return.venue, { $from: '$resolvers/derived' });
  const verdict = editorCheck(schema, { sys: { id: 'event-default' }, ...body }, { 'venue-card': venueCard });
  assert.equal(verdict.state, 'editable');
});

test('everything it builds reads back and regenerates identically, so the editor can edit it', () => {
  const dataAssembly = saved('event-default', eventRecipe);
  const verdict = editorCheck(schema, dataAssembly);
  assert.deepEqual(verdict, { state: 'editable', editable: true, causes: [], rewrites: [] });
  const recipe = readRecipe(dataAssembly, { schema });
  assert.deepEqual(recipe.parameters, [
    {
      id: 'eventId',
      required: true,
      name: 'eventId',
      allowedTypes: ['Event'],
      type: 'Contentful:Entry',
      source: 'crn:contentful:::content:spaces/$self/environments/$self',
    },
  ]);
  assert.deepEqual(recipe.return?.title, fromMain(on('Event', 'title')));
  assert.deepEqual(buildBody(recipe, { schema }), buildBody(eventRecipe, { schema }));
});

test('flags what the component editor shows as API only, and says which part', () => {
  const base = saved('event-default', eventRecipe);
  const withReturn = (value: Expression): DataAssembly => ({ ...base, return: { ...base.return, title: value } });
  const cases: [string, DataAssembly, RegExp][] = [
    ['a fixed value', withReturn({ $literal: 'Hello' }), /fixed value/],
    ['a parameter read in the return', withReturn('$parameters/eventId'), /reads a parameter directly/],
    ['an explicit $object', withReturn({ $object: { a: '$resolvers/main/_node/title' } }), /\$object/],
    ['more than four levels', withReturn({ $from: { source: '$resolvers/main/_node', select: 'a/b/c/d/e' } }), /more than 4 levels/],
    ['the Nth item of a list', withReturn('$resolvers/main/_node/speakersCursorCollection/items/0/name'), /by position/],
    ['a whole resolver', withReturn('$resolvers/main'), /returns everything/],
    [
      'a hand-written query',
      { ...base, resolvers: { main: { ...base.resolvers!.main, query: 'query ($id: String!) { event(id: $id) { title } }' } } },
      /hand-written query rooted at "event/,
    ],
    [
      'a collection with a filter',
      {
        sys: { id: 'filtered' },
        parameters: [],
        resolvers: {
          list: {
            source: 'Contentful:GraphQL',
            query: '{ eventCursorCollection(limit: 3, pageNext: "x") { items { __typename title } } }',
            parameters: {},
          },
        },
        return: { items: { $from: { source: '$resolvers/list/eventCursorCollection/items', select: { title: 'title' } } } },
      },
      /collection query the editor cannot describe/,
    ],
  ];
  for (const [name, dataAssembly, why] of cases) {
    const verdict = editorCheck(schema, dataAssembly);
    assert.equal(verdict.state, 'apiOnly', name);
    assert.equal(verdict.editable, false, name);
    assert.match(verdict.causes.map((cause) => `${cause.where} ${cause.why}`).join('; '), why, name);
  }
  // exactly four levels is still fine, and so is a fixed value inside a selection
  assert.notEqual(editorCheck(schema, withReturn({ $from: { source: '$resolvers/main/_node', select: 'a/b/c/d' } })).state, 'apiOnly');
  assert.notEqual(
    editorCheck(schema, withReturn({ $from: { source: '$resolvers/main/_node', select: { a: { $literal: 1 }, b: 'title' } } })).state,
    'apiOnly',
  );
});

test('marks a recipe that fits the rules but is not in the shape the editor saves as unverified', () => {
  const base = saved('event-default', { ...eventRecipe, return: { title: fromMain(on('Event', 'title')) } });
  const handWritten: DataAssembly = { ...base, return: { title: '$resolvers/main/_node/title' } };
  const verdict = editorCheck(schema, handWritten);
  assert.equal(verdict.state, 'unverified');
  assert.equal(verdict.editable, true);
  assert.deepEqual(verdict.rewrites, ['return']);
});
