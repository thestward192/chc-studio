import * as THREE from 'three';
import { sala } from '../../../theme/theme';
import { rastrear } from './recursos';
import { texturaMadera, texturaTela } from './texturas';

/**
 * Materiales compartidos del estudio (se crean una vez y se reutilizan en
 * todos los objetos). Los metálicos se listan aparte para que la
 * iluminación les dé más reflejo del entorno que al resto.
 */
export type MaterialesEstudio = ReturnType<typeof crear>;

let cache: MaterialesEstudio | null = null;

function crear() {
  const est = (parametros: THREE.MeshStandardMaterialParameters) =>
    rastrear(new THREE.MeshStandardMaterial(parametros));

  const maderaMesa = texturaMadera({ tablas: false, semilla: 19 });
  const maderaSuelo = texturaMadera({ tablas: true, repetir: [3, 2], semilla: 7 });
  const telaSilla = texturaTela(sala.tela, [2, 2], 3);

  const metal = est({ color: sala.metal, metalness: 0.85, roughness: 0.38 });
  const metalClaro = est({ color: sala.metalClaro, metalness: 0.9, roughness: 0.28 });
  const cromo = est({ color: sala.metalClaro, metalness: 1, roughness: 0.12 });

  const materiales = {
    suelo: est({ map: maderaSuelo, roughness: 0.62, metalness: 0 }),
    pared: est({ color: sala.pared, roughness: 0.92 }),
    paredFondo: est({ color: sala.paredFondo, roughness: 0.88 }),
    techo: est({ color: sala.techo, roughness: 0.95 }),
    zocalo: est({ color: sala.zocalo, roughness: 0.7 }),
    madera: est({ map: maderaMesa, roughness: 0.48 }),
    maderaOscura: est({ color: sala.maderaOscura, roughness: 0.55 }),
    metal,
    metalClaro,
    cromo,
    plastico: est({ color: sala.marco, roughness: 0.45, metalness: 0.1 }),
    tela: est({ map: telaSilla, roughness: 0.95 }),
    ceramica: est({ color: sala.ceramica, roughness: 0.25 }),
    planta: est({ color: sala.planta, roughness: 0.75, side: THREE.DoubleSide }),
    plantaOscura: est({ color: sala.plantaOscura, roughness: 0.8, side: THREE.DoubleSide }),
    maceta: est({ color: sala.maceta, roughness: 0.85 }),
    rack: est({ color: sala.rack, metalness: 0.6, roughness: 0.45 }),
    marco: est({ color: sala.marco, roughness: 0.4, metalness: 0.3 }),
    pizarra: est({ color: sala.pizarra, roughness: 0.3 }),
    /** Lámparas y tubos: emisivos (el bloom hace el resto, no son luces reales). */
    emisivoLampara: est({ color: sala.lampara, emissive: new THREE.Color(sala.lampara), emissiveIntensity: 2.5 }),
  };

  return { ...materiales, metales: [metal, metalClaro, cromo, materiales.rack] as THREE.MeshStandardMaterial[] };
}

export function obtenerMateriales(): MaterialesEstudio {
  if (!cache) cache = crear();
  return cache;
}

/** Se llama al desmontar la escena (los recursos ya se liberan en recursos.ts). */
export function olvidarMateriales() {
  cache = null;
}
