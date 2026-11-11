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

export const senalHero = {
  /** true mientras "Empecemos tu proyecto" está señalado o enfocado. */
  crecer: false,
  /**
   * Relevo de la mascota: es un solo personaje, así que solo se ve en un
   * lugar a la vez. true mientras el hero sigue en pantalla; lo escribe
   * Hero.tsx con el scroll.
   */
  mascotaEnHero: true,
};
