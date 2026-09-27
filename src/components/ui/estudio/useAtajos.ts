import { useEffect } from 'react';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { puente } from '../../three/estudio/puente';
import { alternarNoche, alternarSonido, irAVistaGeneral } from './acciones';

/**
 * Atajos: Esc cierra (versión simple, menú, panel o pausa), N día/noche,
 * H vista general, M sonido, ←/→ proyecto anterior/siguiente con un cuadro enfocado.
 */
export function useAtajos() {
  useEffect(() => {
    const control = new AbortController();
    window.addEventListener(
      'keydown',
      (ev) => {
        const destino = ev.target as HTMLElement;
        if (destino.closest('input, textarea, [contenteditable]')) return;
        const e = useEstudio.getState();
        if (e.fase !== 'explorando') return;
        switch (ev.key) {
          case 'Escape':
            if (e.versionSimple) e.set({ versionSimple: false });
            else if (e.menu) e.set({ menu: false });
            else if (e.seleccionado) puente.cerrarPanel();
            else if (e.pausa) e.set({ pausa: false });
            break;
          case 'n':
          case 'N':
            alternarNoche();
            break;
          case 'h':
          case 'H':
            irAVistaGeneral();
            break;
          case 'm':
          case 'M':
            alternarSonido();
            break;
          case 'ArrowLeft':
          case 'ArrowRight': {
            const actual = puente.obtener(e.seleccionado);
            if (actual?.grupo !== 'proyecto') return;
            ev.preventDefault();
            const vecino = puente.vecino(actual.id, ev.key === 'ArrowLeft' ? -1 : 1);
            if (vecino) puente.seleccionar(vecino);
            break;
          }
        }
      },
      { signal: control.signal },
    );
    return () => control.abort();
  }, []);
}
