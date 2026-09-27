import { useEffect, useState } from 'react';
import { obtenerModoEstudio, type ModoEstudio } from '../theme/theme';

/** Modo claro/oscuro del estudio 3D: sigue al sistema y a `data-tema` en <html>. */
export function useModoEstudio(): ModoEstudio {
  const [modo, setModo] = useState<ModoEstudio>(obtenerModoEstudio);

  useEffect(() => {
    const actualizar = () => setModo(obtenerModoEstudio());
    const consulta = window.matchMedia('(prefers-color-scheme: light)');
    consulta.addEventListener('change', actualizar);
    const observador = new MutationObserver(actualizar);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    return () => {
      consulta.removeEventListener('change', actualizar);
      observador.disconnect();
    };
  }, []);

  return modo;
}
