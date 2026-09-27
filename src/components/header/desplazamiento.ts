/**
 * Lleva a una sección con desplazamiento suave (instantáneo si se prefiere
 * movimiento reducido). Devuelve false si la sección no existe en la página,
 * para dejar que el enlace funcione de forma normal.
 */
export function irASeccion(id: string): boolean {
  const destino = document.getElementById(id);
  if (!destino) return false;
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  destino.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
  return true;
}
