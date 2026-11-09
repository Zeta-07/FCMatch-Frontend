import { cp, readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const targetIndex = args.indexOf('--target');
const targets =
  targetIndex >= 0
    ? [resolve(args[targetIndex + 1])]
    : [resolve(root, 'web'), resolve(root, 'mobile')];
const mappings = [
  ['web/public/assets/branding/Logo.png', 'public/assets/branding/Logo.png'],
  ['web/public/assets/branding/Logo-modo-oscuro.png', 'public/assets/branding/Logo-modo-oscuro.png'],
  ['web/src/styles/themes.scss', 'src/styles/themes.scss'],
  ['web/src/styles/responsive.scss', 'src/styles/responsive.scss'],
  ['client-tooling/eslint.config.mjs', 'eslint.config.mjs'],
  ['client-tooling/stylelint.config.mjs', 'stylelint.config.mjs'],
  ['client-tooling/check-colors.mjs', 'scripts/check-colors.mjs'],
  ['client-tooling/configure-env.mjs', 'scripts/configure-env.mjs'],
  ['client-tooling/playwright.config.ts', 'playwright.config.ts'],
  ['client-tooling/infrastructure.spec.ts', 'e2e/infrastructure.spec.ts'],
  ['client-tooling/api-base-url.ts', 'src/app/core/api/api-base-url.ts'],
  ['client-tooling/main.ts', 'src/main.ts'],
  ['client-tooling/theme-init.js', 'public/theme-init.js'],
];
for (const name of await readdir(resolve(root, 'design-system/components'))) {
  mappings.push([`design-system/components/${name}`, `src/app/shared/design/${name}`]);
}
for (const target of targets) {
  for (const [source, destination] of mappings) {
    const from = resolve(root, source);
    const to = resolve(target, destination);
    if (check) {
      if (!(await readFile(from)).equals(await readFile(to)))
        throw new Error(`Diseño desincronizado: ${to}`);
    } else {
      await mkdir(dirname(to), { recursive: true });
      if (from !== to) await cp(from, to);
    }
  }
  const fingerprint = createHash('sha256')
    .update(await readFile(resolve(root, 'web/src/styles/themes.scss')))
    .digest('hex');
  console.info(`${check ? 'Verificado' : 'Sincronizado'}: ${target}; tema SHA256 ${fingerprint}`);
}
