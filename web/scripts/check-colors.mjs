import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await check(path);
    else if (/\.(ts|html)$/.test(entry.name)) {
      const source = await readFile(path, 'utf8');
      if (
        /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(|(?:color|background|fill|stroke)\s*[:=]\s*["']?(?:red|green|blue|black|white|gray|grey|yellow|orange|purple)\b/i.test(
          source,
        )
      ) {
        throw new Error(`Color fijo fuera de themes.scss: ${path}`);
      }
    }
  }
}
await check('src');
console.info('Plantillas y TypeScript sin colores fijos.');
