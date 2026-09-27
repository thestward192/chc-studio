import { useEffect, useMemo } from 'react';
import { RoundedBoxGeometry } from 'three-stdlib';
import { ConModelo } from '../ModeloGLTF';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';

/** Silla de oficina: asiento y respaldo tapizados, base de cinco patas. */
export function Silla({
  posicion,
  rotY = 0,
  modelo,
}: {
  posicion: [number, number, number];
  rotY?: number;
  modelo?: string;
}) {
  const m = obtenerMateriales();
  const geos = useMemo(
    () => ({
      asiento: rastrear(new RoundedBoxGeometry(0.5, 0.08, 0.48, 3, 0.03)),
      respaldo: rastrear(new RoundedBoxGeometry(0.48, 0.55, 0.07, 3, 0.03)),
    }),
    [],
  );
  useEffect(() => () => liberar(geos.asiento, geos.respaldo), [geos]);

  return (
    <group position={posicion} rotation-y={rotY}>
      <ConModelo url={modelo}>
        <mesh position={[0, 0.48, 0]} geometry={geos.asiento} material={m.tela} castShadow receiveShadow />
        <mesh position={[0, 0.82, 0.23]} rotation-x={-0.12} geometry={geos.respaldo} material={m.tela} castShadow />
        <mesh position={[0, 0.62, 0.22]} material={m.metal}>
          <boxGeometry args={[0.05, 0.28, 0.02]} />
        </mesh>
        <mesh position={[0, 0.28, 0]} material={m.metal} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.36, 12]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <group key={i} rotation-y={a}>
              <mesh position={[0.15, 0.07, 0]} material={m.metal} castShadow>
                <boxGeometry args={[0.3, 0.03, 0.04]} />
              </mesh>
              <mesh position={[0.29, 0.03, 0]} material={m.plastico}>
                <sphereGeometry args={[0.028, 10, 8]} />
              </mesh>
            </group>
          );
        })}
      </ConModelo>
    </group>
  );
}
