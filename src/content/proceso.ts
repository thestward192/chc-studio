export interface PasoProceso {
  titulo: string;
  detalle: string;
}

// TODO(contenido real): pasos de marcador de "cómo trabajamos". Se dibujan
// en la pizarra del estudio 3D y se listan en su panel.
export const proceso: PasoProceso[] = [
  { titulo: 'Descubrir', detalle: 'Texto de marcador: entendemos el problema y a las personas.' },
  { titulo: 'Diseñar', detalle: 'Texto de marcador: prototipos rápidos y validación.' },
  { titulo: 'Construir', detalle: 'Texto de marcador: ciclos cortos con entregas frecuentes.' },
  { titulo: 'Lanzar', detalle: 'Texto de marcador: publicación, métricas y soporte.' },
  { titulo: 'Iterar', detalle: 'Texto de marcador: mejoras continuas con datos reales.' },
];
