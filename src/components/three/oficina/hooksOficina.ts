import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { marca } from '../../../theme/theme';
import { ambiente } from '../estudio/ambiente';
import { useEstudio } from '../estudio/estadoEstudio';
import { liberar, rastrear } from '../estudio/recursos';
import {
  crearUniformsPantallaJuego,
  fragmentPantallaJuego,
  vertexPantallaJuego,
} from '../shaders/pantallaJuego';

/** Materiales de color propios de una oficina (se liberan al desmontar). */
export function useMateriales<T extends Record<string, THREE.MeshStandardMaterialParameters>>(
  definiciones: T,
) {
  const materiales = useMemo(() => {
    const salida = {} as Record<keyof T, THREE.MeshStandardMaterial>;
    for (const clave in definiciones) {
      salida[clave] = rastrear(new THREE.MeshStandardMaterial(definiciones[clave]));
    }
    return salida;
    // Las definiciones son constantes de cada oficina
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => liberar(...Object.values(materiales)), [materiales]);
  return materiales;
}

/**
 * Material de pantalla de videojuego (ver shaders/pantallaJuego.ts). Avanza
 * con el reloj de la escena; `encendida()` decide si se ve el juego. Si el
 * objeto está enfocado (panel abierto, render bajo demanda) sigue pidiendo
 * fotogramas para que la pantalla no se congele.
 */
export function usePantallaJuego(opciones: {
  modo: 0 | 1;
  colorA: string;
  colorB: string;
  id: string;
  encendida: () => boolean;
}) {
  const recursos = useMemo(() => {
    const u = crearUniformsPantallaJuego();
    u.uColorA.value.set(opciones.colorA);
    u.uColorB.value.set(opciones.colorB);
    u.uFondo.value.set(marca.fondoOscuro);
    const material = rastrear(
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: vertexPantallaJuego,
        fragmentShader: fragmentPantallaJuego,
        defines: { MODO: opciones.modo },
        toneMapped: false,
      }),
    );
    return { u, material, encendido: 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => liberar(recursos.material), [recursos]);

  useFrame((state, dt) => {
    const objetivo = opciones.encendida() ? 1 : 0;
    recursos.encendido += (objetivo - recursos.encendido) * (1 - Math.exp(-dt * 8));
    recursos.u.uEncendido.value = recursos.encendido;
    recursos.u.uTiempo.value = ambiente.reducido ? 2 : ambiente.t;
    const enfocado = useEstudio.getState().seleccionado === opciones.id;
    if ((enfocado && !ambiente.reducido) || Math.abs(objetivo - recursos.encendido) > 0.01)
      state.invalidate();
  });

  return recursos.material;
}
