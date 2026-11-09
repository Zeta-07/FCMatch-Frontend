import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';

let local = {};
try {
  local = parseEnv(await readFile('.env', 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const apiBaseUrl =
  process.env['PUBLIC_API_BASE_URL'] ??
  local['PUBLIC_API_BASE_URL'] ??
  'http://localhost:3000/api/v1';
if (!/^https?:\/\//.test(apiBaseUrl) && !apiBaseUrl.startsWith('/'))
  throw new Error('PUBLIC_API_BASE_URL no es válida.');
await mkdir('public', { recursive: true });
await writeFile(
  'public/config.json',
  JSON.stringify({ apiBaseUrl: apiBaseUrl.replace(/\/$/, '') }, null, 2) + '\n',
);
console.info('Configuración pública generada; no contiene credenciales.');
