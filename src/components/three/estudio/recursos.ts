/**
 * Registro de todo lo que se crea a mano en el estudio (geometrías,
 * materiales, texturas, render targets, composer…) para liberarlo al salir
 * de la página. Cada componente también libera lo suyo al desmontarse;
 * `liberarTodo()` es la red de seguridad para `pagehide`.
 */
interface Liberable {
  dispose: () => void;
}

const vivos = new Set<Liberable>();

/** Registra un recurso y lo devuelve (para usarlo en línea). */
export function rastrear<T extends Liberable>(recurso: T): T {
  vivos.add(recurso);
  return recurso;
}

/** Libera un recurso ya registrado y lo quita del registro. */
export function liberar(...recursos: (Liberable | null | undefined)[]) {
  for (const recurso of recursos) {
    if (!recurso) continue;
    recurso.dispose();
    vivos.delete(recurso);
  }
}

export function liberarTodo() {
  vivos.forEach((recurso) => {
    try {
      recurso.dispose();
    } catch {
      // Un recurso ya liberado no debe impedir liberar el resto.
    }
  });
  vivos.clear();
}

export function cantidadRecursosVivos() {
  return vivos.size;
}
