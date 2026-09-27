/** Utilidades matemáticas de la intro (tramos de scroll, curvas, suavizado). */

export function clamp01(valor: number): number {
  return Math.min(1, Math.max(0, valor));
}

/** Progreso 0–1 dentro del tramo [inicio, fin]. */
export function tramo(p: number, [inicio, fin]: readonly [number, number]): number {
  if (fin <= inicio) return p >= fin ? 1 : 0;
  return clamp01((p - inicio) / (fin - inicio));
}

/** Sube en [a, b], se mantiene en 1 y baja en [c, d]. */
export function meseta(p: number, [a, b, c, d]: readonly [number, number, number, number]): number {
  return tramo(p, [a, b]) * (1 - tramo(p, [c, d]));
}

/** Sube de `inicio` a `pico` y vuelve a 0 en `fin` (curva suave). */
export function campana(p: number, [inicio, pico, fin]: readonly [number, number, number]): number {
  if (p <= inicio || p >= fin) return 0;
  return p < pico ? suave(tramo(p, [inicio, pico])) : suave(1 - tramo(p, [pico, fin]));
}

export function suave(x: number): number {
  return x * x * (3 - 2 * x);
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/** Interpolación exponencial independiente de los FPS. */
export function amortiguar(actual: number, objetivo: number, lambda: number, dt: number): number {
  return actual + (objetivo - actual) * (1 - Math.exp(-lambda * dt));
}

export function esMovil(): boolean {
  return window.matchMedia('(pointer: coarse), (max-width: 768px)').matches;
}
