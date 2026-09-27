export interface ObjetoGusto {
  id: string;
  nombre: string;
  descripcion: string;
  /** Posición del objeto dentro de la habitación personal (x, y, z). */
  posicion: [number, number, number];
  /** Forma placeholder mientras no hay modelo .glb real. */
  formaPlaceholder: 'caja' | 'esfera' | 'cilindro' | 'cono' | 'torus';
  colorPlaceholder: string;
  /** Ruta a un futuro modelo .glb (aún no existe). */
  modeloUrl?: string;
}

export interface ExperienciaLaboral {
  puesto: string;
  organizacion: string;
  periodo: string;
  descripcion: string;
}

export interface Integrante {
  id: string;
  slug: string;
  nombre: string;
  rol: string;
  bio: string;
  gustos: string[];
  objetosHabitacion: ObjetoGusto[];
  experiencia: ExperienciaLaboral[];
  habilidades: string[];
  cvUrl: string;
  colorPuerta: string;
  /** Color de la luz que se escapa por su puerta en el estudio 3D. */
  colorLuz: string;
  /** Frase corta que aparece en el panel de su puerta. */
  frase: string;
  href: string;
}

// TODO(contenido real): datos de marcador para los 4 integrantes. Sustituir
// nombre, rol, bio, gustos, experiencia, habilidades y el PDF en
// public/cv/ por la información real de cada persona. La posición de cada
// puerta en el estudio 3D está en src/components/three/estudio/estudio.config.ts.
export const equipo: Integrante[] = [
  {
    id: 'integrante-1',
    slug: 'integrante-1',
    nombre: 'Texto de marcador: Nombre integrante 1',
    rol: 'Rol de marcador (ej. Desarrollo)',
    bio: 'Biografía de marcador del integrante 1.',
    gustos: ['Gusto de marcador A', 'Gusto de marcador B'],
    objetosHabitacion: [
      {
        id: 'obj-1-1',
        nombre: 'Objeto de marcador 1',
        descripcion: 'Descripción de marcador del objeto 1.',
        posicion: [-1.5, 0.5, -1],
        formaPlaceholder: 'caja',
        colorPlaceholder: '#8a8f98',
      },
      {
        id: 'obj-1-2',
        nombre: 'Objeto de marcador 2',
        descripcion: 'Descripción de marcador del objeto 2.',
        posicion: [1.5, 0.5, -1],
        formaPlaceholder: 'esfera',
        colorPlaceholder: '#c8cbd1',
      },
    ],
    experiencia: [
      {
        puesto: 'Puesto de marcador',
        organizacion: 'Organización de marcador',
        periodo: '20XX — 20XX',
        descripcion: 'Descripción de marcador de la experiencia.',
      },
    ],
    habilidades: ['Habilidad de marcador 1', 'Habilidad de marcador 2'],
    cvUrl: '/cv/integrante-1.pdf',
    colorPuerta: '#8a8f98',
    colorLuz: '#3d8bff',
    frase: 'Texto de marcador: una frase corta del integrante 1.',
    href: '/equipo/integrante-1.html',
  },
  {
    id: 'integrante-2',
    slug: 'integrante-2',
    nombre: 'Texto de marcador: Nombre integrante 2',
    rol: 'Rol de marcador (ej. Diseño)',
    bio: 'Biografía de marcador del integrante 2.',
    gustos: ['Gusto de marcador C', 'Gusto de marcador D'],
    objetosHabitacion: [
      {
        id: 'obj-2-1',
        nombre: 'Objeto de marcador 1',
        descripcion: 'Descripción de marcador del objeto 1.',
        posicion: [-1.5, 0.5, -1],
        formaPlaceholder: 'cilindro',
        colorPlaceholder: '#8a8f98',
      },
      {
        id: 'obj-2-2',
        nombre: 'Objeto de marcador 2',
        descripcion: 'Descripción de marcador del objeto 2.',
        posicion: [1.5, 0.5, -1],
        formaPlaceholder: 'cono',
        colorPlaceholder: '#c8cbd1',
      },
    ],
    experiencia: [
      {
        puesto: 'Puesto de marcador',
        organizacion: 'Organización de marcador',
        periodo: '20XX — 20XX',
        descripcion: 'Descripción de marcador de la experiencia.',
      },
    ],
    habilidades: ['Habilidad de marcador 1', 'Habilidad de marcador 2'],
    cvUrl: '/cv/integrante-2.pdf',
    colorPuerta: '#8a8f98',
    colorLuz: '#ff8a2a',
    frase: 'Texto de marcador: una frase corta del integrante 2.',
    href: '/equipo/integrante-2.html',
  },
  {
    id: 'integrante-3',
    slug: 'integrante-3',
    nombre: 'Texto de marcador: Nombre integrante 3',
    rol: 'Rol de marcador (ej. Producto)',
    bio: 'Biografía de marcador del integrante 3.',
    gustos: ['Gusto de marcador E', 'Gusto de marcador F'],
    objetosHabitacion: [
      {
        id: 'obj-3-1',
        nombre: 'Objeto de marcador 1',
        descripcion: 'Descripción de marcador del objeto 1.',
        posicion: [-1.5, 0.5, -1],
        formaPlaceholder: 'torus',
        colorPlaceholder: '#8a8f98',
      },
      {
        id: 'obj-3-2',
        nombre: 'Objeto de marcador 2',
        descripcion: 'Descripción de marcador del objeto 2.',
        posicion: [1.5, 0.5, -1],
        formaPlaceholder: 'caja',
        colorPlaceholder: '#c8cbd1',
      },
    ],
    experiencia: [
      {
        puesto: 'Puesto de marcador',
        organizacion: 'Organización de marcador',
        periodo: '20XX — 20XX',
        descripcion: 'Descripción de marcador de la experiencia.',
      },
    ],
    habilidades: ['Habilidad de marcador 1', 'Habilidad de marcador 2'],
    cvUrl: '/cv/integrante-3.pdf',
    colorPuerta: '#8a8f98',
    colorLuz: '#7bd88f',
    frase: 'Texto de marcador: una frase corta del integrante 3.',
    href: '/equipo/integrante-3.html',
  },
  {
    id: 'integrante-4',
    slug: 'integrante-4',
    nombre: 'Texto de marcador: Nombre integrante 4',
    rol: 'Rol de marcador (ej. QA)',
    bio: 'Biografía de marcador del integrante 4.',
    gustos: ['Gusto de marcador G', 'Gusto de marcador H'],
    objetosHabitacion: [
      {
        id: 'obj-4-1',
        nombre: 'Objeto de marcador 1',
        descripcion: 'Descripción de marcador del objeto 1.',
        posicion: [-1.5, 0.5, -1],
        formaPlaceholder: 'esfera',
        colorPlaceholder: '#8a8f98',
      },
      {
        id: 'obj-4-2',
        nombre: 'Objeto de marcador 2',
        descripcion: 'Descripción de marcador del objeto 2.',
        posicion: [1.5, 0.5, -1],
        formaPlaceholder: 'cilindro',
        colorPlaceholder: '#c8cbd1',
      },
    ],
    experiencia: [
      {
        puesto: 'Puesto de marcador',
        organizacion: 'Organización de marcador',
        periodo: '20XX — 20XX',
        descripcion: 'Descripción de marcador de la experiencia.',
      },
    ],
    habilidades: ['Habilidad de marcador 1', 'Habilidad de marcador 2'],
    cvUrl: '/cv/integrante-4.pdf',
    colorPuerta: '#8a8f98',
    colorLuz: '#c792ea',
    frase: 'Texto de marcador: una frase corta del integrante 4.',
    href: '/equipo/integrante-4.html',
  },
];

export const obtenerIntegrantePorSlug = (slug: string): Integrante | undefined =>
  equipo.find((persona) => persona.slug === slug);
