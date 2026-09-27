import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { useEstudio } from './estadoEstudio';
import { ambiente } from './ambiente';
import { audio, cantidadPistas } from './audio';

interface Props {
  id: string;
  posicion: [number, number, number];
  rotY: number;
  foco: { pos: [number, number, number]; objetivo: [number, number, number] };
  modelo?: string;
}

/** Radio/parlante: música lo-fi sintetizada (ver audio.ts). El cono vibra al sonar. */
export function Radio({ id, posicion, rotY, foco, modelo }: Props) {
  const m = obtenerMateriales();
  const cono = useRef<THREE.Mesh>(null);
  const cuerpo = useMemo(() => rastrear(new RoundedBoxGeometry(0.3, 0.19, 0.12, 3, 0.02)), []);
  useEffect(() => () => liberar(cuerpo), [cuerpo]);

  useFrame(() => {
    if (!cono.current) return;
    const suena = useEstudio.getState().musica && !ambiente.reducido;
    cono.current.scale.setScalar(suena ? 1 + Math.max(0, Math.sin(ambiente.t * 16)) * 0.05 : 1);
  });

  const reproducir = () => {
    const estado = useEstudio.getState();
    if (estado.musica) {
      audio.detenerMusica();
      estado.set({ musica: false });
    } else {
      audio.reproducirMusica(estado.pistaMusica);
      estado.set({ musica: true, sonido: true });
    }
  };
  const siguiente = () => {
    const pista = audio.siguientePista();
    useEstudio.getState().set({ musica: true, sonido: true, pistaMusica: pista });
  };

  return (
    <ObjetoInteractivo
      id={id}
      nombre="Radio lo-fi"
      etiqueta="Música"
      posicion={posicion}
      rotY={rotY}
      modelo={modelo}
      foco={foco}
      info={() => {
        const e = useEstudio.getState();
        return e.musica
          ? `Sonando: pista ${e.pistaMusica + 1} de ${cantidadPistas} (sintetizada en vivo).`
          : 'Música lo-fi generada con Web Audio API, sin archivos.';
      }}
      acciones={[
        { label: () => (useEstudio.getState().musica ? '⏸ Pausar' : '▶ Reproducir'), run: reproducir },
        { label: () => '⏭ Siguiente', run: siguiente },
      ]}
    >
      <mesh position={[0, 0.095, 0]} geometry={cuerpo} material={m.maderaOscura} castShadow />
      {/* Rejilla y cono del parlante */}
      <mesh position={[-0.06, 0.1, 0.061]} material={m.metal}>
        <circleGeometry args={[0.065, 24]} />
      </mesh>
      <mesh ref={cono} position={[-0.06, 0.1, 0.062]} material={m.plastico}>
        <circleGeometry args={[0.035, 20]} />
      </mesh>
      {/* Dial y perilla */}
      <mesh position={[0.08, 0.13, 0.061]} material={m.ceramica}>
        <planeGeometry args={[0.1, 0.035]} />
      </mesh>
      <mesh position={[0.08, 0.065, 0.068]} rotation-x={Math.PI / 2} material={m.cromo}>
        <cylinderGeometry args={[0.018, 0.018, 0.016, 16]} />
      </mesh>
      {/* Antena */}
      <mesh position={[0.12, 0.3, -0.03]} rotation-z={-0.35} material={m.cromo}>
        <cylinderGeometry args={[0.003, 0.003, 0.26, 6]} />
      </mesh>
    </ObjetoInteractivo>
  );
}
