import type { IconoServicio } from './cabecera';

export interface Servicio {
  /** id del bloque en la página (también sirve de ancla: #servicio-web). */
  id: string;
  icono: IconoServicio;
  titulo: string;
  descripcion: string;
  /** Lo que incluye, en pocas palabras (se muestra como etiquetas). */
  incluye: string[];
}

// Los mismos cinco servicios (y en el mismo orden) que la fila de la cabecera.
export const encabezadoServicios = {
  antetitulo: 'Servicios',
  /** `destacado` va con el degradado de marca, como en el titular del hero. */
  titular: [
    { texto: 'Todo tu negocio digital, en ' },
    { texto: 'un solo equipo.', destacado: true },
  ] as {
    texto: string;
    destacado?: boolean;
  }[],
  subtitulo:
    'Diseñamos, programamos y cuidamos las herramientas que tu empresa usa todos los días. Elige un servicio o combínalos.',
};

export const servicios: Servicio[] = [
  {
    id: 'servicio-web',
    icono: 'web',
    titulo: 'Páginas web',
    descripcion:
      'Sitios rápidos, claros y hechos para el celular, pensados para que quien te visita termine escribiéndote.',
    incluye: ['Sitios corporativos', 'Tiendas en línea', 'Landing pages'],
  },
  {
    id: 'servicio-sistema',
    icono: 'sistema',
    titulo: 'Sistemas a medida',
    descripcion:
      'Software que se adapta a cómo trabaja tu empresa: inventarios, citas, facturación o el proceso que necesites ordenar.',
    incluye: ['Paneles administrativos', 'Apps internas'],
  },
  {
    id: 'servicio-automatizacion',
    icono: 'automatizacion',
    titulo: 'Automatizaciones',
    descripcion:
      'Conectamos tus herramientas para que las tareas repetitivas se hagan solas y tu equipo se enfoque en vender.',
    incluye: ['WhatsApp', 'Correo', 'Hojas de cálculo'],
  },
  {
    id: 'servicio-seo',
    icono: 'seo',
    titulo: 'SEO',
    descripcion:
      'Que te encuentren en Google cuando buscan lo que ofreces, con SEO técnico, contenido y perfil de Google Business.',
    incluye: ['SEO técnico', 'Google Business'],
  },
  {
    id: 'servicio-soporte',
    icono: 'soporte',
    titulo: 'Soporte continuo',
    descripcion:
      'No desaparecemos al entregar: actualizaciones, respaldos, seguridad y mejoras mes a mes.',
    incluye: ['Mantenimiento', 'Respaldos', 'Seguridad', 'Mejoras'],
  },
];

/** Textos de las animaciones de las tarjetas (ilustrativos, sin datos reales). */
export const animacionesServicios = {
  web: {
    url: 'tunegocio.cr',
    boton: 'Escríbenos',
    aviso: { titulo: 'Nuevo mensaje', texto: 'Hola, quiero cotizar mi página' },
  },
  sistema: { ventana: 'Panel · Inventario' },
  soporte: { estado: 'Monitoreo activo' },
  seo: {
    busqueda: 'desarrollo web en Costa Rica',
    resultado: 'tunegocio.cr',
  },
};

/** Cierre de la sección: para quien todavía no sabe qué servicio necesita. */
export const cierreServicios = {
  texto: '¿No tienes claro qué necesitas? Te ayudamos a elegir por dónde empezar.',
};
