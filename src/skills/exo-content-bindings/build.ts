import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { bundledLicenses } from '../contentful-env-analysis/bundled-licenses.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const distribution = join(root, 'skills/exo-content-bindings');

/** Bundle the command line and its one dependency (graphql) into a single file with no install step. */
export async function buildExoContentBindings(check = false): Promise<void> {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [join(root, 'src/skills/exo-content-bindings/main.mjs')],
    outfile: join(distribution, 'scripts/main.js'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    banner: { js: '#!/usr/bin/env node' },
    metafile: true,
    write: false,
  });
  const files = new Map<string, Uint8Array | string>([
    ['scripts/main.js', result.outputFiles[0].contents],
    ['THIRD-PARTY-NOTICES.md', await bundledLicenses(result.metafile.inputs, root)],
    ['LICENSE', await readFile(join(root, 'LICENSE'))],
  ]);
  if (!check) await mkdir(join(distribution, 'scripts'), { recursive: true });
  for (const [path, data] of files) {
    const target = join(distribution, path);
    if (check) {
      if (!Buffer.from(data).equals(await readFile(target))) {
        throw new Error(`Stale generated file: ${path}. Run pnpm build:exo-content-bindings.`);
      }
    } else await writeFile(target, data);
  }
  if (!check) await chmod(join(distribution, 'scripts/main.js'), 0o755);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args[0] && args[0] !== '--check')) {
    throw new Error('Usage: pnpm build:exo-content-bindings [--check]');
  }
  await buildExoContentBindings(args[0] === '--check');
}
