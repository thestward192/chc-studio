import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [prefiereReducido, setPrefiereReducido] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefiereReducido(consulta.matches);
    const manejador = (evento: MediaQueryListEvent) => setPrefiereReducido(evento.matches);
    consulta.addEventListener('change', manejador);
    return () => consulta.removeEventListener('change', manejador);
  }, []);

  return prefiereReducido;
}
