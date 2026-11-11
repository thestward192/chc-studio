import { useEffect, type RefObject } from 'react';

/** Desde cuántos px de scroll el navbar pasa a compacto. */
const UMBRAL_COMPACTO = 24;

/**
 * Pone tres atributos en el navbar fijo, sin re-render de React:
 *  - data-oculto: la cabecera aún no llegó arriba (la intro 3D está delante).
 *  - data-compacto: la página ya bajó un poco.
 *  - data-oscuro: lo que queda detrás del navbar es oscuro (se mira el
 *    primer elemento con fondo opaco bajo su centro y su luminancia).
 * Se recalcula en cada scroll/resize, como mucho una vez por cuadro.
 */
export function useEstadoNav(navRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let pendiente = 0;

    const cabecera = nav.parentElement;

    const actualizar = () => {
      pendiente = 0;
      // Con la intro 3D delante, el navbar espera a que la cabecera llegue arriba
      const conIntroDelante = (cabecera?.getBoundingClientRect().top ?? 0) > 80;
      nav.toggleAttribute('data-oculto', conIntroDelante);
      nav.toggleAttribute('data-compacto', window.scrollY > UMBRAL_COMPACTO);
      const caja = nav.getBoundingClientRect();
      nav.toggleAttribute(
        'data-oscuro',
        fondoEsOscuro(caja.left + caja.width / 2, caja.top + caja.height / 2, nav),
      );
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
    };
  }, [navRef]);
}

function fondoEsOscuro(x: number, y: number, nav: HTMLElement): boolean {
  for (const el of document.elementsFromPoint(x, y)) {
    if (nav.contains(el)) continue;
    const color = leerColor(getComputedStyle(el).backgroundColor);
    if (!color || color.a < 0.5) continue;
    const luminancia = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    return luminancia < 0.4;
  }
  return false;
}

/** Lee "rgb(a)(…)" o "color(srgb …)" (lo que devuelve color-mix) a valores 0..1. */
function leerColor(valor: string): { r: number; g: number; b: number; a: number } | null {
  const numeros = valor.match(/[\d.]+/g)?.map(Number);
  if (!numeros || numeros.length < 3) return null;
  if (valor.startsWith('color(')) {
    const [r, g, b, a = 1] = numeros;
    return { r, g, b, a };
  }
  const [r, g, b, a = 1] = numeros;
  return { r: r / 255, g: g / 255, b: b / 255, a };
}
