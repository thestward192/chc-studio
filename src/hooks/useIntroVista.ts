const CLAVE_ALMACENAMIENTO = 'chc-studio:intro-vista';

function leerIntroVista(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_ALMACENAMIENTO) === '1';
  } catch {
    return false;
  }
}

function marcarIntroVista(): void {
  try {
    window.localStorage.setItem(CLAVE_ALMACENAMIENTO, '1');
  } catch {
    // Si localStorage no está disponible (modo privado, permisos, etc.)
    // simplemente no se recuerda: la intro se puede volver a ver.
  }
}

function olvidarIntroVista(): void {
  try {
    window.localStorage.removeItem(CLAVE_ALMACENAMIENTO);
  } catch {
    // Sin localStorage no había nada guardado.
  }
}

export const introVista = { leer: leerIntroVista, marcar: marcarIntroVista, olvidar: olvidarIntroVista };
