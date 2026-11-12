// Genera las vistas previas de la sección "Nosotros" de Inicio: un render de
// cada oficina del equipo y del taller (la sala de proyectos), tal como se
// ven al entrar, sin la interfaz encima.
//   public/equipo/oficina-<slug>.jpg  y  public/equipo/taller.jpg
//
// Uso (con el servidor de desarrollo levantado, p. ej. `npm run dev`):
//   node scripts/capturar-oficinas.mjs [url-base]
// Requiere Playwright (npm i -g playwright) y Chrome instalado.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '');
const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  const global = execSync('npm root -g').toString().trim();
  playwright = require(join(global, 'playwright'));
}

const salida = join(process.cwd(), 'public', 'equipo');
mkdirSync(salida, { recursive: true });

const escenas = [
  { ruta: '/equipo/integrante-1.html', archivo: 'oficina-integrante-1.jpg' },
  { ruta: '/equipo/integrante-2.html', archivo: 'oficina-integrante-2.jpg' },
  { ruta: '/equipo/integrante-3.html', archivo: 'oficina-integrante-3.jpg' },
  { ruta: '/equipo/integrante-4.html', archivo: 'oficina-integrante-4.jpg' },
  { ruta: '/estudio.html', archivo: 'taller.jpg' },
];

const navegador = await playwright.chromium.launch({
  channel: 'chrome',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
});

for (const { ruta, archivo } of escenas) {
  const contexto = await navegador.newContext({ viewport: { width: 1600, height: 1000 } });
  const pagina = await contexto.newPage();
  await pagina.goto(`${base}${ruta}?calidad=alto`, { waitUntil: 'networkidle' });
  // Pantalla de carga: esperar al botón de entrar y pulsarlo
  const entrar = pagina.getByRole('button', { name: /entrar/i }).first();
  await entrar.waitFor({ timeout: 30000 });
  await pagina.waitForTimeout(1500);
  await entrar.click();
  await pagina.waitForTimeout(5000);
  // Sin interfaz encima: solo la escena
  await pagina.addStyleTag({ content: '.eui, .transicion-pagina { display: none !important; }' });
  await pagina.waitForTimeout(600);
  await pagina.screenshot({ path: join(salida, archivo), type: 'jpeg', quality: 82 });
  console.log(`✓ ${archivo}`);
  await contexto.close();
}

await navegador.close();
