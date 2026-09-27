import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Integrante } from '../../content/equipo';
import { crearUniformsPuerta, fragmentPuerta, vertexPuerta } from './shaders/puerta';
import { estudioConfig as cfg, type Colocacion } from './estudio/estudio.config';
import { DECORATIVA, sinRaycast, useInteractivo } from './estudio/useInteractivo';
import { useEstudio } from './estudio/estadoEstudio';
import { ambiente } from './estudio/ambiente';
import { obtenerMateriales } from './estudio/materiales';
import { liberar, rastrear } from './estudio/recursos';
import { texturaPlaca } from './estudio/texturas';
import { precargar } from './estudio/navegacion';
import { volarA } from './estudio/camara';
import { audio } from './estudio/audio';

interface Props {
  integrante: Integrante;
  indice: number;
  colocacion: Colocacion;
}

const ANGULO_ABIERTA = 1.45;

/**
 * Puerta hacia la habitación de un integrante. Deja escapar una franja de
 * luz de su color (equipo.ts) por debajo y por los bordes, con pulso lento.
 * Al pasar el ratón: más luz, se entreabre y se precarga su página.
 * "Entrar": se abre del todo, la cámara avanza y la luz inunda la pantalla
 * (el fundido y la navegación los hace la interfaz: InundacionLuz).
 */
export function Puerta({ integrante, indice, colocacion }: Props) {
  const raiz = useRef<THREE.Group>(null);
  const bisagra = useRef<THREE.Group>(null);
  const id = `puerta-${integrante.id}`;
  const { ancho, alto } = cfg.puerta;
  const m = obtenerMateriales();

  const recursos = useMemo(() => {
    const crear = (modo: number, medioQuad: [number, number]) => {
      const uniforms = crearUniformsPuerta();
      uniforms.uColor.value.set(integrante.colorLuz);
      uniforms.uMedioPuerta.value.set(ancho / 2, alto / 2);
      uniforms.uMedioQuad.value.set(...medioQuad);
      const material = rastrear(
        new THREE.ShaderMaterial({
          uniforms,
          vertexShader: vertexPuerta,
          fragmentShader: fragmentPuerta,
          defines: { MODO: modo },
          // El vano (modo 2) es una abertura opaca; el halo y el suelo se suman a lo que hay
          transparent: modo !== 2,
          depthWrite: modo === 2,
          blending: modo === 2 ? THREE.NormalBlending : THREE.AdditiveBlending,
          toneMapped: false,
        }),
      );
      return { uniforms, material };
    };
    const hoja = rastrear(new THREE.MeshStandardMaterial({ color: integrante.colorPuerta, roughness: 0.55 }));
    const placa = rastrear(
      new THREE.MeshBasicMaterial({ map: texturaPlaca(integrante.nombre.replace('Texto de marcador: ', ''), integrante.colorLuz) }),
    );
    return {
      pared: crear(0, [(ancho + 1) / 2, (alto + 0.6) / 2]),
      suelo: crear(1, [(ancho + 1.6) / 2, 0.8]),
      interior: crear(2, [ancho / 2, alto / 2]),
      hoja,
      placa,
      angulo: 0,
    };
  }, [integrante, ancho, alto]);

  useEffect(
    () => () =>
      liberar(
        recursos.pared.material,
        recursos.suelo.material,
        recursos.interior.material,
        recursos.hoja,
        recursos.placa,
        recursos.placa.map,
      ),
    [recursos],
  );

  // Foco: delante de la puerta, a media altura
  const nx = Math.sin(colocacion.rotY);
  const nz = Math.cos(colocacion.rotY);
  const [px, , pz] = colocacion.pos;
  const foco = {
    pos: [px + nx * cfg.puerta.distanciaFoco, 1.55, pz + nz * cfg.puerta.distanciaFoco] as [number, number, number],
    objetivo: [px, 1.2, pz] as [number, number, number],
  };

  useInteractivo(raiz, {
    id,
    nombre: integrante.nombre,
    etiqueta: 'Puerta',
    grupo: 'puerta',
    orden: indice,
    foco,
    info: () => `${integrante.rol}\n\n“${integrante.frase}”`,
    acciones: [
      {
        label: () => (useEstudio.getState().puertaEntrando === id ? 'Entrando…' : 'Entrar →'),
        run: () => {
          if (useEstudio.getState().puertaEntrando) return;
          useEstudio.getState().set({ puertaEntrando: id });
          audio.puerta();
          // La cámara avanza hasta el vano mientras la puerta se abre
          volarA([px + nx * 0.3, 1.3, pz + nz * 0.3], [px - nx * 1.5, 1.15, pz - nz * 1.5], { duracion: 1500 });
        },
      },
    ],
    alHover: (activo) => {
      if (activo) precargar(integrante.href);
    },
  });

  useFrame((_, dt) => {
    const estado = useEstudio.getState();
    const entrando = estado.puertaEntrando === id;
    const hover = estado.hover === id || estado.seleccionado === id;
    const p = cfg.shaders.puerta;
    const objetivo = entrando ? ANGULO_ABIERTA : hover ? p.anguloHover : 0;
    recursos.angulo += (objetivo - recursos.angulo) * (1 - Math.exp(-dt * (entrando ? 2.2 : 6)));
    if (bisagra.current) bisagra.current.rotation.y = -recursos.angulo;

    const apertura = recursos.angulo / ANGULO_ABIERTA;
    const intensidad = entrando ? p.intensidadHover * 2 : hover ? p.intensidadHover : p.intensidad;
    for (const capa of [recursos.pared, recursos.suelo, recursos.interior]) {
      const u = capa.uniforms;
      u.uTiempo.value = ambiente.reducido ? 0 : ambiente.t;
      u.uPeriodo.value = p.periodoPulso;
      u.uApertura.value = apertura;
      u.uIntensidad.value += (intensidad - u.uIntensidad.value) * 0.12;
    }
  });

  return (
    <group ref={raiz} position={colocacion.pos} rotation-y={colocacion.rotY}>
      {/* Luz en la pared (bordes y rendija) */}
      <mesh position={[0, alto / 2, 0.003]} material={recursos.pared.material} renderOrder={2} userData={DECORATIVA} raycast={sinRaycast}>
        <planeGeometry args={[ancho + 1, alto + 0.6]} />
      </mesh>
      {/* Abanico de luz en el suelo */}
      <mesh
        position={[0, 0.004, 0.8]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        material={recursos.suelo.material}
        renderOrder={2}
        userData={DECORATIVA}
        raycast={sinRaycast}
      >
        <planeGeometry args={[ancho + 1.6, 1.6]} />
      </mesh>
      {/* Vano iluminado (se ve al abrir) */}
      <mesh position={[0, alto / 2, 0.006]} material={recursos.interior.material} userData={DECORATIVA}>
        <planeGeometry args={[ancho, alto]} />
      </mesh>
      {/* Marco */}
      <mesh position={[-ancho / 2 - 0.04, alto / 2, 0.03]} material={m.marco} castShadow>
        <boxGeometry args={[0.08, alto + 0.08, 0.06]} />
      </mesh>
      <mesh position={[ancho / 2 + 0.04, alto / 2, 0.03]} material={m.marco} castShadow>
        <boxGeometry args={[0.08, alto + 0.08, 0.06]} />
      </mesh>
      <mesh position={[0, alto + 0.04, 0.03]} material={m.marco}>
        <boxGeometry args={[ancho + 0.16, 0.08, 0.06]} />
      </mesh>
      {/* Hoja de la puerta, con bisagra en el lado izquierdo */}
      <group ref={bisagra} position={[-ancho / 2, 0, 0.035]}>
        <mesh position={[ancho / 2, alto / 2 + 0.008, 0]} material={recursos.hoja} castShadow receiveShadow>
          <boxGeometry args={[ancho - 0.01, alto - 0.016, 0.045]} />
        </mesh>
        {/* Manija */}
        <mesh position={[ancho - 0.1, 1.02, 0.05]} rotation-z={Math.PI / 2} material={m.cromo}>
          <cylinderGeometry args={[0.012, 0.012, 0.14, 12]} />
        </mesh>
      </group>
      {/* Placa con el nombre */}
      <mesh position={[0, alto + 0.26, 0.02]} material={recursos.placa}>
        <planeGeometry args={[0.72, 0.18]} />
      </mesh>
    </group>
  );
}
