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
  /** Nombre corto (placas, menú). */
  nombreCorto: string;
  /**
   * Qué hace en el equipo. TODO(contenido real): vacío por ahora; mientras
   * esté vacío, la interfaz muestra líneas de marcador sin texto.
   */
  rol: string;
  /** TODO(contenido real): vacío por ahora (se muestran líneas de marcador). */
  bio: string;
  /** Lo que le gusta: define la decoración de su oficina. */
  gustos: string[];
  experiencia: ExperienciaLaboral[];
  habilidades: string[];
  cvUrl: string;
  colorPuerta: string;
  /** Color de su luz: puerta en el taller y acento de su oficina. */
  colorLuz: string;
  /** TODO(contenido real): frase corta para el panel de su puerta (vacía por ahora). */
  frase: string;
  href: string;
}

/** true si un texto todavía no se escribió (la UI muestra líneas de marcador). */
export const pendiente = (texto: string | undefined) => !texto || texto.trim() === '';

// Los 4 integrantes. Nombres y gustos son reales; rol, bio, frase,
// experiencia y habilidades quedan vacíos hasta tener el texto definitivo.
// La decoración de cada oficina está en
// src/components/three/oficina/oficinas.config.ts (una entrada por slug) y
// la posición de cada puerta en el taller, en estudio.config.ts.
export const equipo: Integrante[] = [
  {
    id: 'integrante-1',
    slug: 'integrante-1',
    nombre: 'Stward Serrano',
    nombreCorto: 'Stward',
    rol: '',
    bio: '',
    gustos: ['Videojuegos', 'Diseño', 'Modelado 3D'],
    experiencia: [],
    habilidades: [],
    cvUrl: '/cv/integrante-1.pdf',
    colorPuerta: '#2a3445',
    colorLuz: '#1ec8d8',
    frase: '',
    href: '/equipo/integrante-1.html',
  },
  {
    id: 'integrante-2',
    slug: 'integrante-2',
    nombre: 'Oscar',
    nombreCorto: 'Oscar',
    rol: '',
    bio: '',
    gustos: ['Fútbol', 'Programación'],
    experiencia: [],
    habilidades: [],
    cvUrl: '/cv/integrante-2.pdf',
    colorPuerta: '#23352c',
    colorLuz: '#3deb8a',
    frase: '',
    href: '/equipo/integrante-2.html',
  },
  {
    id: 'integrante-3',
    slug: 'integrante-3',
    nombre: 'Hezron',
    nombreCorto: 'Hezron',
    rol: '',
    bio: '',
    gustos: ['Videojuegos', 'Programación'],
    experiencia: [],
    habilidades: [],
    cvUrl: '/cv/integrante-3.pdf',
    colorPuerta: '#2b2745',
    colorLuz: '#8b7bff',
    frase: '',
    href: '/equipo/integrante-3.html',
  },
  {
    id: 'integrante-4',
    slug: 'integrante-4',
    nombre: 'Fabiola',
    nombreCorto: 'Fabiola',
    rol: '',
    bio: '',
    gustos: ['Programación', 'Maquillaje'],
    experiencia: [],
    habilidades: [],
    cvUrl: '/cv/integrante-4.pdf',
    colorPuerta: '#40283a',
    colorLuz: '#ff7eb6',
    frase: '',
    href: '/equipo/integrante-4.html',
  },
];

export const obtenerIntegrantePorSlug = (slug: string): Integrante | undefined =>
  equipo.find((persona) => persona.slug === slug);

/**
 * "Videojuegos, diseño y modelado 3D" (o "videojuegos, diseño y modelado 3D"
 * con `enFrase`). Solo cambia la primera letra, así se respetan siglas como 3D.
 */
export function listaGustos(persona: Integrante, enFrase = false) {
  const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const g = persona.gustos.map((gusto, i) => (i === 0 && !enFrase ? gusto : minuscula(gusto)));
  return g.length > 1 ? `${g.slice(0, -1).join(', ')} y ${g[g.length - 1]}` : (g[0] ?? '');
}
