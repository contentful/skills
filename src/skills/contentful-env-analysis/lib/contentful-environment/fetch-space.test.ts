import assert from 'node:assert/strict';
import test from 'node:test';
import { idsFromEntries } from './fetch-space.ts';

test('collects unique tag and taxonomy concept IDs from entry and asset metadata', () => {
  assert.deepEqual(
    idsFromEntries(
      [
        {
          sys: {},
          fields: {},
          metadata: {
            tags: [{ sys: { id: 'featured' } }, { sys: { id: 'featured' } }],
            concepts: [{ sys: { id: 'news' } }, { sys: { id: 'news' } }],
          },
        },
        { sys: {}, fields: {}, metadata: { tags: [{ sys: { id: 'hero' } }] } },
      ],
      [
        {
          sys: {},
          fields: {},
          metadata: { tags: [{ sys: { id: 'asset-tag' } }], concepts: [{ sys: { id: 'asset-concept' } }] },
        },
      ],
    ),
    { tagIds: ['asset-tag', 'featured', 'hero'], conceptIds: ['asset-concept', 'news'] },
  );
});
