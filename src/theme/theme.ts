/**
 * Espejo en JS/TS de tokens.css, para usar los mismos valores dentro de
 * Three.js (materiales, luces, niebla) donde no se puede leer una variable
 * CSS directamente. Si cambias tokens.css, refleja aquí los mismos valores.
 *
 * TODO(marca): valores neutros de marcador — sustituir junto con tokens.css.
 */
export const colores = {
  fondo: '#101114',
  fondoAlterno: '#17181c',
  superficie: '#1f2126',
  superficieAlta: '#2a2d33',
  borde: '#3a3d44',
  texto: '#f2f2f0',
  textoTenue: '#a8abb3',
  textoInverso: '#101114',
  marca: '#8a8f98',
  marcaFuerte: '#c8cbd1',
  acento: '#e4e4e0',
  exito: '#7bb88f',
  aviso: '#d8b568',
  error: '#c97b6f',
  transicion: '#101114',
} as const;

/**
 * Marca del header de Inicio (espejo de --bg-dark, --surface, --accent-*).
 * Lo usa la escena 3D del hero ("Núcleo CHC").
 */
export const marca = {
  fondoPagina: '#f4f6f8',
  fondoOscuro: '#12161f',
  superficie: '#1a1e29',
  verde: '#3deb8a',
  cian: '#1ec8d8',
  texto: '#ffffff',
  textoTenue: 'rgba(255, 255, 255, 0.6)',
  textoOscuro: '#12161f',
  textoOscuroTenue: 'rgba(18, 22, 31, 0.55)',
  textoSobreAcento: '#062a22',
  bordeCristal: 'rgba(255, 255, 255, 0.1)',
  fuenteTitulos: "'Sora', system-ui, sans-serif",
  fuenteTexto: "'Inter', system-ui, sans-serif",
} as const;

/**
 * Paletas del estudio fotográfico de la intro 3D (espejo de los
 * `--estudio-*` de tokens.css). El modo se elige con `obtenerModoEstudio()`.
 */
export const estudio = {
  oscuro: {
    centro: '#222b3b',
    borde: '#0b0e14',
    apagado: '#04060a',
    luz: '#eef7f5',
    sombra: '#020306',
  },
  claro: {
    centro: '#f4f6f8',
    borde: '#c2cad4',
    apagado: '#12161f',
    luz: '#ffffff',
    sombra: '#12161f',
  },
} as const;

export type ModoEstudio = keyof typeof estudio;
export type PaletaEstudio = (typeof estudio)[ModoEstudio];

/** Espejo de los `--laptop-*` de tokens.css (igual en ambos modos). */
export const laptop = {
  aluminio: '#7c7f86',
  aluminioCanto: '#c9ccd2',
  bisagra: '#3b3d42',
  tecla: '#0c0c0e',
  vidrio: '#040405',
  logo: '#d5d7dc',
  luzPantalla: '#c4efe4',
  luzRanura: '#b4f2d9',
} as const;

/** Interfaz "cristal oscuro" del estudio 3D (espejo de `--ui-*`). */
export const ui = {
  acento: '#1ec8d8',
  acentoSuave: '#3deb8a',
  destacado: '#3deb8a',
  texto: '#ffffff',
  /** En la UI HTML, Inter; en los rótulos dibujados dentro del 3D, Sora. */
  fuenteUi: "'Sora', system-ui, sans-serif",
  fuenteCodigo: "'JetBrains Mono', Consolas, monospace",
  fuenteManuscrita: "'Caveat', cursive",
} as const;

/** Paleta de la sala del estudio (espejo de `--sala-*` de tokens.css). */
export const sala = {
  pared: '#d9d4cb',
  paredFondo: '#1f2736',
  techo: '#efece6',
  zocalo: '#3a3430',
  maderaClara: '#b98a5e',
  maderaOscura: '#7a5236',
  metal: '#2b2f36',
  metalClaro: '#9aa1ab',
  tela: '#3e4a5c',
  telaAlfombra: '#8c5a4a',
  telaAlfombra2: '#d8b98f',
  ceramica: '#f3efe8',
  planta: '#4f7a4a',
  plantaOscura: '#2f5230',
  maceta: '#c9724f',
  pizarra: '#f6f7f4',
  tinta: '#1f3b73',
  tinta2: '#c2412d',
  marco: '#1b1e24',
  rack: '#15181d',
  libros: ['#1ec8d8', '#ff8a2a', '#2f5230', '#c2412d', '#e8d8b0'],
  sol: '#fff1dc',
  luna: '#9fb6ff',
  cieloLuz: '#cfe3ff',
  sueloLuz: '#6b5646',
  rebote: '#ffb46b',
  lampara: '#ffcf8a',
  tinteDia: '#fff4e2',
  tinteNoche: '#b9c8ff',
  cieloDiaArriba: '#5b9be6',
  cieloDiaHorizonte: '#cfe4f7',
  cieloNocheArriba: '#070b1c',
  cieloNocheHorizonte: '#26305a',
  nubes: '#ffffff',
  edificiosDia: '#7d8a9e',
  edificiosNoche: '#0d1120',
  ventanasLuz: '#ffd27a',
  pantallaFondo: '#0d1117',
  codigo: ['#5fdcea', '#f5c26b', '#7bd88f', '#6b7689'],
  cursor: '#eef3fb',
  ledVerde: '#43f28a',
  ledAmbar: '#ffb13d',
  ledAzul: '#1ec8d8',
  neon: '#3deb8a',
  neon2: '#1ec8d8',
} as const;

/** Mismo criterio que tokens.css: data-tema manda; si no, el sistema. */
export function obtenerModoEstudio(): ModoEstudio {
  const forzado = document.documentElement.dataset.tema;
  if (forzado === 'claro' || forzado === 'oscuro') return forzado;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
}

export const tipografia = {
  fuenteBase: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fuenteTitulos: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export const espaciados = {
  xs: 0.5,
  sm: 0.75,
  md: 1.25,
  lg: 2,
  xl: 3.5,
} as const;

export const radios = {
  sm: 0.04,
  md: 0.1,
  lg: 0.2,
} as const;

export const duraciones = {
  transicionPagina: 600,
  ui: 220,
} as const;

/** Configuración de luz "horneada" (sin sombras dinámicas por defecto). */
export const iluminacion = {
  intensidadAmbiente: 0.6,
  intensidadDireccional: 0.8,
  colorLuz: colores.acento,
  usarSombrasEnTiempoReal: false,
} as const;

export const tema = {
  colores,
  estudio,
  laptop,
  ui,
  sala,
  tipografia,
  espaciados,
  radios,
  duraciones,
  iluminacion,
};
export type Tema = typeof tema;
