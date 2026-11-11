import { useEffect, useRef, type RefObject } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Escribe en el elemento la variable CSS `nombre` (en px) con lo que devuelve
 * `calcular` en cada scroll/resize, como mucho una vez por cuadro y sin
 * re-render de React. Con movimiento reducido no hace nada (la variable
 * queda sin definir y el CSS usa su valor por defecto).
 */
export function useVariableScroll(
  ref: RefObject<HTMLElement>,
  nombre: string,
  calcular: (el: HTMLElement, altoVentana: number) => number,
) {
  const reducido = usePrefersReducedMotion();
  const calcularRef = useRef(calcular);
  calcularRef.current = calcular;

  useEffect(() => {
    const el = ref.current;
    if (!el || reducido) return;
    let pendiente = 0;

    const actualizar = () => {
      pendiente = 0;
      el.style.setProperty(nombre, `${calcularRef.current(el, window.innerHeight).toFixed(1)}px`);
    };
    const programar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(actualizar);
    };

    actualizar();
    window.addEventListener('scroll', programar, { passive: true });
    window.addEventListener('resize', programar);
    return () => {
      cancelAnimationFrame(pendiente);
      window.removeEventListener('scroll', programar);
      window.removeEventListener('resize', programar);
      el.style.removeProperty(nombre);
    };
  }, [ref, nombre, reducido]);
}

/** Limita v entre a y b. */
export const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
