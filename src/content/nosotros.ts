import { equipo, listaGustos } from './equipo';

// Sección "Nosotros" de Inicio: quiénes somos y una vista previa del estudio
// 3D (el taller y la oficina de cada integrante). Las imágenes son renders
// reales de las escenas: se regeneran con `node scripts/capturar-oficinas.mjs`.

export const encabezadoNosotros = {
  antetitulo: 'Nosotros',
  // TODO(contenido real): revisar la copia con el equipo.
  titular: [{ texto: 'Cuatro personas, ' }, { texto: 'un estudio.', destacado: true }] as {
    texto: string;
    destacado?: boolean;
  }[],
  subtitulo:
    'Somos un equipo de Costa Rica que diseña y programa. Cada uno tiene su oficina en nuestro estudio 3D: pasa y conócela.',
};

export interface EscenaNosotros {
  id: string;
  /** Texto del control segmentado. */
  etiqueta: string;
  titulo: string;
  descripcion: string;
  /** Gustos (decoran su oficina); vacío para el taller. */
  gustos: string[];
  imagen: string;
  href: string;
  accion: string;
  /** Color de su luz (el mismo de su oficina). */
  color: string;
}

export const escenasNosotros: EscenaNosotros[] = [
  {
    id: 'taller',
    etiqueta: 'Taller',
    titulo: 'El taller',
    descripcion:
      'Donde trabajamos juntos y colgamos los proyectos. Desde aquí se entra a cada oficina.',
    gustos: [],
    imagen: '/equipo/taller.jpg',
    href: '/estudio.html',
    accion: 'Entrar al estudio 3D',
    color: '#1ec8d8',
  },
  ...equipo.map((persona) => ({
    id: persona.id,
    etiqueta: persona.nombreCorto,
    titulo: persona.nombre,
    descripcion: `Su oficina está hecha de lo que le gusta: ${listaGustos(persona, true)}.`,
    gustos: persona.gustos,
    imagen: `/equipo/oficina-${persona.slug}.jpg`,
    href: persona.href,
    accion: `Entrar a la oficina de ${persona.nombreCorto}`,
    color: persona.colorLuz,
  })),
];
