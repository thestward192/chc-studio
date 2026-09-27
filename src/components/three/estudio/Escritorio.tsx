import { ConModelo } from '../ModeloGLTF';
import { localAMundo, type Colocacion } from './estudio.config';
import { obtenerMateriales } from './materiales';
import { Monitor } from './Monitor';
import { Teclado } from './Teclado';
import { Taza } from './Taza';
import { Silla } from './Silla';
import { Lampara } from './Lampara';
import { Radio } from './Radio';
import { Planta } from './Planta';

interface Props {
  colocacion: Colocacion;
  indice: number;
  /** Qué lleva encima además de monitor, teclado y taza. */
  extra: 'lampara' | 'radio';
  /** El primer escritorio tiene el monitor principal (interactivo). */
  principal?: boolean;
  modelo?: string;
}

const ALTO = 0.74;

/**
 * Escritorio de trabajo: tablero de madera, patas metálicas, monitor,
 * teclado, taza, silla y una lámpara o una radio. El usuario se sienta del
 * lado +Z (la pantalla mira hacia la entrada).
 */
export function Escritorio({ colocacion, indice, extra, principal, modelo }: Props) {
  const m = obtenerMateriales();
  const mundo = (x: number, y: number, z: number) => localAMundo(colocacion, [x, y, z]);

  return (
    <>
      <group position={colocacion.pos} rotation-y={colocacion.rotY}>
        <ConModelo url={modelo}>
          {/* Tablero */}
          <mesh position={[0, ALTO - 0.02, 0]} material={m.madera} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.04, 0.75]} />
          </mesh>
          {/* Patas y travesaño */}
          {[-0.7, 0.7].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, (ALTO - 0.04) / 2, 0]} material={m.metal} castShadow>
                <boxGeometry args={[0.04, ALTO - 0.04, 0.04]} />
              </mesh>
              <mesh position={[0, 0.02, 0]} material={m.metal} castShadow>
                <boxGeometry args={[0.05, 0.03, 0.66]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.5, -0.3]} material={m.metal}>
            <boxGeometry args={[1.36, 0.03, 0.03]} />
          </mesh>
        </ConModelo>

        <Monitor
          posicion={[0, ALTO, -0.2]}
          semilla={indice * 3.7 + 1}
          principal={
            principal
              ? { id: 'monitor-principal', foco: { pos: mundo(0.05, 1.18, 0.62), objetivo: mundo(0, 1.1, -0.2) } }
              : undefined
          }
        />
        <Teclado posicion={[0, ALTO, 0.12]} />
        <Taza posicion={[0.5, ALTO, 0.08]} rotY={indice * 1.3} />
        {extra === 'radio' && <Planta posicion={[0.6, ALTO, -0.22]} escala={0.35} />}
      </group>

      {/* Objetos interactivos: se colocan en coordenadas del mundo */}
      {extra === 'lampara' ? (
        <Lampara
          id="lampara"
          posicion={mundo(-0.6, ALTO, -0.25)}
          rotY={colocacion.rotY}
          foco={{ pos: mundo(-0.35, 1.35, 0.85), objetivo: mundo(-0.5, 0.85, -0.1) }}
        />
      ) : (
        <Radio
          id="radio"
          posicion={mundo(-0.52, ALTO, -0.12)}
          rotY={colocacion.rotY + 0.25}
          foco={{ pos: mundo(-0.4, 1.2, 0.75), objetivo: mundo(-0.52, 0.85, -0.12) }}
        />
      )}
      <Silla posicion={mundo(0, 0, 0.72)} rotY={colocacion.rotY + (indice ? 0.25 : -0.2)} />
    </>
  );
}
