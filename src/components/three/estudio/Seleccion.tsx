import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEstudio } from './estadoEstudio';
import { idDesdeObjeto, obtenerInteractivo, raicesInteractivas, seleccionar } from './useInteractivo';
import { audio } from './audio';

const MAX_MOVIMIENTO_CLIC = 8; // px
const MAX_DURACION_CLIC = 450; // ms

/**
 * Hover y clic sobre los objetos interactivos.
 * - Hover (ratón): como mucho un raycast por fotograma, solo si el puntero se movió.
 * - Clic corto (< 8 px y < 450 ms) para no confundirlo con arrastrar la cámara.
 * - En táctil no hay hover: el toque hace un único raycast al soltar.
 * Las paredes (userData.bloquea) tapan lo que haya detrás.
 */
export function Seleccion() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const versionConfig = useEstudio((s) => s.versionConfig);

  const estado = useRef({
    raycaster: new THREE.Raycaster(),
    ndc: new THREE.Vector2(),
    sucio: false,
    abajo: null as null | { x: number; y: number; t: number; tipo: string },
    bloqueadores: [] as THREE.Object3D[],
  });

  // Paredes, suelo y techo: bloquean el rayo
  useEffect(() => {
    const lista: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o.userData.bloquea) lista.push(o);
    });
    estado.current.bloqueadores = lista;
  }, [scene, versionConfig]);

  const lanzarRayo = () => {
    const e = estado.current;
    e.raycaster.setFromCamera(e.ndc, camera);
    const impactos = e.raycaster.intersectObjects([...raicesInteractivas(), ...e.bloqueadores], true);
    return impactos.length ? idDesdeObjeto(impactos[0].object) : null;
  };

  const cambiarHover = (id: string | null) => {
    const actual = useEstudio.getState().hover;
    if (actual === id) return;
    obtenerInteractivo(actual)?.alHover?.(false);
    obtenerInteractivo(id)?.alHover?.(true);
    useEstudio.getState().set({ hover: id });
    gl.domElement.style.cursor = id ? 'pointer' : '';
    invalidate();
  };

  const puedeInteractuar = () => {
    const s = useEstudio.getState();
    return s.fase === 'explorando' && !s.enVuelo && !s.menu && !s.puertaEntrando;
  };

  useEffect(() => {
    const control = new AbortController();
    const { signal } = control;
    const lienzo = gl.domElement;
    const e = estado.current;
    const aNdc = (ev: PointerEvent) => {
      const r = lienzo.getBoundingClientRect();
      e.ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    };

    lienzo.addEventListener(
      'pointermove',
      (ev) => {
        if (ev.pointerType !== 'mouse') return;
        aNdc(ev);
        e.sucio = true;
        invalidate();
      },
      { signal },
    );
    lienzo.addEventListener('pointerleave', () => cambiarHover(null), { signal });
    lienzo.addEventListener(
      'pointerdown',
      (ev) => {
        e.abajo = { x: ev.clientX, y: ev.clientY, t: performance.now(), tipo: ev.pointerType };
      },
      { signal },
    );
    lienzo.addEventListener(
      'pointerup',
      (ev) => {
        const abajo = e.abajo;
        e.abajo = null;
        if (!abajo || !puedeInteractuar()) return;
        const movimiento = Math.hypot(ev.clientX - abajo.x, ev.clientY - abajo.y);
        if (movimiento >= MAX_MOVIMIENTO_CLIC || performance.now() - abajo.t >= MAX_DURACION_CLIC) return;
        // Con ratón ya sabemos qué hay debajo (hover); en táctil, un solo rayo ahora
        let id = useEstudio.getState().hover;
        if (abajo.tipo !== 'mouse') {
          aNdc(ev);
          id = lanzarRayo();
        }
        if (id) {
          audio.clic();
          seleccionar(id);
        }
      },
      { signal },
    );
    return () => control.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera]);

  useFrame(() => {
    const e = estado.current;
    // Durante vuelos, menú o puerta: nada bajo el puntero (y sin tooltip)
    if (!puedeInteractuar()) {
      if (useEstudio.getState().hover) cambiarHover(null);
      return;
    }
    if (!e.sucio) return;
    e.sucio = false;
    cambiarHover(lanzarRayo());
  });

  return null;
}
