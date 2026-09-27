import { useEstudio } from '../../three/estudio/estadoEstudio';
import { audio } from '../../three/estudio/audio';
import { puente } from '../../three/estudio/puente';

/**
 * Acciones de la interfaz del estudio (las usan el HUD, el menú de pausa y
 * los atajos de teclado). No importan three.js: hablan con la escena a
 * través de puente.ts.
 */
export function alternarNoche() {
  const e = useEstudio.getState();
  e.set({ noche: !e.noche });
  audio.clic();
}

export function alternarSonido() {
  const e = useEstudio.getState();
  if (e.sonido) {
    audio.desactivar();
    e.set({ sonido: false, musica: false });
  } else {
    audio.activar(); // gesto del usuario: aquí se crea el AudioContext
    e.set({ sonido: true });
    audio.clic();
  }
}

export function alternarPausa() {
  const e = useEstudio.getState();
  e.set({ pausa: !e.pausa });
  audio.clic();
}

export function abrirMenu(abierto = true) {
  useEstudio.getState().set({ menu: abierto });
  audio.clic();
}

export function irAVistaGeneral() {
  puente.cerrarPanel();
  useEstudio.getState().set({ menu: false });
  puente.vistaGeneral();
}

/** "Entrar" de la pantalla de carga: vuelo desde la entrada hasta la vista general. */
export function entrarAlEstudio() {
  const e = useEstudio.getState();
  if (e.fase !== 'listo') return;
  e.set({ fase: 'entrando' });
  puente.vistaGeneral({
    duracion: 2400,
    alTerminar: () => useEstudio.getState().set({ fase: 'explorando' }),
  });
}
