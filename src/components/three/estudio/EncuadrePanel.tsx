import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';
import { useEstudio } from './estadoEstudio';
import { obtenerInteractivo } from './useInteractivo';

/**
 * Con el panel abierto, desplaza el encuadre de la cámara (setViewOffset)
 * para que el objeto enfocado quede centrado en la parte visible: a la
 * izquierda del panel en escritorio y por encima de la hoja inferior en
 * móvil. El desplazamiento se anima con suavidad.
 */
export function EncuadrePanel() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const actual = useRef({ x: 0, y: 0 });

  useFrame((_, dt) => {
    const seleccionado = useEstudio.getState().seleccionado;
    const movil = size.width <= 700;
    let x = 0;
    let y = 0;
    if (seleccionado) {
      if (movil) {
        y = size.height * 0.24; // la hoja ocupa hasta el 55 % inferior
      } else {
        const anchoPanel = obtenerInteractivo(seleccionado)?.ancho ? 640 : 380;
        x = Math.min(anchoPanel + 16, size.width * 0.6) / 2;
      }
    }
    const a = actual.current;
    const k = 1 - Math.exp(-dt * 6);
    a.x += (x - a.x) * k;
    a.y += (y - a.y) * k;
    if (Math.abs(a.x - x) < 0.3 && Math.abs(a.y - y) < 0.3) {
      a.x = x;
      a.y = y;
    } else {
      invalidate();
    }
    if (a.x === 0 && a.y === 0) {
      if (camera.view?.enabled) camera.clearViewOffset();
    } else {
      camera.setViewOffset(size.width, size.height, a.x, a.y, size.width, size.height);
    }
  });

  return null;
}
