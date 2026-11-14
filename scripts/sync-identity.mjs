import { cp, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Copies versioned sources between the two independent applications, never runtime imports.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const files = [
  'core/api/identity-api.ts',
  'core/session/action-link.ts',
  'core/session/session.ts',
  'core/session/session-guard.ts',
];
for (const folder of ['shared/identity', 'features/identity']) {
  for (const name of await readdir(resolve(root, 'web/src/app', folder)))
    files.push(`${folder}/${name}`);
}
for (const file of files) {
  const source = resolve(root, 'web/src/app', file);
  const destination = resolve(root, 'mobile/src/app', file);
  if (check) {
    if (!(await readFile(source)).equals(await readFile(destination)))
      throw new Error(`Identidad desincronizada: ${file}`);
  } else {
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination);
  }
}
const sourceStyle = resolve(root, 'web/src/styles/identity.scss');
const destinationStyle = resolve(root, 'mobile/src/styles/identity.scss');
if (check) {
  if (!(await readFile(sourceStyle)).equals(await readFile(destinationStyle)))
    throw new Error('Estilos de identidad desincronizados.');
} else await cp(sourceStyle, destinationStyle);
for (const app of ['web', 'mobile'])
  for (const name of ['identity.spec.ts', 'identity-real.spec.ts']) {
    const sourceTest = resolve(root, 'client-tooling', name);
    const destinationTest = resolve(root, app, 'e2e', name);
    if (check) {
      if (!(await readFile(sourceTest)).equals(await readFile(destinationTest)))
        throw new Error('Pruebas de identidad desincronizadas.');
    } else await cp(sourceTest, destinationTest);
  }
console.info(
  `${check ? 'Verificadas' : 'Distribuidas'} ${files.length} fuentes de identidad web/móvil. Rutas y configuración siguen independientes.`,
);
