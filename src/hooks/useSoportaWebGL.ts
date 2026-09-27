import { useEffect, useState } from 'react';

function detectarWebGL(): boolean {
  try {
    const lienzo = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (lienzo.getContext('webgl') || lienzo.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/** null mientras no se ha comprobado (evita parpadeo en el primer render). */
export function useSoportaWebGL(): boolean | null {
  const [soporta, setSoporta] = useState<boolean | null>(null);

  useEffect(() => {
    setSoporta(detectarWebGL());
  }, []);

  return soporta;
}
