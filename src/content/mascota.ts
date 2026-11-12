import type { Truco } from '../components/three/hero/senalHero';

// Menú para jugar con la mascota del hero (solo con la escena 3D: escritorio
// con mouse y sin "reducir movimiento").

export const juegoMascota = {
  etiquetaBoton: 'Jugar con la mascota',
  etiquetaMenu: 'Trucos de la mascota',
  /** Aparece una vez por visita sobre la cabeza, para que se descubra el juego. */
  pista: '¡Tócame!',
  /** Tres opciones a cada lado del personaje, de arriba abajo. */
  opciones: [
    { id: 'enojarse', etiqueta: 'Ponerse bravo', lado: 'izquierda' },
    { id: 'correr', etiqueta: 'Salir corriendo', lado: 'izquierda' },
    { id: 'chocar', etiqueta: 'Chocar con la pantalla', lado: 'izquierda' },
    { id: 'bailar', etiqueta: 'Bailar', lado: 'derecha' },
    { id: 'voltereta', etiqueta: 'Dar una voltereta', lado: 'derecha' },
    { id: 'dormir', etiqueta: 'Echarse una siesta', lado: 'derecha' },
  ] as { id: Truco; etiqueta: string; lado: 'izquierda' | 'derecha' }[],
};
