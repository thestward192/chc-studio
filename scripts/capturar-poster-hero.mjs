// Genera public/hero/nucleo.webp: render estático del "Núcleo CHC" con la
// pose fija de hero.config.ts (`poster`). Se usa en móvil, con movimiento
// reducido, sin WebGL y como póster mientras carga la escena 3D.
//
// Uso (con el servidor de desarrollo levantado, p. ej. `npm run dev`):
//   node scripts/capturar-poster-hero.mjs [url]
// Requiere Playwright (npm i -g playwright) y Chrome instalado.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  const global = execSync('npm root -g').toString().trim();
  playwright = require(join(global, 'playwright'));
}

const navegador = await playwright.chromium.launch({
  channel: 'chrome',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
await contexto.addInitScript(() => localStorage.setItem('chc-studio:intro-vista', '1'));
const pagina = await contexto.newPage();
await pagina.goto(url, { waitUntil: 'networkidle' });
await pagina.waitForFunction(() => typeof window.__heroPoster === 'function', null, {
  timeout: 20000,
});
const datos = await pagina.evaluate(() => window.__heroPoster(2));
await navegador.close();

const base64 = datos.replace(/^data:image\/webp;base64,/, '');
mkdirSync('public/hero', { recursive: true });
writeFileSync('public/hero/nucleo.webp', Buffer.from(base64, 'base64'));
console.log(`public/hero/nucleo.webp: ${((base64.length * 0.75) / 1024).toFixed(1)} KB`);
