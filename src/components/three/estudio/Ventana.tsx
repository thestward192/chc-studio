import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sala } from '../../../theme/theme';
import { crearUniformsVentana, fragmentVentana, vertexVentana } from '../shaders/ventana';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { estudioConfig as cfg, focoFrontal } from './estudio.config';
import { ambiente } from './ambiente';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { useEstudio } from './estadoEstudio';

/**
 * Ventana grande con vista a la ciudad (shader: cielo, nubes y edificios
 * con paralaje). Por aquí entra la luz principal del día. Clic: cambia
 * entre día y noche.
 */
export function Ventana() {
  const m = obtenerMateriales();
  const [ancho, alto] = cfg.objetos.ventanaTam;
  const colocacion = cfg.objetos.ventana;

  const recursos = useMemo(() => {
    const u = crearUniformsVentana();
    u.uCieloDiaArriba.value.set(sala.cieloDiaArriba);
    u.uCieloDiaHorizonte.value.set(sala.cieloDiaHorizonte);
    u.uCieloNocheArriba.value.set(sala.cieloNocheArriba);
    u.uCieloNocheHorizonte.value.set(sala.cieloNocheHorizonte);
    u.uColorNubes.value.set(sala.nubes);
    u.uEdificiosDia.value.set(sala.edificiosDia);
    u.uEdificiosNoche.value.set(sala.edificiosNoche);
    u.uVentanasLuz.value.set(sala.ventanasLuz);
    const material = rastrear(
      new THREE.ShaderMaterial({ uniforms: u, vertexShader: vertexVentana, fragmentShader: fragmentVentana }),
    );
    return { u, material };
  }, []);
  useEffect(() => () => liberar(recursos.material), [recursos]);

  useFrame(() => {
    const u = recursos.u;
    u.uTiempo.value = ambiente.t;
    u.uNoche.value = ambiente.noche;
    u.uTam.value.set(ancho, alto);
    u.uNubes.value = cfg.shaders.ventana.nubes;
    u.uVelocidadNubes.value = cfg.shaders.ventana.velocidadNubes;
  });

  const marco = 0.06;
  return (
    <ObjetoInteractivo
      id="ventana"
      nombre="Ventana a la ciudad"
      etiqueta="Vista"
      posicion={colocacion.pos}
      rotY={colocacion.rotY}
      foco={focoFrontal(colocacion, 2.2, 1.6)}
      info={() => (useEstudio.getState().noche ? 'La ciudad de noche: ventanas encendidas.' : 'Día despejado sobre la ciudad.')}
      acciones={[
        {
          label: () => (useEstudio.getState().noche ? '☀️ Pasar a día' : '🌙 Pasar a noche'),
          run: () => {
            const e = useEstudio.getState();
            e.set({ noche: !e.noche });
          },
        },
      ]}
    >
      <mesh position={[0, 0, 0.01]} material={recursos.material}>
        <planeGeometry args={[ancho, alto]} />
      </mesh>
      {/* Marco y parteluces */}
      <mesh position={[0, alto / 2 + marco / 2, 0.04]} material={m.marco} castShadow>
        <boxGeometry args={[ancho + marco * 2, marco, 0.08]} />
      </mesh>
      <mesh position={[0, -alto / 2 - marco / 2, 0.06]} material={m.marco} castShadow>
        <boxGeometry args={[ancho + marco * 2, marco, 0.16]} />
      </mesh>
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[(lado * (ancho + marco)) / 2, 0, 0.04]} material={m.marco}>
          <boxGeometry args={[marco, alto, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.03]} material={m.marco}>
        <boxGeometry args={[0.035, alto, 0.05]} />
      </mesh>
      <mesh position={[0, alto * 0.18, 0.03]} material={m.marco}>
        <boxGeometry args={[ancho, 0.03, 0.05]} />
      </mesh>
    </ObjetoInteractivo>
  );
}
