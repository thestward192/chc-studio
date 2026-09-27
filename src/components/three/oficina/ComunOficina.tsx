import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Integrante } from '../../../content/equipo';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { liberar, rastrear } from '../estudio/recursos';
import { obtenerMateriales } from '../estudio/materiales';
import { focoObjeto, tablero } from './oficinas.config';
import { texturaTablero } from './texturasOficina';

/**
 * Tablero "Lo que hago" sobre el escritorio: nombre, gustos y líneas de
 * marcador donde irá la explicación de lo que hace (contenido pendiente).
 */
export function TableroQueHago({ integrante }: { integrante: Integrante }) {
  const m = obtenerMateriales();
  const [ancho, alto] = tablero.tam;
  const material = useMemo(
    () =>
      rastrear(
        new THREE.MeshBasicMaterial({
          map: texturaTablero(integrante.nombre, integrante.gustos, integrante.colorLuz),
          // Un poco por debajo del blanco puro: que el bloom no haga brillar el texto
          color: new THREE.Color(0.84, 0.84, 0.84),
        }),
      ),
    [integrante],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  const colocacion = { pos: tablero.pos, rotY: 0 };

  return (
    <ObjetoInteractivo
      id="tablero"
      nombre={`Lo que hace ${integrante.nombreCorto}`}
      etiqueta="Pendiente"
      posicion={tablero.pos}
      foco={focoObjeto(colocacion, 1.9, tablero.pos[1] - 0.15, tablero.pos[1] - 0.05)}
      info=""
      pendiente
      acciones={[]}
    >
      <mesh position={[0, 0, 0.012]} material={m.marco} castShadow>
        <boxGeometry args={[ancho + 0.06, alto + 0.06, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.024]} material={material}>
        <planeGeometry args={[ancho, alto]} />
      </mesh>
    </ObjetoInteractivo>
  );
}
