#!/usr/bin/env node
/**
 * Comprime todos los .glb/.gltf de una carpeta de entrada con gltf-transform
 * (Draco para geometría, KTX2/Basis para texturas) y los deja listos en
 * public/models/.
 *
 * Uso:
 *   npm run optimizar-modelos
 *   npm run optimizar-modelos -- --entrada=otra-carpeta --salida=public/models
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ejecutar = promisify(execFile);

function leerArgumento(nombre, porDefecto) {
  const prefijo = `--${nombre}=`;
  const encontrado = process.argv.find((arg) => arg.startsWith(prefijo));
  return encontrado ? encontrado.slice(prefijo.length) : porDefecto;
}

const carpetaEntrada = leerArgumento('entrada', 'models-entrada');
const carpetaSalida = leerArgumento('salida', 'public/models');

async function main() {
  await mkdir(carpetaSalida, { recursive: true });

  let archivos = [];
  try {
    archivos = (await readdir(carpetaEntrada)).filter((nombre) =>
      /\.(glb|gltf)$/i.test(nombre),
    );
  } catch {
    console.error(
      `No se encontró la carpeta de entrada "${carpetaEntrada}". Crea esa carpeta y pon ahí tus .glb/.gltf originales, o indica otra con --entrada=ruta.`,
    );
    process.exit(1);
  }

  if (archivos.length === 0) {
    console.log(`No hay archivos .glb/.gltf en "${carpetaEntrada}". Nada que optimizar.`);
    return;
  }

  for (const archivo of archivos) {
    const entrada = path.join(carpetaEntrada, archivo);
    const salida = path.join(carpetaSalida, archivo.replace(/\.gltf$/i, '.glb'));
    console.log(`Optimizando ${entrada} → ${salida}`);
    try {
      // draco: compresión de geometría. webp/ktx2: compresión de texturas.
      // resize limita el tamaño máximo de textura para no sobrepasar los
      // presupuestos de peso por página descritos en el README.
      await ejecutar(
        'npx',
        [
          '--yes',
          '@gltf-transform/cli',
          'optimize',
          entrada,
          salida,
          '--compress',
          'draco',
          '--texture-compress',
          'ktx2',
        ],
        { shell: true },
      );
      console.log(`  listo: ${salida}`);
    } catch (error) {
      console.error(`  falló la optimización de ${archivo}:`, error.message);
    }
  }
}

main();
