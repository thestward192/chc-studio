/**
 * Canal entre la interfaz del hero y la escena 3D del Núcleo. Es un objeto
 * mutable (no estado de React): la UI escribe y la escena lo lee en cada
 * fotograma. No importa three, así que la UI puede usarlo sin arrastrar la
 * librería al bundle principal.
 */
/**
 * Viaje de la mascota por la página: la UI escribe cada scroll cuántos px
 * debe desplazarse en pantalla (positivo = hacia abajo) y la escena la lleva
 * hasta ahí con un muelle. Cada escena (hero, tarjeta) tiene el suyo.
 */
export interface ViajeMascota {
  px: number;
  /** Dónde vive esta escena: solo se ve la mascota del lugar que tiene el relevo. */
  lugar: 'hero' | 'tarjeta';
  /**
   * Tarjeta de Páginas web: true cuando la tarjeta ya casi sale por arriba;
   * la mascota despega hacia la izquierda y sale por el borde de la tarjeta
   * (rumbo a Proyectos). Al volver a false regresa volando y aterriza.
   */
  fuera?: boolean;
  /** Cuánto tiene que volar hacia la izquierda para salir de la tarjeta (px). */
  distanciaFuera?: number;
}

/** Cuánto agrandar el canvas por arriba/abajo sin cambiar el encuadre (px). */
export interface ExtensionLienzo {
  arriba: number;
  abajo: number;
  /** Hacia la izquierda (para salir volando por el borde de la tarjeta). */
  izquierda?: number;
}

/** Lugares de la segunda mitad de Inicio por los que pasa la mascota (paseosMascota.ts). */
export type TipoPaseo = 'proyectos' | 'nosotros' | 'contacto' | 'pie';

/**
 * Paseo de la mascota por una sección (Proyectos, Nosotros, Contacto, pie):
 * la UI mide, en px del canvas, sus puntos de apoyo (el borde de una laptop,
 * de la ventana del estudio, del formulario, las letras del pie) y a cuál
 * toca ir según el scroll. La escena lo pide en cada fotograma (así lo
 * medido y lo pintado son del mismo cuadro) y avisa a la UI de momentos
 * clave (p. ej. 'chapuzon' cuando se zambulle en la ventana de Nosotros).
 */
export interface RecorridoMascota {
  tipo: TipoPaseo;
  medir: () => DatosRecorrido | null;
  avisar?: (evento: string) => void;
}

export interface DatosRecorrido {
  /** Puntos de apoyo (px del canvas); qué es cada uno depende del paseo. */
  anclas: { x: number; y: number }[];
  /** A qué sitio toca ir según el scroll (-1: aún no llega). */
  objetivo: number;
  /** Alto de la mascota en px. */
  alturaPx: number;
  /** Punto al que mirar (px del canvas), p. ej. el campo que se está llenando. */
  mirar?: { x: number; y: number } | null;
  /** Algo la pone contenta (señalar Enviar, mensaje enviado). */
  alegre?: boolean;
  /** Cambia cuando pasa algo que debe notar (otra escena en Nosotros). */
  aviso?: number;
  /** Mouse (px del canvas), si está cerca; null si no. */
  puntero?: { x: number; y: number } | null;
}

/** Animaciones que se le pueden pedir a la mascota desde el menú del hero. */
export type Truco = 'enojarse' | 'correr' | 'chocar' | 'bailar' | 'dormir' | 'voltereta';

/** Dónde se ve la mascota en pantalla (px de la ventana): centro y radio. */
export interface PosicionPantalla {
  x: number;
  y: number;
  r: number;
}

export const senalHero = {
  /** true mientras "Empecemos tu proyecto" está señalado o enfocado. */
  crecer: false,
  /**
   * Relevo de la mascota: es un solo personaje, así que solo se ve en un
   * lugar a la vez. true mientras el hero sigue en pantalla; lo escribe
   * Hero.tsx con el scroll.
   */
  mascotaEnHero: true,

  // ---- Juego con la mascota del hero (solo la escena del hero escribe/lee)
  /** La escena la escribe en cada fotograma; null si no hay escena 3D activa. */
  pantalla: null as PosicionPantalla | null,
  /** Su sitio en reposo (sin flotar ni pasear): ancla quieta para el menú. */
  casa: null as PosicionPantalla | null,
  /** true si se le puede pedir un truco: está en el hero, quieta en su sitio. */
  disponible: false,
  /** La UI pide un truco; la escena lo toma (y lo vuelve a poner en null). */
  pedido: null as Truco | null,
  /** true mientras la escena hace un truco (el menú no se puede abrir). */
  ocupada: false,
  /** El truco en curso (la UI pone a la mascota delante del texto mientras dura). */
  trucoActual: null as Truco | null,
  /** Menú abierto: la mascota vuelve a casa y mira a quien la llamó. */
  menuAbierto: false,
  /** Sube en 1 en cada golpe contra la pantalla (la UI pinta el vidrio roto). */
  golpes: 0,
};
