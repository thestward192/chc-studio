import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  SMAA,
} from '@react-three/postprocessing';
import {
  BlendFunction,
  type BloomEffect,
  type DepthOfFieldEffect,
  type NoiseEffect,
} from 'postprocessing';
import { laptopConfig as cfg, type NivelCalidad } from './laptop.config';
import { EfectoTonos, EfectoTransicion } from './shaders/transicion';
import type { EstadoIntro } from './estadoIntro';

interface Props {
  calidad: Exclude<NivelCalidad, 'bajo'>;
  estado: EstadoIntro;
}

/**
 * Cadena de postproceso de la intro. Este módulo (y con él `postprocessing`)
 * solo se descarga con import dinámico en los niveles medio y alto.
 *
 * Orden: desenfoque de profundidad (solo alto) → bloom (umbral HDR: solo la
 * pantalla y la línea de la ranura superan 1.0) → transición de entrada →
 * curva de tonos (tonos.ts) → SMAA → grano de película.
 */
export default function PostprocesoIntro({ calidad, estado }: Props) {
  const bloomRef = useRef<BloomEffect>(null);
  const dofRef = useRef<DepthOfFieldEffect>(null);
  const granoRef = useRef<NoiseEffect>(null);
  const transicion = useMemo(() => new EfectoTransicion(), []);
  const tonos = useMemo(() => new EfectoTonos(), []);

  useEffect(
    () => () => {
      transicion.dispose();
      tonos.dispose();
    },
    [transicion, tonos],
  );

  useFrame(() => {
    const pp = cfg.postproceso;
    if (bloomRef.current) {
      bloomRef.current.intensity = pp.bloomIntensidad * estado.bloom;
      bloomRef.current.luminanceMaterial.threshold = pp.bloomUmbral;
      bloomRef.current.luminanceMaterial.smoothing = pp.bloomSuavizado;
    }
    if (dofRef.current) {
      dofRef.current.target?.copy(estado.pantallaCentro);
      dofRef.current.bokehScale = pp.desenfoqueBokeh * estado.desenfoque;
    }
    if (granoRef.current) granoRef.current.blendMode.opacity.value = pp.grano;
    transicion.fuerza = estado.transicion;
    transicion.barril = pp.distorsionBarril;
    transicion.aberracion = pp.aberracionTransicion;
  });

  const alto = calidad === 'alto';

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {alto ? (
        <DepthOfField ref={dofRef} target={[0, 1, -1]} worldFocusRange={2.2} bokehScale={0} />
      ) : (
        <></>
      )}
      <Bloom
        // Los tipos de wrapEffect (v2) esperan la clase, no la instancia.
        ref={bloomRef as never}
        mipmapBlur
        intensity={cfg.postproceso.bloomIntensidad}
        luminanceThreshold={cfg.postproceso.bloomUmbral}
        luminanceSmoothing={cfg.postproceso.bloomSuavizado}
        resolutionScale={alto ? 1 : 0.5}
      />
      <primitive object={transicion} dispose={null} />
      <primitive object={tonos} dispose={null} />
      <SMAA />
      <Noise ref={granoRef as never} blendFunction={BlendFunction.OVERLAY} opacity={cfg.postproceso.grano} />
    </EffectComposer>
  );
}
