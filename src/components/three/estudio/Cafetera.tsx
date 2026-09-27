import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three-stdlib';
import { sala } from '../../../theme/theme';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { estudioConfig as cfg, localAMundo } from './estudio.config';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { useEstudio } from './estadoEstudio';
import { Particulas } from './Particulas';
import { Taza } from './Taza';
import { audio } from './audio';

const DURACION_CAFE = 4.5; // s

/**
 * Mueble con cafetera. "Preparar café": vapor de partículas, sonido de
 * goteo y un contador de cafés del día en el panel.
 */
export function Cafetera({ modelo, cantidadVapor }: { modelo?: string; cantidadVapor: number }) {
  const m = obtenerMateriales();
  const invalidate = useThree((s) => s.invalidate);
  const colocacion = cfg.objetos.cafetera;
  const vapor = useRef(0);
  const temporizador = useRef(0);

  const geos = useMemo(
    () => ({
      cuerpo: rastrear(new RoundedBoxGeometry(0.28, 0.38, 0.3, 3, 0.03)),
      mueble: rastrear(new RoundedBoxGeometry(1.0, 0.9, 0.55, 2, 0.02)),
    }),
    [],
  );
  useEffect(
    () => () => {
      window.clearTimeout(temporizador.current);
      liberar(geos.cuerpo, geos.mueble);
    },
    [geos],
  );

  useFrame((_, dt) => {
    const objetivo = useEstudio.getState().preparandoCafe ? 1 : 0;
    vapor.current += (objetivo - vapor.current) * (1 - Math.exp(-dt * 2.5));
  });

  const preparar = () => {
    const estado = useEstudio.getState();
    if (estado.preparandoCafe) return;
    estado.set({ preparandoCafe: true });
    audio.cafe(DURACION_CAFE);
    invalidate();
    temporizador.current = window.setTimeout(() => {
      const e = useEstudio.getState();
      e.set({ preparandoCafe: false, cafes: e.cafes + 1 });
    }, DURACION_CAFE * 1000);
  };

  // Salida del vapor: sobre la boquilla, en coordenadas del mundo
  const origenVapor = localAMundo(colocacion, [0, 1.2, 0.08]);

  return (
    <>
      <ObjetoInteractivo
        id="cafetera"
        nombre="Cafetera"
        etiqueta="Combustible"
        posicion={colocacion.pos}
        rotY={colocacion.rotY}
        modelo={modelo}
        foco={{ pos: localAMundo(colocacion, [0.2, 1.5, 1.45]), objetivo: localAMundo(colocacion, [0, 1.05, 0]) }}
        info={() => {
          const e = useEstudio.getState();
          const estado = e.preparandoCafe ? 'Preparando… ☕' : 'Lista.';
          return `${estado}\nCafés de hoy: ${e.cafes}`;
        }}
        acciones={[
          {
            label: () => (useEstudio.getState().preparandoCafe ? 'Preparando…' : 'Preparar café'),
            run: preparar,
          },
        ]}
      >
        {/* Mueble */}
        <mesh position={[0, 0.45, 0]} geometry={geos.mueble} material={m.maderaOscura} castShadow receiveShadow />
        <mesh position={[0, 0.91, 0]} material={m.madera} receiveShadow>
          <boxGeometry args={[1.04, 0.03, 0.58]} />
        </mesh>
        {/* Cafetera */}
        <mesh position={[0, 1.11, -0.05]} geometry={geos.cuerpo} material={m.metal} castShadow />
        <mesh position={[0, 1.02, 0.1]} material={m.cromo}>
          <cylinderGeometry args={[0.02, 0.015, 0.05, 12]} />
        </mesh>
        <mesh position={[0.1, 1.24, 0.1]} material={m.emisivoLampara}>
          <sphereGeometry args={[0.008, 8, 6]} />
        </mesh>
        <Taza posicion={[0, 0.925, 0.1]} />
        <Taza posicion={[0.32, 0.925, 0.05]} rotY={2} />
      </ObjetoInteractivo>
      <Particulas
        modo="vapor"
        cantidad={cantidadVapor}
        color={sala.ceramica}
        tam={cfg.shaders.particulas.tamVapor}
        origen={[origenVapor[0], 1.02, origenVapor[2]]}
        altura={0.55}
        opacidad={() => vapor.current * 0.35}
      />
    </>
  );
}
