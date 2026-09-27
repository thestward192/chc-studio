import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { animate } from 'animejs';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import './TransicionPagina.css';

export interface ManejadorTransicion {
  /** Funde la pantalla al color de tokens.css y navega a `href` al terminar. */
  salirHacia: (href: string) => void;
}

/**
 * Cada página es una entrada HTML independiente (ver vite.config.ts), así
 * que la "transición" no es una animación de ruta de SPA: es un fundido de
 * entrada al montar y un fundido de salida antes de la navegación real,
 * ambos al mismo --color-transicion, para que el cambio se sienta continuo.
 */
export const TransicionPagina = forwardRef<ManejadorTransicion>(function TransicionPagina(
  _props,
  ref,
) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const prefiereReducido = usePrefersReducedMotion();

  useEffect(() => {
    const nodo = overlayRef.current;
    if (!nodo) return;
    animate(nodo, {
      opacity: [1, 0],
      duration: prefiereReducido ? 1 : 500,
      easing: 'easeOutQuad',
    });
  }, [prefiereReducido]);

  useImperativeHandle(ref, () => ({
    salirHacia(href: string) {
      const nodo = overlayRef.current;
      if (!nodo || prefiereReducido) {
        window.location.href = href;
        return;
      }
      nodo.style.pointerEvents = 'auto';
      animate(nodo, {
        opacity: [0, 1],
        duration: 450,
        easing: 'easeInQuad',
        onComplete: () => {
          window.location.href = href;
        },
      });
    },
  }));

  return <div ref={overlayRef} className="transicion-pagina" aria-hidden="true" />;
});
