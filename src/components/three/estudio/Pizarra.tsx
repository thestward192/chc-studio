import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { proceso } from '../../../content/proceso';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { estudioConfig as cfg, focoFrontal } from './estudio.config';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { texturaPizarra } from './texturas';

const ANCHO = 1.6;
const ALTO = 1.0;

/** Pizarra blanca con el diagrama "cómo trabajamos" (pasos de content/proceso.ts). */
export function Pizarra({ modelo }: { modelo?: string }) {
  const m = obtenerMateriales();
  const material = useMemo(
    () => rastrear(new THREE.MeshStandardMaterial({ map: texturaPizarra(proceso), roughness: 0.35 })),
    [],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  const colocacion = cfg.objetos.pizarra;

  return (
    <ObjetoInteractivo
      id="pizarra"
      nombre="Cómo trabajamos"
      etiqueta="Pizarra"
      posicion={colocacion.pos}
      rotY={colocacion.rotY}
      modelo={modelo}
      foco={focoFrontal(colocacion, 1.7)}
      info={proceso.map((paso, i) => `${i + 1}. ${paso.titulo}: ${paso.detalle}`).join('\n')}
      acciones={[]}
    >
      <mesh position={[0, 0, 0.02]} material={m.metalClaro} castShadow>
        <boxGeometry args={[ANCHO + 0.06, ALTO + 0.06, 0.03]} />
      </mesh>
      <mesh position={[0, 0, 0.036]} material={material}>
        <planeGeometry args={[ANCHO, ALTO]} />
      </mesh>
      {/* Bandeja con rotuladores */}
      <mesh position={[0, -ALTO / 2 - 0.04, 0.07]} material={m.metalClaro}>
        <boxGeometry args={[0.7, 0.02, 0.07]} />
      </mesh>
      {[-0.2, -0.1, 0.05].map((x, i) => (
        <mesh key={x} position={[x, -ALTO / 2 - 0.02, 0.075]} rotation-z={Math.PI / 2} material={i === 1 ? m.maceta : m.plastico}>
          <cylinderGeometry args={[0.01, 0.01, 0.13, 8]} />
        </mesh>
      ))}
    </ObjetoInteractivo>
  );
}
