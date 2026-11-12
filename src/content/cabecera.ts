// Contenido del header de Inicio (navbar + hero). Textos en español con voseo.

export interface EnlaceNav {
  id: string; // id de la sección de destino
  etiqueta: string;
}

export const enlacesNav: EnlaceNav[] = [
  // Mismo orden que las secciones en la página
  { id: 'servicios', etiqueta: 'Servicios' },
  { id: 'proyectos', etiqueta: 'Proyectos' },
  { id: 'nosotros', etiqueta: 'Nosotros' },
  { id: 'contacto', etiqueta: 'Contacto' },
];

export const ctaNav = { etiqueta: 'Hablemos', destino: 'contacto' };

export const hero = {
  /** Línea corta sobre el titular, como el nombre del producto en Apple. */
  antetitulo: 'CHC Studio',
  /** Cada elemento es una línea; `destacado` va con el degradado de marca. */
  titular: [
    [{ texto: 'Tecnología que hace' }],
    [{ texto: 'crecer tu negocio.', destacado: true }],
  ] as { texto: string; destacado?: boolean }[][],
  subtitulo:
    'Desarrollamos páginas web, sistemas y automatizaciones para empresas y negocios en Costa Rica.',
  boton: { etiqueta: 'Empecemos tu proyecto', destino: 'contacto' },
  /**
   * Prueba social sin cifras ni clientes inventados: la propia web demuestra
   * lo que sabemos hacer y lleva al estudio 3D.
   */
  prueba: {
    texto: 'Todo el 3D de esta web lo programamos nosotros.',
    enlace: { etiqueta: 'Explorar el estudio 3D', href: '/estudio.html' },
  },
  /** Render estático de la mascota 3D (móvil, movimiento reducido, sin WebGL y póster de carga). */
  poster: '/hero/mascota.webp',
};

export const volverIntro = {
  etiqueta: 'Intro',
  descripcion: 'Volver a la intro de la laptop',
};

export type IconoServicio = 'web' | 'sistema' | 'automatizacion' | 'seo' | 'soporte';

export const palabrasServicio: { texto: string; icono: IconoServicio }[] = [
  { texto: 'Páginas web', icono: 'web' },
  { texto: 'Sistemas a medida', icono: 'sistema' },
  { texto: 'Automatizaciones', icono: 'automatizacion' },
  { texto: 'SEO', icono: 'seo' },
  { texto: 'Soporte continuo', icono: 'soporte' },
];

export const logo = { imagen: '/logo-light.png', alt: 'CHC Studio' };
