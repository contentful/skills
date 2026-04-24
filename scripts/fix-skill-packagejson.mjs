/**
 * Post-build fix for skill-kit skills.
 *
 * skill-kit build overwrites package.json with a minimal {name, version}.
 * This script restores the fields that the repo convention requires:
 * scoped name, description, license, and files array.
 *
 * Run after `pnpm run build` in the release pipeline.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const rootPkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const repoVersion = rootPkg.version;

const skillsDir = 'skills';
const dirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const dir of dirs) {
  const pkgPath = join(skillsDir, dir, 'package.json');
  if (!existsSync(pkgPath)) continue;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const isSkillKit = existsSync(join(skillsDir, dir, 'bin'));

  pkg.version = repoVersion;

  if (!pkg.name.startsWith('@contentful/skill-')) {
    pkg.name = `@contentful/skill-${dir}`;
  }

  if (!pkg.license) pkg.license = 'MIT';

  if (isSkillKit && !pkg.files) {
    pkg.files = ['SKILL.md', 'scripts/**', 'bin/**', 'references/**'];
  } else if (!pkg.files) {
    pkg.files = ['SKILL.md', 'references/**'];
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

console.log(`Fixed ${dirs.length} skill package.json files (version ${repoVersion})`);
