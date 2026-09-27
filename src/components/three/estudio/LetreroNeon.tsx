import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sala } from '../../../theme/theme';
import { crearUniformsNeon, fragmentNeon, vertexNeon } from '../shaders/neon';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { estudioConfig as cfg, focoFrontal } from './estudio.config';
import { ambiente } from './ambiente';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { mascaraNeon } from './texturas';
import { useEstudio } from './estadoEstudio';
import { audio } from './audio';
import { DECORATIVA } from './useInteractivo';

/** El letrero es el logo de marca, como en el header. */
const NOMBRE_NEON = 'CHC STUDIO';

const ANCHO = 2.2;
const ALTO = 0.55;

/** Letrero de neón con el nombre del estudio. Clic: encender/apagar. */
export function LetreroNeon() {
  const m = obtenerMateriales();
  const colocacion = cfg.objetos.neon;

  const recursos = useMemo(() => {
    const u = crearUniformsNeon();
    u.uMascara.value = mascaraNeon(NOMBRE_NEON);
    u.uColor.value.set(sala.neon);
    u.uColor2.value.set(sala.neon2);
    const material = rastrear(
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: vertexNeon,
        fragmentShader: fragmentNeon,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    return { u, material, encendido: true, arranqueInicial: false };
  }, []);
  useEffect(() => () => liberar(recursos.material, recursos.u.uMascara.value), [recursos]);

  useFrame(() => {
    const u = recursos.u;
    const { neon: encendido, fase } = useEstudio.getState();
    // Primer encendido (con parpadeo) cuando el usuario entra al estudio
    if (fase === 'entrando' && !recursos.arranqueInicial) {
      recursos.arranqueInicial = true;
      u.uTiempoCambio.value = ambiente.t + 0.4;
    }
    // Al encender, se marca el instante para el parpadeo de arranque
    if (encendido && !recursos.encendido) u.uTiempoCambio.value = ambiente.t;
    recursos.encendido = encendido;
    u.uTiempo.value = ambiente.t;
    u.uEncendido.value = encendido ? 1 : 0;
    u.uParpadeo.value = ambiente.reducido ? 0 : 1;
    const { dia, noche } = cfg.luces.neon;
    u.uIntensidad.value = dia + (noche - dia) * ambiente.noche;
  });

  return (
    <ObjetoInteractivo
      id="neon"
      nombre={`Neón “${NOMBRE_NEON}”`}
      etiqueta="Letrero"
      posicion={colocacion.pos}
      rotY={colocacion.rotY}
      foco={focoFrontal(colocacion, 3.2, 2.2)}
      info={() =>
        useEstudio.getState().neon ? 'Encendido (con su parpadeo de arranque).' : 'Apagado.'
      }
      acciones={[
        {
          label: () => (useEstudio.getState().neon ? 'Apagar neón' : 'Encender neón'),
          run: () => {
            audio.clic();
            const e = useEstudio.getState();
            e.set({ neon: !e.neon });
          },
        },
      ]}
    >
      {/* Placa de soporte (acrílico oscuro) */}
      <mesh position={[0, 0, 0.01]} material={m.marco}>
        <boxGeometry args={[ANCHO + 0.1, ALTO + 0.06, 0.02]} />
      </mesh>
      <mesh
        position={[0, 0, 0.025]}
        material={recursos.material}
        renderOrder={3}
        userData={DECORATIVA}
      >
        <planeGeometry args={[ANCHO, ALTO]} />
      </mesh>
    </ObjetoInteractivo>
  );
}
