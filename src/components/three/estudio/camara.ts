import * as THREE from 'three';
import { animate, type JSAnimation } from 'animejs';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { estudioConfig as cfg } from './estudio.config';
import { ambiente } from './ambiente';
import { useEstudio } from './estadoEstudio';

type V3 = readonly [number, number, number] | THREE.Vector3;

/**
 * Vuelos de cámara del estudio. ControlesCamara conecta aquí la cámara y
 * los OrbitControls; cualquier parte (panel, HUD, atajos) puede pedir un
 * vuelo con `volarA`. Durante el vuelo los controles quedan desactivados.
 */
const conexion: {
  camara: THREE.PerspectiveCamera | null;
  controles: OrbitControlsImpl | null;
  invalidate: () => void;
} = { camara: null, controles: null, invalidate: () => {} };

let vueloActual: JSAnimation | null = null;

export function conectarCamara(
  controles: OrbitControlsImpl,
  camara: THREE.PerspectiveCamera,
  invalidate: () => void,
) {
  conexion.camara = camara;
  conexion.controles = controles;
  conexion.invalidate = invalidate;
  return () => {
    vueloActual?.pause();
    conexion.camara = null;
    conexion.controles = null;
  };
}

const aVector = (v: V3) => (v instanceof THREE.Vector3 ? v.clone() : new THREE.Vector3(v[0], v[1], v[2]));

export function volarA(
  pos: V3,
  objetivo: V3,
  opciones: { duracion?: number; alTerminar?: () => void } = {},
) {
  const { camara, controles } = conexion;
  if (!camara || !controles) return;
  vueloActual?.pause();

  const desdePos = camara.position.clone();
  const desdeObj = controles.target.clone();
  const hastaPos = aVector(pos);
  const hastaObj = aVector(objetivo);
  const duracion = ambiente.reducido
    ? cfg.camara.duracionVueloReducido
    : (opciones.duracion ?? cfg.camara.duracionVuelo);

  controles.enabled = false;
  useEstudio.getState().set({ enVuelo: true, camaraEnMovimiento: true });

  const avance = { t: 0 };
  const aplicar = () => {
    camara.position.lerpVectors(desdePos, hastaPos, avance.t);
    controles.target.lerpVectors(desdeObj, hastaObj, avance.t);
    camara.lookAt(controles.target);
    conexion.invalidate();
  };
  const terminar = () => {
    avance.t = 1;
    aplicar();
    controles.enabled = true;
    controles.update();
    useEstudio.getState().set({ enVuelo: false });
    opciones.alTerminar?.();
  };

  if (duracion <= 0) {
    terminar();
    return;
  }
  vueloActual = animate(avance, {
    t: [0, 1],
    duration: duracion,
    ease: 'inOutCubic',
    onUpdate: aplicar,
    onComplete: terminar,
  });
}

export function vistaGeneral(opciones?: { duracion?: number; alTerminar?: () => void }) {
  volarA(cfg.camara.general.pos, cfg.camara.general.objetivo, opciones);
}

/** Coloca la cámara sin animar (p. ej. en la entrada antes de pulsar "Entrar"). */
export function colocarCamara(pos: V3, objetivo: V3) {
  const { camara, controles } = conexion;
  if (!camara || !controles) return;
  camara.position.copy(aVector(pos));
  controles.target.copy(aVector(objetivo));
  camara.lookAt(controles.target);
  controles.update();
  conexion.invalidate();
}

export function camaraConectada() {
  return conexion.camara;
}
