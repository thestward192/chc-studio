import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** Escritorio con mouse: único caso en el que se carga la escena 3D de la mascota. */
const CONSULTA_3D = '(min-width: 1024px) and (pointer: fine)';

/**
 * true si se puede mostrar la mascota en 3D: escritorio con mouse, sin
 * movimiento reducido y con WebGL. En el resto de casos se usa el póster
 * (o nada, donde la mascota solo es un adorno).
 */
export function useMascota3D(): boolean {
  const reducido = usePrefersReducedMotion();
  const escritorio = useCoincideMedia(CONSULTA_3D);
  return escritorio && !reducido && soportaWebGL();
}

function useCoincideMedia(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const media = window.matchMedia(consulta);
    const alCambiar = () => setCoincide(media.matches);
    media.addEventListener('change', alCambiar);
    return () => media.removeEventListener('change', alCambiar);
  }, [consulta]);
  return coincide;
}

let webglCache: boolean | undefined;
function soportaWebGL(): boolean {
  if (webglCache === undefined) {
    try {
      const lienzo = document.createElement('canvas');
      const gl = lienzo.getContext('webgl2') ?? lienzo.getContext('webgl');
      webglCache = !!gl;
      (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}
