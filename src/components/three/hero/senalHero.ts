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
}

/** Cuánto agrandar el canvas por arriba/abajo sin cambiar el encuadre (px). */
export interface ExtensionLienzo {
  arriba: number;
  abajo: number;
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
