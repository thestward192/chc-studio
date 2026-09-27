import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Coloca la barra indicadora bajo el enlace `id` de la lista (data-id).
 * Solo escribe variables CSS en el nodo (sin re-render de React); la
 * transición la hace CSS con transform. Con id null la barra se oculta
 * en su sitio.
 */
export function useIndicadorNav(id: string | null) {
  const listaRef = useRef<HTMLUListElement>(null);
  const indicadorRef = useRef<HTMLSpanElement>(null);
  const idRef = useRef(id);
  idRef.current = id;

  const colocar = () => {
    const lista = listaRef.current;
    const barra = indicadorRef.current;
    if (!lista || !barra) return;
    const enlace = idRef.current
      ? lista.querySelector<HTMLElement>(`[data-id="${idRef.current}"]`)
      : null;
    if (!enlace) {
      barra.style.opacity = '0';
      return;
    }
    const caja = enlace.getBoundingClientRect();
    const base = (barra.parentElement ?? lista).getBoundingClientRect();
    const primeraVez = !barra.dataset.colocada;
    if (primeraVez) barra.style.transition = 'none'; // la primera vez aparece en su sitio, sin viajar
    barra.style.setProperty('--x', `${caja.left - base.left + caja.width / 2}px`);
    barra.style.opacity = '1';
    barra.dataset.colocada = '1';
    if (primeraVez) {
      void barra.offsetWidth;
      barra.style.transition = '';
    }
  };

  useLayoutEffect(colocar, [id]);

  // Recolocar si cambia el ancho (resize, carga de fuentes)
  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const observador = new ResizeObserver(() => colocar());
    observador.observe(lista);
    document.fonts?.ready.then(() => colocar()).catch(() => {});
    return () => observador.disconnect();
    // colocar lee todo por refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { listaRef, indicadorRef };
}
