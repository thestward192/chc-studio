import { useEffect, useRef, type RefObject } from 'react';
import type * as THREE from 'three';
import { useEstudio } from './estadoEstudio';
import { volarA } from './camara';

type V3 = [number, number, number];

export interface AccionInteractiva {
  /** Función para que el texto cambie con el estado ("Encender" / "Apagar"). */
  label: () => string;
  run: () => void;
}

/** Dibuja la vista previa del panel en un canvas 2D (se llama en cada fotograma del panel). */
export type DibujoPreview = (
  ctx: CanvasRenderingContext2D,
  tiempo: number,
  ancho: number,
  alto: number,
) => void;

export interface DefinicionInteractivo {
  id: string;
  nombre: string;
  /** Etiqueta corta en mayúsculas (tipo de objeto): "PROYECTO", "PUERTA"… */
  etiqueta: string;
  foco: { pos: V3; objetivo: V3 };
  /** Texto del panel; si es función se vuelve a evaluar cada 0,5 s. */
  info: string | (() => string);
  /**
   * Contenido aún sin escribir: el panel muestra líneas de marcador (sin
   * texto) en lugar de, o debajo de, `info`.
   */
  pendiente?: boolean;
  acciones: AccionInteractiva[];
  /** Vista previa en canvas (opcional). */
  preview?: DibujoPreview;
  /** Panel ancho (640 px) en vez del normal (380 px). */
  ancho?: boolean;
  /** Grupo para el menú de pausa y la navegación anterior/siguiente. */
  grupo?: 'proyecto' | 'puerta' | 'objeto';
  /** Orden dentro del grupo (anterior/siguiente, menú). */
  orden?: number;
  alHover?: (activo: boolean) => void;
  alEnfocar?: () => void;
  alDesenfocar?: () => void;
}

export interface Interactivo extends DefinicionInteractivo {
  raiz: THREE.Object3D;
}

/** Registro global: id → interactivo (el objeto se actualiza en cada render). */
const registro = new Map<string, Interactivo>();

export function obtenerInteractivo(id: string | null | undefined) {
  return id ? registro.get(id) : undefined;
}

export function listarInteractivos(grupo?: DefinicionInteractivo['grupo']) {
  const ids = useEstudio.getState().interactivos;
  return ids
    .map((id) => registro.get(id))
    .filter((i): i is Interactivo => !!i && (!grupo || i.grupo === grupo))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export function raicesInteractivas() {
  return Array.from(registro.values(), (i) => i.raiz);
}

/**
 * Registra un objeto 3D como interactivo: hover con outline + tooltip,
 * clic para volar a su foco y abrir el panel. Guarda el id en `userData`
 * de todas sus mallas (y de la raíz, por si luego se cambia por un .glb).
 */
export function useInteractivo(
  raizRef: RefObject<THREE.Object3D>,
  /** null o undefined = no registrar (objeto no interactivo). */
  definicion: DefinicionInteractivo | null | undefined,
) {
  // La definición puede cambiar en cada render (funciones nuevas): se guarda
  // la última en el objeto del registro sin volver a registrar.
  const entrada = useRef<Interactivo | null>(null);
  const versionConfig = useEstudio((s) => s.versionConfig);

  if (entrada.current && definicion) Object.assign(entrada.current, definicion);

  useEffect(() => {
    const raiz = raizRef.current;
    if (!raiz || !definicion) return;
    const nuevo: Interactivo = { ...definicion, raiz };
    entrada.current = nuevo;
    registro.set(definicion.id, nuevo);
    raiz.traverse((objeto) => {
      // (los userData compartidos y congelados, como DECORATIVA, no se tocan)
      if (!Object.isFrozen(objeto.userData)) objeto.userData.interactivo = definicion.id;
    });
    const estado = useEstudio.getState();
    if (!estado.interactivos.includes(definicion.id)) {
      estado.set({ interactivos: [...estado.interactivos, definicion.id] });
    }
    return () => {
      registro.delete(definicion.id);
      const actual = useEstudio.getState();
      actual.set({ interactivos: actual.interactivos.filter((id) => id !== definicion.id) });
    };
    // Se vuelve a registrar si cambia el id o la configuración (posiciones).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definicion?.id, versionConfig]);
}

/** Busca el id interactivo de un objeto subiendo por sus padres. */
export function idDesdeObjeto(objeto: THREE.Object3D | null): string | null {
  let actual: THREE.Object3D | null = objeto;
  while (actual) {
    if (actual.userData.interactivo) return actual.userData.interactivo as string;
    if (actual.userData.bloquea) return null;
    actual = actual.parent;
  }
  return null;
}

/** Enfoca un interactivo: vuela la cámara a su foco y abre su panel. */
export function seleccionar(id: string) {
  const siguiente = registro.get(id);
  if (!siguiente) return;
  const estado = useEstudio.getState();
  if (estado.seleccionado && estado.seleccionado !== id) {
    registro.get(estado.seleccionado)?.alDesenfocar?.();
  }
  estado.set({ seleccionado: id, menu: false });
  volarA(siguiente.foco.pos, siguiente.foco.objetivo, {
    alTerminar: () => {
      if (useEstudio.getState().seleccionado === id) siguiente.alEnfocar?.();
    },
  });
}

export function cerrarPanel() {
  const estado = useEstudio.getState();
  if (!estado.seleccionado) return;
  registro.get(estado.seleccionado)?.alDesenfocar?.();
  estado.set({ seleccionado: null });
}

/** Proyecto anterior/siguiente respecto al seleccionado (con vuelta). */
export function vecinoDe(id: string, paso: 1 | -1) {
  const actual = registro.get(id);
  if (!actual?.grupo) return null;
  const lista = listarInteractivos(actual.grupo);
  const i = lista.findIndex((item) => item.id === id);
  if (i < 0 || lista.length < 2) return null;
  return lista[(i + paso + lista.length) % lista.length].id;
}

/** Mallas decorativas (halos, luces aditivas): sin outline ni raycast. */
export const DECORATIVA = Object.freeze({ sinContorno: true });
export const sinRaycast = () => null;

const cacheContorno = new Map<string, THREE.Object3D[]>();

/** Mallas sólidas de un interactivo (lo que dibuja el outline). */
export function mallasContorno(id: string | null): THREE.Object3D[] {
  if (!id) return [];
  const interactivo = registro.get(id);
  if (!interactivo) return [];
  let lista = cacheContorno.get(id);
  if (!lista || lista.length === 0 || lista[0].parent === null) {
    lista = [];
    interactivo.raiz.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !o.userData.sinContorno) lista!.push(o);
    });
    cacheContorno.set(id, lista);
  }
  return lista;
}
