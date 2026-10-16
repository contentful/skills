import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unzipSync } from 'fflate';
import { bundledLicenses } from './bundled-licenses.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const sourceFile = join(root, 'src/skills/contentful-env-analysis/source.json');
const destination = join(root, 'skills/contentful-env-analysis');
const repo = 'contentful/exo-upgrade-agent';
const skill = 'contentful-env-analysis';
const payload = ['SKILL.md', 'bin/main.js', 'references/database.md', 'references/exo-domain.md'];
const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

type Source = {
  release: string;
  artifact?: { release: string; asset: string; sha256: string; commit: string; files: Record<string, string> };
};

export function extractSkill(zip: Uint8Array, digest: string): Map<string, Uint8Array> {
  assert.equal(sha256(zip), digest, 'Release ZIP checksum mismatch');
  const prefix = `${skill}/${skill}/`;
  const archive = unzipSync(zip, {
    filter: (entry) => {
      if (!entry.name.startsWith(prefix)) return false;
      const path = entry.name.slice(prefix.length);
      if (path.includes('\\') || path.split('/').some((part) => !part || part === '.' || part === '..')) return false;
      if (path !== 'SKILL.md' && !/^(?:bin\/.*\.(?:js|json)|references\/.*\.(?:md|json))$/.test(path)) return false;
      assert(entry.originalSize <= 10 * 1024 * 1024, 'Unexpectedly large skill file');
      return true;
    },
  });
  const files = new Map<string, Uint8Array>();
  for (const path of payload) {
    const data = archive[prefix + path];
    assert(data?.length, `Missing release file: ${path}`);
  }
  for (const [path, data] of Object.entries(archive)) {
    files.set(path.slice(prefix.length).replace(/^bin\//, 'scripts/'), data);
  }
  const instructions = Buffer.from(files.get('SKILL.md')!).toString('utf8');
  assert(instructions.startsWith(`---\nname: ${skill}\n`), 'Unexpected skill identity');
  files.set(
    'SKILL.md',
    Buffer.from(
      instructions
        .replaceAll('bin/main.js', 'scripts/main.js')
        .replace(
          '\n---\n',
          '\ncompatibility: Requires Node.js 24.21+, an agent with shell access, and a Contentful CMA token for downloads.\n---\n',
        )
        .replace(
          '## Download the snapshot',
          `## Prerequisites\n\nRequires Node.js 24.21 or newer on Windows, macOS, or Linux and an AI agent with shell access.\nBefore running commands, check the Node version. If it is too old or missing, ask the user to install\na supported Node version. npm/npx is needed only to install or update the skill. Downloads need network\naccess, a CMA token with read access, a Space ID, and an Environment ID. Python, an external SQLite\ninstallation, GitHub access, and a local dependency install are not needed. Later analysis runs offline.\n\n## Download the snapshot`,
        ),
    ),
  );
  return files;
}

export async function checkDistribution(): Promise<void> {
  const source: Source = JSON.parse(await readFile(sourceFile, 'utf8'));
  assert(
    source.artifact && source.artifact.release === source.release,
    'Run pnpm sync:env-analysis after changing the release',
  );
  const paths = await readdir(destination, { recursive: true, withFileTypes: true });
  const actual = paths
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath, entry.name)
        .slice(destination.length + 1)
        .replaceAll('\\', '/'),
    )
    .sort();
  assert.deepEqual(
    actual,
    [...Object.keys(source.artifact.files), 'package.json'].sort(),
    'Unexpected distribution files',
  );
  for (const [path, hash] of Object.entries(source.artifact.files)) {
    assert.equal(
      sha256(await readFile(join(destination, path))),
      hash,
      `Generated file changed: ${path}; run pnpm sync:env-analysis`,
    );
  }
  const pkg = JSON.parse(await readFile(join(destination, 'package.json'), 'utf8'));
  assert.equal(pkg.name, `@contentful/skill-${skill}`);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.engines.node, '>=24.21.0');
  assert(!pkg.dependencies, 'The distributed skill must not require dependency installation');
}

async function sync(): Promise<void> {
  const source: Source = JSON.parse(await readFile(sourceFile, 'utf8'));
  assert(/^dpp-\d{4}-\d{2}-\d{2}-\d{6}$/.test(source.release), 'Expected a dated dpp release tag');
  const assetName = `${skill}-${source.release.slice(4)}.zip`;
  const release = JSON.parse(
    execFileSync('gh', ['api', `repos/${repo}/releases/tags/${source.release}`], { encoding: 'utf8' }),
  );
  const asset = release.assets.find((item: { name: string }) => item.name === assetName);
  assert(asset && /^sha256:[a-f0-9]{64}$/.test(asset.digest), 'Release asset is missing a SHA-256 digest');
  const digest = asset.digest.slice(7);
  if (source.artifact?.release === source.release)
    assert.equal(digest, source.artifact.sha256, 'Pinned release asset changed');
  const commit = JSON.parse(
    execFileSync('gh', ['api', `repos/${repo}/commits/${source.release}`], { encoding: 'utf8' }),
  ).sha;
  assert(/^[a-f0-9]{40}$/.test(commit), 'Cannot resolve the release commit');
  const temporary = await mkdtemp(join(tmpdir(), 'contentful-env-analysis-'));
  try {
    execFileSync(
      'gh',
      ['release', 'download', source.release, '--repo', repo, '--pattern', assetName, '--dir', temporary],
      { stdio: 'inherit' },
    );
    const files = extractSkill(await readFile(join(temporary, assetName)), digest);
    files.set(
      'THIRD-PARTY-NOTICES.md',
      Buffer.from(await bundledLicenses(Buffer.from(files.get('scripts/main.js')!).toString('utf8'))),
    );
    files.set('LICENSE', await readFile(join(root, 'LICENSE')));
    const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    const pkg = {
      name: `@contentful/skill-${skill}`,
      version,
      type: 'module',
      description: 'Download and analyze a Contentful environment using a local read-only SQLite snapshot.',
      license: 'MIT',
      engines: { node: '>=24.21.0' },
      files: ['SKILL.md', 'scripts/**', 'references/**', 'LICENSE', 'THIRD-PARTY-NOTICES.md'],
    };
    // Download, verify, and prepare everything before replacing the generated output.
    await rm(destination, { recursive: true, force: true });
    for (const [path, data] of files) {
      await mkdir(dirname(join(destination, path)), { recursive: true });
      await writeFile(join(destination, path), data, { mode: path.startsWith('scripts/') ? 0o755 : 0o644 });
    }
    await writeFile(join(destination, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    source.artifact = {
      release: source.release,
      asset: assetName,
      sha256: digest,
      commit,
      files: Object.fromEntries([...files].map(([path, data]) => [path, sha256(data)])),
    };
    await writeFile(sourceFile, JSON.stringify(source, null, 2) + '\n');
    await checkDistribution();
    console.log(`Synced ${skill} from ${source.release} (${commit})`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = process.argv.slice(2);
    assert(
      args.length === 0 || (args.length === 1 && ['--check', '--help'].includes(args[0])),
      'Use --check, --help, or no arguments',
    );
    if (args[0] === '--help')
      console.log(
        'Usage: pnpm sync:env-analysis [--check]\nSync the pinned release, or verify committed output offline.',
      );
    else if (args[0] === '--check') await checkDistribution();
    else await sync();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
