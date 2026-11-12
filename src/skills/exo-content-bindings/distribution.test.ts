import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildExoContentBindings } from './build.ts';

test('committed bundle is current and runs in isolation without installed dependencies', async () => {
  await buildExoContentBindings(true);
  const root = await mkdtemp(join(tmpdir(), 'exo-content-bindings-installed-'));
  try {
    const skill = join(root, 'skill');
    await cp(fileURLToPath(new URL('../../../skills/exo-content-bindings', import.meta.url)), skill, { recursive: true });
    const run = (...args: string[]) =>
      spawnSync(process.execPath, [join(skill, 'scripts/main.js'), ...args], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, NODE_PATH: '', CONTENTFUL_MANAGEMENT_TOKEN: '', CMA_TOKEN: '' },
      });

    // --help goes to stderr and exits 0, for the tool and for every command
    const help = run('--help');
    assert.equal(help.status, 0, help.stderr);
    assert.equal(help.stdout, '');
    for (const command of ['discover', 'build', 'propose', 'apply']) {
      assert.match(help.stderr, new RegExp(`\\b${command}\\b`));
      const commandHelp = run(command, '--help');
      assert.equal(commandHelp.status, 0, commandHelp.stderr);
      assert.equal(commandHelp.stdout, '');
      assert.match(commandHelp.stderr, new RegExp(`Usage: node main.js ${command} `));
    }

    // wrong usage and refused actions exit 2 with nothing on stdout
    const missing = run('build', '--plan', 'plan.json');
    assert.equal(missing.status, 2);
    assert.equal(missing.stdout, '');
    assert.match(missing.stderr, /missing --env-file, --out-dir/);
    assert.equal(run('nope').status, 2);
    // Node itself also reads a flag called --env-file, so the file has to exist before any command runs
    await writeFile(join(root, '.env'), 'EXO_SPACE_ID=space\n');
    const unapproved = run('apply', '--env-file', '.env', '--out-dir', 'work');
    assert.equal(unapproved.status, 2);
    assert.match(unapproved.stderr, /Refusing to write: pass --approved/);

    // a command that needs credentials says what is missing instead of reaching the network
    const noToken = run('discover', '--env-file', '.env', '--out-dir', 'work');
    assert.equal(noToken.status, 1);
    assert.match(noToken.stderr, /Need CONTENTFUL_MANAGEMENT_TOKEN/);

    // propose works offline and prints one JSON document
    const work = join(root, 'work');
    await mkdir(work, { recursive: true });
    const quote = {
      kind: 'components',
      id: 'quote',
      name: 'Quote',
      implementation: 'Coded',
      published: true,
      contentProperties: [{ id: 'text', name: 'Text', type: 'String', required: true }],
      designProperties: [],
      bindingSets: [],
    };
    await writeFile(
      join(work, 'discovery.json'),
      JSON.stringify({
        source: { spaceId: 'space', environmentId: 'master' },
        components: [quote],
        templates: [],
        contentModel: { Quote: { contentTypeId: 'quote', displayName: 'Quote', fields: [{ id: 'text', name: 'Text' }] } },
        existingBindingSets: [],
      }),
    );
    await writeFile(
      join(work, 'plan.json'),
      JSON.stringify({
        recipes: [
          {
            id: 'quote-default',
            name: 'Default',
            linkTo: [{ kind: 'components', id: 'quote' }],
            parameters: [{ id: 'quoteId', name: 'Quote', allowedTypes: ['quote'] }],
            return: { text: { $from: { source: '$resolvers/main', select: 'text' } } },
            review: { summary: 'Pick one <Quote> entry; its text fills itself.' },
          },
        ],
      }),
    );
    const proposed = run('propose', '--plan', join(work, 'plan.json'), '--out-dir', work, '--title', 'Quote proposal');
    assert.equal(proposed.status, 0, proposed.stderr);
    assert.deepEqual(JSON.parse(proposed.stdout).files, { proposal: join(work, 'proposal.html') });
    const page = await readFile(join(work, 'proposal.html'), 'utf8');
    assert.match(page, /Quote proposal/);
    assert.match(page, /Pick one &lt;Quote&gt; entry/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
