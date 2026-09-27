import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { sala, ui } from '../../../theme/theme';
import { shaderVinetaTinte } from '../shaders/vinetaTinte';
import { estudioConfig as cfg } from './estudio.config';
import { ambiente } from './ambiente';
import { useEstudio, type NivelCalidad } from './estadoEstudio';
import { mallasContorno } from './useInteractivo';

const tinteDia = new THREE.Color(sala.tinteDia);
const tinteNoche = new THREE.Color(sala.tinteNoche);

/**
 * Cadena de posprocesado (passes de three/examples, cuyos parámetros son
 * justo los del brief: edgeStrength/edgeGlow/edgeThickness del OutlinePass
 * y fuerza/radio/umbral del UnrealBloomPass):
 *
 *   Render → Outline → Bloom → Viñeta + tinte → Output (ACES + sRGB) → SMAA
 *
 * Alto: render target HalfFloat con 4 muestras MSAA (escritorio).
 * Medio: sin MSAA, bloom a media resolución.
 * Bajo: sin outline ni bloom (solo viñeta/tinte y salida).
 */
export function Posproceso({ calidad, movil }: { calidad: NivelCalidad; movil: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const cadena = useMemo(() => {
    const muestras = calidad === 'alto' && !movil ? 4 : 0;
    const objetivo = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: muestras });
    const composer = new EffectComposer(gl, objetivo);
    composer.addPass(new RenderPass(scene, camera));

    let outline: OutlinePass | null = null;
    let bloom: UnrealBloomPass | null = null;
    if (calidad !== 'bajo') {
      outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
      outline.visibleEdgeColor.set(ui.acentoSuave);
      outline.hiddenEdgeColor.set(ui.acento);
      composer.addPass(outline);

      const { fuerza, radio, umbral } = cfg.posproceso.bloom;
      bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), fuerza, radio, umbral);
      if (calidad === 'medio') {
        // Media resolución: el bloom se calcula con la mitad de píxeles
        const original = bloom.setSize.bind(bloom);
        bloom.setSize = (ancho: number, alto: number) => original(Math.round(ancho / 2), Math.round(alto / 2));
      }
      composer.addPass(bloom);
    }

    const vineta = new ShaderPass(shaderVinetaTinte);
    composer.addPass(vineta);
    composer.addPass(new OutputPass());
    const smaa = calidad !== 'bajo' ? new SMAAPass(1, 1) : null;
    if (smaa) composer.addPass(smaa);

    return { composer, objetivo, outline, bloom, vineta, smaa };
  }, [calidad, movil, gl, scene, camera]);

  // Tamaño y DPR
  useEffect(() => {
    cadena.composer.setPixelRatio(dpr);
    cadena.composer.setSize(size.width, size.height);
  }, [cadena, size, dpr]);

  // Liberar render targets, passes y composer
  useEffect(
    () => () => {
      const { composer, objetivo } = cadena;
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
      objetivo.dispose();
    },
    [cadena],
  );

  useFrame((_, dt) => {
    const { composer, outline, bloom, vineta } = cadena;
    const pp = cfg.posproceso;
    const estado = useEstudio.getState();

    if (outline) {
      outline.selectedObjects = mallasContorno(estado.hover);
      outline.edgeStrength = pp.outline.edgeStrength;
      outline.edgeGlow = pp.outline.edgeGlow;
      outline.edgeThickness = pp.outline.edgeThickness;
    }
    if (bloom) {
      bloom.strength = pp.bloom.fuerza;
      bloom.radius = pp.bloom.radio;
      bloom.threshold = pp.bloom.umbral;
    }
    const u = vineta.uniforms;
    u.uFuerza.value = pp.vineta.fuerza;
    u.uInicio.value = pp.vineta.inicio;
    u.uFin.value = pp.vineta.fin;
    u.uAspecto.value = size.width / Math.max(1, size.height);
    (u.uTinte.value as THREE.Color).copy(tinteDia).lerp(tinteNoche, ambiente.noche);
    u.uFuerzaTinte.value = pp.tinte.dia + (pp.tinte.noche - pp.tinte.dia) * ambiente.noche;

    composer.render(dt);
  }, 1);

  return null;
}
