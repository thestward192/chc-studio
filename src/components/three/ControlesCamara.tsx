import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

type V3 = readonly [number, number, number];

interface Props {
  /** Distancia mínima/máxima de acercamiento a la escena. */
  distanciaMinima?: number;
  distanciaMaxima?: number;
  /** Limita cuánto se puede mirar hacia arriba/abajo (radianes). */
  anguloPolarMinimo?: number;
  anguloPolarMaximo?: number;
  objetivo?: [number, number, number];
  /** Caja que la cámara (y su objetivo) nunca abandona: no atraviesa paredes. */
  limites?: { min: V3; max: V3 };
  /** Flechas del teclado para desplazarse (desactivar si la página usa las flechas). */
  teclado?: boolean;
  /** Recibe los controles al montarse (para vuelos de cámara externos). */
  alConectar?: (
    controles: OrbitControlsImpl,
    camara: THREE.PerspectiveCamera,
    invalidate: () => void,
  ) => (() => void) | void;
  /** Se llama cada fotograma con true si la cámara se movió recientemente. */
  alMoverse?: (enMovimiento: boolean) => void;
}

// Referencia estable: si el array cambiara en cada render, R3F volvería a
// aplicar el objetivo y desharía los vuelos de cámara.
const OBJETIVO_POR_DEFECTO: [number, number, number] = [0, 1.2, 0];
const minimo = new THREE.Vector3();
const maximo = new THREE.Vector3();

/**
 * Controles de cámara únicos para las salas 3D: mouse (arrastrar para
 * orbitar, rueda para acercar), táctil (un dedo orbita, pellizco hace
 * zoom; nativo de OrbitControls), teclado opcional, amortiguación y
 * límites que mantienen la cámara dentro de la sala.
 */
export function ControlesCamara({
  distanciaMinima = 1.5,
  distanciaMaxima = 8,
  anguloPolarMinimo = 0,
  anguloPolarMaximo = Math.PI / 1.9,
  objetivo = OBJETIVO_POR_DEFECTO,
  limites,
  teclado = true,
  alConectar,
  alMoverse,
}: Props) {
  const controlesRef = useRef<OrbitControlsImpl | null>(null);
  const camara = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const ultimoMovimiento = useRef(0);
  const anterior = useRef(new THREE.Vector3(Infinity, 0, 0));

  useEffect(() => {
    const controles = controlesRef.current;
    if (!controles) return;
    if (teclado) controles.listenToKeyEvents(document.body);
    const desconectar = alConectar?.(controles, camara, invalidate);
    return () => {
      if (teclado) controles.stopListenToKeyEvents?.();
      desconectar?.();
    };
    // alConectar se usa solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teclado]);

  useFrame((state) => {
    const controles = controlesRef.current;
    if (!controles) return;
    // Mantener cámara y objetivo dentro de la sala
    if (limites) {
      minimo.set(...limites.min);
      maximo.set(...limites.max);
      state.camera.position.clamp(minimo, maximo);
      controles.target.clamp(minimo, maximo);
    }
    // ¿Se movió? (sirve para decidir si se puede renderizar bajo demanda)
    if (alMoverse) {
      const ahora = state.clock.elapsedTime;
      if (anterior.current.distanceToSquared(state.camera.position) > 1e-8) {
        ultimoMovimiento.current = ahora;
        anterior.current.copy(state.camera.position);
      }
      alMoverse(ahora - ultimoMovimiento.current < 0.35);
    }
  });

  return (
    <OrbitControls
      ref={controlesRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={distanciaMinima}
      maxDistance={distanciaMaxima}
      minPolarAngle={anguloPolarMinimo}
      maxPolarAngle={anguloPolarMaximo}
      target={objetivo}
      keyPanSpeed={12}
    />
  );
}
