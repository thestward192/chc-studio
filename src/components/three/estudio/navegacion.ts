/**
 * Navegación desde la escena. La página (Estudio.tsx) conecta `ir` con
 * TransicionPagina para que toda salida tenga el fundido al color de
 * transición de los tokens.
 */
export const navegacion = {
  ir: (href: string) => {
    window.location.href = href;
  },
};

/** Precarga una página (al pasar el ratón por una puerta, por ejemplo). */
const precargadas = new Set<string>();
export function precargar(href: string) {
  if (precargadas.has(href)) return;
  precargadas.add(href);
  const enlace = document.createElement('link');
  enlace.rel = 'prefetch';
  enlace.href = href;
  document.head.appendChild(enlace);
}
