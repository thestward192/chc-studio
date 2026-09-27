#!/usr/bin/env node
/**
 * Muestra el peso total (JS + CSS enlazados directamente en el <head>) de
 * cada página HTML generada por `vite build`. Ayuda a vigilar los
 * presupuestos del README: inicio < 1 MB antes de interactuar, sala de
 * proyectos < 5 MB, cada habitación del equipo < 4 MB. Esos presupuestos
 * incluyen lo que se carga por import dinámico al entrar a una sala 3D, que
 * este script reporta aparte (no se paga hasta que el usuario llega ahí).
 *
 * Uso: npm run build && npm run peso-build
 */
import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';

async function listarHtml(dir) {
  const encontrados = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...(await listarHtml(ruta)));
    } else if (entrada.name.endsWith('.html')) {
      encontrados.push(ruta);
    }
  }
  return encontrados;
}

async function tamano(rutaAbsoluta) {
  try {
    return (await stat(rutaAbsoluta)).size;
  } catch {
    return 0;
  }
}

function formatearKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  let paginas;
  try {
    paginas = await listarHtml(DIST);
  } catch {
    console.error(`No se encontró la carpeta "${DIST}". Ejecuta primero "npm run build".`);
    process.exit(1);
  }

  console.log('Peso del bundle inicial por página (JS + CSS enlazados en el <head>):\n');

  for (const pagina of paginas.sort()) {
    const html = await readFile(pagina, 'utf-8');
    const rutas = new Set();
    for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
      rutas.add(match[1]);
    }

    let total = 0;
    for (const ruta of rutas) {
      total += await tamano(path.join(DIST, ruta.replace(/^\//, '')));
    }

    console.log(`  ${path.relative(DIST, pagina).padEnd(35)} ${formatearKB(total)}`);
  }

  console.log(
    '\nNota: las escenas 3D (Three.js/R3F) se cargan con import dinámico y no aparecen aquí — ese peso solo se paga si el usuario entra a esa sala. Revísalo con las herramientas de red del navegador.',
  );
}

main();
