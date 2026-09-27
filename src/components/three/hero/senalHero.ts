/**
 * Canal entre la interfaz del hero y la escena 3D del Núcleo. Es un objeto
 * mutable (no estado de React): la UI escribe y la escena lo lee en cada
 * fotograma. No importa three, así que la UI puede usarlo sin arrastrar la
 * librería al bundle principal.
 */
export const senalHero = {
  /** true mientras "Empecemos tu proyecto" está señalado o enfocado. */
  crecer: false,
};
