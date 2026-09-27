import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { estudioConfig as cfg } from './estudio.config';
import { ambiente } from './ambiente';
import { useEstudio } from './estadoEstudio';

const suave = (x: number) => x * x * (3 - 2 * x);

/**
 * Avanza el tiempo de la escena (se detiene en pausa), interpola día/noche
 * en `luces.duracionCambio` ms y mide los FPS reales (para el menú de pausa).
 * Va primero en el orden de useFrame.
 */
export function RelojAmbiente() {
  const progresoNoche = useRef(useEstudio.getState().noche ? 1 : 0);
  const medicion = useRef({ cuadros: 0, desde: performance.now(), ultimo: performance.now() });

  useFrame((state, dtBruto) => {
    const dt = Math.min(dtBruto, 0.1);
    const estado = useEstudio.getState();
    if (!estado.pausa) ambiente.t += dt;

    // Día ↔ noche
    const objetivo = estado.noche ? 1 : 0;
    const paso = dt / (cfg.luces.duracionCambio / 1000);
    const p = progresoNoche.current;
    progresoNoche.current = objetivo > p ? Math.min(objetivo, p + paso) : Math.max(objetivo, p - paso);
    ambiente.noche = suave(progresoNoche.current);
    // Mientras se interpola hay que seguir dibujando aunque el render sea bajo demanda
    if (progresoNoche.current !== objetivo) state.invalidate();

    // FPS medidos (se publican una vez por segundo)
    const m = medicion.current;
    const ahora = performance.now();
    // Tras un hueco (render bajo demanda) se reinicia la medición
    if (ahora - m.ultimo > 250) {
      m.cuadros = 0;
      m.desde = ahora;
    }
    m.ultimo = ahora;
    m.cuadros++;
    if (ahora - m.desde >= 1000) {
      estado.set({ fps: Math.round((m.cuadros * 1000) / (ahora - m.desde)) });
      m.cuadros = 0;
      m.desde = ahora;
    }
  }, -2);

  return null;
}
