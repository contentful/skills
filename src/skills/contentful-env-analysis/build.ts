import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { bundledLicenses } from './bundled-licenses.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const distribution = join(root, 'skills/contentful-env-analysis');

export async function buildEnvironmentAnalysis(check = false): Promise<void> {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [join(root, 'src/skills/contentful-env-analysis/main.ts')],
    outfile: join(distribution, 'scripts/main.js'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
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
        throw new Error(`Stale generated file: ${path}. Run pnpm build:env-analysis.`);
      }
    } else await writeFile(target, data);
  }
  if (!check) await chmod(join(distribution, 'scripts/main.js'), 0o755);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args[0] && args[0] !== '--check')) {
    throw new Error('Usage: pnpm build:env-analysis [--check]');
  }
  await buildEnvironmentAnalysis(args[0] === '--check');
}
