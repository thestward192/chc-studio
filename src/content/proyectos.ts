export interface Proyecto {
  id: string;
  titulo: string;
  cliente: string;
  anio: number;
  resumen: string;
  descripcion: string;
  tecnologias: string[];
  /** Imágenes reales (opcionales). Mientras no existan, el cuadro dibuja un marcador en canvas. */
  imagenBaja?: string;
  imagenAlta?: string;
  /** Color del marcador en canvas (sustituir cuando haya imagen real). */
  colorMarcador: string;
  urlProyecto?: string;
  /** Página del caso completo (opcional). */
  urlCaso?: string;
}

// TODO(contenido real): proyectos de marcador. Sustituir por los proyectos
// reales. La posición de cada cuadro en la sala está en
// src/components/three/estudio/estudio.config.ts (no aquí).
export const proyectos: Proyecto[] = [
  {
    id: 'proyecto-1',
    titulo: 'Texto de marcador: Proyecto 1',
    cliente: 'Cliente de marcador A',
    anio: 2024,
    resumen: 'Resumen breve de marcador del proyecto 1.',
    descripcion:
      'Descripción de marcador del proyecto 1. Sustituir por el detalle real: problema, solución, resultado.',
    tecnologias: ['Tecnología A', 'Tecnología B'],
    colorMarcador: '#3d8bff',
    urlProyecto: 'https://example.com/',
    urlCaso: '/#proyectos',
  },
  {
    id: 'proyecto-2',
    titulo: 'Texto de marcador: Proyecto 2',
    cliente: 'Cliente de marcador B',
    anio: 2024,
    resumen: 'Resumen breve de marcador del proyecto 2.',
    descripcion:
      'Descripción de marcador del proyecto 2. Sustituir por el detalle real: problema, solución, resultado.',
    tecnologias: ['Tecnología C', 'Tecnología D'],
    colorMarcador: '#ff8a2a',
    urlProyecto: 'https://example.com/',
    urlCaso: '/#proyectos',
  },
  {
    id: 'proyecto-3',
    titulo: 'Texto de marcador: Proyecto 3',
    cliente: 'Cliente de marcador C',
    anio: 2025,
    resumen: 'Resumen breve de marcador del proyecto 3.',
    descripcion:
      'Descripción de marcador del proyecto 3. Sustituir por el detalle real: problema, solución, resultado.',
    tecnologias: ['Tecnología E'],
    colorMarcador: '#7bd88f',
    urlProyecto: 'https://example.com/',
    urlCaso: '/#proyectos',
  },
  {
    id: 'proyecto-4',
    titulo: 'Texto de marcador: Proyecto 4',
    cliente: 'Cliente de marcador D',
    anio: 2025,
    resumen: 'Resumen breve de marcador del proyecto 4.',
    descripcion:
      'Descripción de marcador del proyecto 4. Sustituir por el detalle real: problema, solución, resultado.',
    tecnologias: ['Tecnología F'],
    colorMarcador: '#c792ea',
    urlProyecto: 'https://example.com/',
    urlCaso: '/#proyectos',
  },
  {
    id: 'proyecto-5',
    titulo: 'Texto de marcador: Proyecto 5',
    cliente: 'Cliente de marcador E',
    anio: 2026,
    resumen: 'Resumen breve de marcador del proyecto 5.',
    descripcion:
      'Descripción de marcador del proyecto 5. Sustituir por el detalle real: problema, solución, resultado.',
    tecnologias: ['Tecnología G', 'Tecnología H', 'Tecnología I'],
    colorMarcador: '#ff5fa2',
    urlProyecto: 'https://example.com/',
    urlCaso: '/#proyectos',
  },
];
