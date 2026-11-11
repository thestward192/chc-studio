import type { IconoServicio } from './cabecera';

export interface Proyecto {
  id: string;
  titulo: string;
  cliente: string;
  /** Año (opcional: si no se conoce, no se muestra). */
  anio?: number;
  resumen: string;
  descripcion: string;
  tecnologias: string[];
  /** Estado del proyecto (punto verde si está en línea, gris si es privado). */
  estado?: 'En línea' | 'En desarrollo' | 'Privado';
  /** Tipo que se muestra en la ficha (si no, el nombre del servicio). */
  tipo?: string;
  /** Qué hicimos en el proyecto (p. ej. "Desarrollo web"). */
  rol?: string;
  /** Puntos clave que se listan en la hoja de detalle. */
  caracteristicas?: string[];
  /**
   * Capturas del sitio para la laptop de Inicio (la primera es la portada;
   * si hay varias, se turnan). Mejor anchas: 1600 px de ancho.
   */
  galeria?: string[];
  /**
   * Imagen propia del cuadro en la sala 3D (opcional; proporción 1,4 : 0,95,
   * baja ≈ 280 px y alta ≈ 1400 px). Sin ella, el cuadro muestra la primera
   * captura de la galería entera dentro de una ventana de navegador.
   */
  imagenBaja?: string;
  imagenAlta?: string;
  /** Color del marcador en canvas (sustituir cuando haya imagen real). */
  colorMarcador: string;
  urlProyecto?: string;
  /** Página del caso completo (opcional). */
  urlCaso?: string;
  /** Servicio principal (mismo icono que en Servicios). */
  servicio?: IconoServicio;
}

export const encabezadoProyectos = {
  antetitulo: 'Proyectos',
  titular: 'Proyectos que ya están en marcha.',
  subtitulo:
    'Una muestra de lo que construimos. Desliza para recorrerlos o entra a la sala 3D del estudio para verlos en grande.',
};

// Proyectos reales, en el orden en que aparecen. La posición de cada cuadro
// en la sala 3D está en src/components/three/estudio/estudio.config.ts.
export const proyectos: Proyecto[] = [
  {
    id: 'dmr-rentals',
    titulo: 'DMR Rentals – Alojamientos y Propiedades',
    cliente: 'DMR Rentals',
    anio: 2025,
    estado: 'En línea',
    rol: 'Diseño y desarrollo web',
    resumen: 'Alojamientos turísticos y propiedades en venta en Costa Rica.',
    descripcion:
      'Creamos el sitio web de DMR Rentals, una empresa costarricense de alojamientos turísticos y propiedades. En un solo lugar reúne las estancias disponibles, los tours recomendados y las propiedades en venta, cada una con su ficha de detalle, junto con los servicios de administración que ofrece la empresa. Lo diseñamos para que encontrar y comparar opciones sea claro y rápido, tanto en la computadora como en el celular.',
    caracteristicas: [
      'Alojamientos turísticos y propiedades en venta',
      'Detalle de cada propiedad',
      'Servicios de la empresa',
    ],
    tecnologias: ['React', 'Vite', 'Tailwind CSS', 'TypeScript', 'Firebase', 'Supabase'],
    galeria: [
      '/proyectos/dmr-rentals/inicio.jpg',
      '/proyectos/dmr-rentals/alojamientos.jpg',
      '/proyectos/dmr-rentals/tours.jpg',
    ],
    colorMarcador: '#3d8bff',
    servicio: 'web',
    tipo: 'Sitio web',
    urlProyecto: 'https://www.dmrrentalscr.com',
  },
  {
    id: 'mtb-el-valle',
    titulo: 'MTB El Valle del Nacaome – Sitio de Rodada Recreativa',
    cliente: 'MTB El Valle del Nacaome',
    anio: 2026,
    estado: 'En línea',
    rol: 'Desarrollo web',
    resumen: 'Sitio oficial de una rodada recreativa en Barra Honda, Guanacaste.',
    descripcion:
      'Creamos el sitio oficial de MTB El Valle del Nacaome, una rodada recreativa comunitaria en Barra Honda, Guanacaste. Reúne todo lo que un participante necesita antes del evento: la cuenta regresiva, la ruta con su mapa y perfil, el reglamento y las actividades del fin de semana. Además, permite inscribir grupos completos en línea adjuntando el comprobante de pago y, después, consultar el estado de la inscripción con el folio y la cédula, sin crear una cuenta.',
    caracteristicas: [
      'Cuenta regresiva al día del evento e información general',
      'Mapa y perfil de la ruta, reglamento y preguntas frecuentes',
      'Inscripción en línea de varias personas con comprobante de pago adjunto',
      'Consulta del estado de la inscripción por folio y cédula',
      'Galería de fotos y sección de actividades del fin de semana',
      'Transiciones fluidas entre páginas',
    ],
    tecnologias: ['Astro', 'TypeScript'],
    galeria: [
      '/proyectos/mtb-el-valle/inicio.jpg',
      '/proyectos/mtb-el-valle/ruta.jpg',
      '/proyectos/mtb-el-valle/inscripcion.jpg',
    ],
    colorMarcador: '#ff8a2a',
    servicio: 'web',
    tipo: 'Sitio web',
    urlProyecto: 'https://recreativa-barra-honda.vercel.app',
  },
  {
    id: 'panel-mtb',
    titulo: 'Panel Administrativo de Inscripciones MTB',
    cliente: 'MTB El Valle del Nacaome',
    anio: 2026,
    estado: 'Privado',
    rol: 'Desarrollo full stack',
    resumen: 'Panel para revisar y aprobar las inscripciones del evento.',
    descripcion:
      'Construimos el panel con el que el equipo organizador de MTB El Valle del Nacaome gestiona el evento. Ahí revisan cada inscripción, validan los comprobantes de pago y aprueban o rechazan participantes, y el resultado se refleja en la consulta de estado del sitio público. Así todo el flujo de inscripción del sitio se gestiona en un mismo lugar.',
    caracteristicas: [
      'Listado de inscripciones con los datos de los participantes',
      'Revisión de comprobantes de pago',
      'Aprobación o rechazo de inscripciones',
      'Conectado con las páginas públicas de inscripción y consulta de estado',
    ],
    tecnologias: ['React', 'TypeScript', 'Tailwind CSS'],
    galeria: ['/proyectos/panel-mtb/acceso.jpg'],
    colorMarcador: '#7bd88f',
    servicio: 'sistema',
    tipo: 'Sistema',
  },
  {
    id: 'bubble-beads',
    titulo: 'Bubble Beads – Tienda de Joyería Artesanal',
    cliente: 'Bubble Beads',
    anio: 2026,
    estado: 'En línea',
    rol: 'Desarrollo en Shopify',
    resumen: 'Tienda en línea de joyería artesanal con envíos a toda Europa.',
    descripcion:
      'Desarrollamos en Shopify la tienda de Bubble Beads, una marca de joyería artesanal con cuentas, accesorios para el cabello y Bubble Boxes curadas. Organizamos el catálogo en colecciones temáticas, sumamos una sección para diseñar pulseras a medida, kits de regalo en tres niveles de precio y un espacio para sus ventas en vivo por TikTok e Instagram. La tienda vende a toda Europa y muestra los precios en varias monedas.',
    caracteristicas: [
      'Colecciones temáticas y navegación por categorías (pulseras, collares, cabello, uñas press-on)',
      'Sección para diseñar tu propia pulsera',
      'Bubble Boxes: kits de regalo de €50, €100 y €150',
      'Sección de ventas en vivo con horario semanal',
      'Testimonios de clientes y sección de comunidad',
      'Múltiples monedas y envíos a toda Europa',
    ],
    tecnologias: ['Shopify'],
    galeria: ['/proyectos/bubble-beads/inicio.jpg', '/proyectos/bubble-beads/catalogo.jpg'],
    colorMarcador: '#c792ea',
    servicio: 'web',
    tipo: 'E-commerce',
    urlProyecto: 'https://bubblebeads.shop',
  },
  {
    id: 'loomibuy',
    titulo: 'LoomiBuy – Tienda de Organizadores para el Hogar',
    cliente: 'LoomiBuy',
    estado: 'Privado',
    rol: 'Diseño y desarrollo en Shopify',
    resumen: 'E-commerce de productos de organización para el hogar.',
    descripcion:
      'Diseñamos y desarrollamos LoomiBuy, una tienda en línea de productos para organizar el hogar. Creamos su identidad visual, armamos la estructura del catálogo con variantes de producto personalizadas y cuidamos que comprar sea igual de cómodo en el celular que en la computadora.',
    caracteristicas: [
      'Identidad visual',
      'Estructura del catálogo y variantes de productos personalizadas',
      'Experiencia responsiva enfocada en móviles',
    ],
    tecnologias: ['Shopify'],
    galeria: ['/proyectos/loomibuy/inicio.jpg'],
    colorMarcador: '#ff5fa2',
    servicio: 'web',
    tipo: 'E-commerce',
  },
];

/** Dominio para la barra del navegador (sin www), o null si el proyecto es privado. */
export function dominioProyecto(p: Proyecto) {
  return p.urlProyecto ? new URL(p.urlProyecto).hostname.replace(/^www./, '') : null;
}
