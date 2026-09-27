import { useEffect, useState } from 'react';

/** Id de la sección que ocupa el centro de la pantalla (o null si ninguna). */
export function useSeccionActiva(ids: string[]): string | null {
  const [activa, setActiva] = useState<string | null>(null);
  const clave = ids.join(',');

  useEffect(() => {
    const orden = clave.split(',');
    const secciones = orden
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!secciones.length) return;
    const visibles = new Set<string>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) visibles.add(entrada.target.id);
          else visibles.delete(entrada.target.id);
        }
        // La primera visible según el orden del menú
        setActiva(orden.find((id) => visibles.has(id)) ?? null);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [clave]);

  return activa;
}
