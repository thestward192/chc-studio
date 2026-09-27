import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sala } from '../../../theme/theme';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { estudioConfig as cfg } from './estudio.config';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { texturaHalo } from './texturas';
import { useEstudio } from './estadoEstudio';
import { audio } from './audio';
import { DECORATIVA, sinRaycast } from './useInteractivo';

interface Props {
  id: string;
  /** Posición en el mundo (se calcula desde el escritorio). */
  posicion: [number, number, number];
  rotY: number;
  foco: { pos: [number, number, number]; objetivo: [number, number, number] };
  modelo?: string;
}

/**
 * Lámpara de escritorio articulada. Su "luz" es un disco emisivo (con
 * bloom) y un halo cálido sobre la mesa: no es una luz real.
 */
export function Lampara({ id, posicion, rotY, foco, modelo }: Props) {
  const m = obtenerMateriales();
  const recursos = useMemo(() => {
    const bombilla = rastrear(m.emisivoLampara.clone());
    const halo = rastrear(
      new THREE.MeshBasicMaterial({
        map: texturaHalo(),
        color: sala.lampara,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.55,
      }),
    );
    return { bombilla, halo, encendido: 1 };
  }, [m.emisivoLampara]);
  useEffect(() => () => liberar(recursos.bombilla, recursos.halo), [recursos]);

  useFrame((_, dt) => {
    const objetivo = useEstudio.getState().lampara ? 1 : 0;
    recursos.encendido += (objetivo - recursos.encendido) * (1 - Math.exp(-dt * 10));
    recursos.bombilla.emissiveIntensity = recursos.encendido * cfg.luces.lampara;
    recursos.halo.opacity = recursos.encendido * 0.55;
  });

  const alternar = () => {
    audio.clic();
    const estado = useEstudio.getState();
    estado.set({ lampara: !estado.lampara });
  };

  return (
    <ObjetoInteractivo
      id={id}
      nombre="Lámpara de escritorio"
      etiqueta="Luz"
      posicion={posicion}
      rotY={rotY}
      modelo={modelo}
      foco={foco}
      info={() => (useEstudio.getState().lampara ? 'Encendida: modo concentración.' : 'Apagada.')}
      acciones={[{ label: () => (useEstudio.getState().lampara ? 'Apagar' : 'Encender'), run: alternar }]}
    >
      <mesh position={[0, 0.01, 0]} material={m.metal} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.02, 20]} />
      </mesh>
      <mesh position={[0, 0.2, 0.04]} rotation-x={-0.35} material={m.metal} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
      </mesh>
      <mesh position={[0, 0.4, 0.2]} rotation-x={1.1} material={m.metal} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.34, 8]} />
      </mesh>
      {/* Pantalla de la lámpara */}
      <group position={[0, 0.42, 0.36]} rotation-x={0.5}>
        <mesh material={m.metal} castShadow>
          <coneGeometry args={[0.07, 0.1, 20, 1, true]} />
        </mesh>
        <mesh position={[0, -0.045, 0]} rotation-x={Math.PI / 2} material={recursos.bombilla}>
          <circleGeometry args={[0.06, 20]} />
        </mesh>
      </group>
      {/* Halo cálido sobre la mesa */}
      <mesh position={[0, 0.004, 0.45]} rotation-x={-Math.PI / 2} material={recursos.halo} userData={DECORATIVA} raycast={sinRaycast}>
        <planeGeometry args={[0.9, 0.7]} />
      </mesh>
    </ObjetoInteractivo>
  );
}
