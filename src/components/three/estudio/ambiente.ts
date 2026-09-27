/**
 * Valores que cambian cada fotograma y que leen muchos componentes: se
 * guardan en un objeto mutable (no en zustand) para no provocar renders.
 * Los actualiza <RelojAmbiente/> en EscenaSalaProyectos.
 */
export const ambiente = {
  /** Tiempo de la escena en segundos (se detiene en pausa). */
  t: 0,
  /** 0 = día, 1 = noche (interpolado suavemente). */
  noche: 0,
  /** true si se prefiere movimiento reducido. */
  reducido: false,
};
