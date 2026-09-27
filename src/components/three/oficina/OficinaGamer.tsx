import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { marca, oficina } from '../../../theme/theme';
import type { Integrante } from '../../../content/equipo';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { ambiente } from '../estudio/ambiente';
import { audio } from '../estudio/audio';
import { useEstudio } from '../estudio/estadoEstudio';
import { obtenerMateriales } from '../estudio/materiales';
import { liberar, rastrear } from '../estudio/recursos';
import { DECORATIVA } from '../estudio/useInteractivo';
import { focoObjeto, objetos } from './oficinas.config';
import { useMateriales, usePantallaJuego } from './hooksOficina';
import { texturaPoster } from './texturasOficina';

const g = objetos.gamer;

/** Oficina de Hezron: videojuegos (PC gamer, consola, puff, póster) y programación (escritorio). */
export function OficinaGamer({ integrante }: { integrante: Integrante }) {
  return (
    <>
      <PcGamer color={integrante.colorLuz} />
      <ConsolaTv color={integrante.colorLuz} />
      <Puff color={integrante.colorLuz} />
      <Poster color={integrante.colorLuz} />
    </>
  );
}

/* ------------------------------------------------------------- PC gamer */

const MODOS_RGB = ['Arcoíris', 'Su color', 'Apagado'] as const;
const estadoPc = { modo: 0 };

function PcGamer({ color }: { color: string }) {
  const m = obtenerMateriales();
  const mat = useMateriales({
    gabinete: { color: oficina.gabinetePc, roughness: 0.4, metalness: 0.4 },
    vidrio: {
      color: marca.fondoOscuro,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
    },
  });
  const aros = useMemo(
    () =>
      [0, 1, 2].map(() =>
        rastrear(
          new THREE.MeshStandardMaterial({
            color: marca.fondoOscuro,
            emissive: new THREE.Color(color),
            emissiveIntensity: 2.2,
          }),
        ),
      ),
    [color],
  );
  useEffect(() => () => liberar(...aros), [aros]);
  const tira = useMemo(
    () =>
      rastrear(
        new THREE.MeshStandardMaterial({
          color: marca.fondoOscuro,
          emissive: new THREE.Color(color),
          emissiveIntensity: 1.6,
        }),
      ),
    [color],
  );
  useEffect(() => () => liberar(tira), [tira]);
  const aspas = useRef<THREE.Group[]>([]);
  const propio = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state, dt) => {
    const t = ambiente.t;
    aros.forEach((material, i) => {
      if (estadoPc.modo === 0) material.emissive.setHSL((t * 0.12 + i * 0.12) % 1, 0.85, 0.55);
      else material.emissive.copy(propio);
      material.emissiveIntensity = estadoPc.modo === 2 ? 0 : 2.2;
    });
    tira.emissive.copy(aros[1].emissive);
    tira.emissiveIntensity = estadoPc.modo === 2 ? 0 : 1.6;
    if (!ambiente.reducido && estadoPc.modo !== 2)
      aspas.current.forEach((a) => a && (a.rotation.z -= dt * 9));
    if (useEstudio.getState().seleccionado === 'pc-gamer' && !ambiente.reducido) state.invalidate();
  });

  return (
    <ObjetoInteractivo
      id="pc-gamer"
      nombre="PC gamer"
      etiqueta="Videojuegos"
      posicion={g.pc.pos}
      rotY={g.pc.rotY}
      foco={focoObjeto(g.pc, 1.3, 0.95, 0.3)}
      info=""
      pendiente
      acciones={[
        {
          label: () => `Luces: ${MODOS_RGB[(estadoPc.modo + 1) % MODOS_RGB.length].toLowerCase()}`,
          run: () => {
            estadoPc.modo = (estadoPc.modo + 1) % MODOS_RGB.length;
            audio.clic();
          },
        },
      ]}
    >
      {/* Gabinete sobre patas */}
      <mesh position={[0, 0.3, 0]} material={mat.gabinete} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.52, 0.46]} />
      </mesh>
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 0.09, 0.02, z * 0.18]} material={m.metal}>
            <cylinderGeometry args={[0.015, 0.015, 0.04, 8]} />
          </mesh>
        )),
      )}
      {/* Frente de vidrio con tres ventiladores RGB */}
      <mesh position={[0, 0.3, 0.232]} material={mat.vidrio}>
        <planeGeometry args={[0.22, 0.5]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.14 + i * 0.155, 0.228]}>
          <mesh material={aros[i]} userData={DECORATIVA}>
            <torusGeometry args={[0.062, 0.007, 8, 32]} />
          </mesh>
          <group ref={(n) => n && (aspas.current[i] = n)}>
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh
                key={k}
                rotation-z={(k * Math.PI * 2) / 5}
                position={[0, 0, -0.004]}
                material={mat.gabinete}
              >
                <boxGeometry args={[0.018, 0.1, 0.004]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      {/* Tira de luz en el borde superior */}
      <mesh position={[0, 0.57, 0.05]} material={tira} userData={DECORATIVA}>
        <boxGeometry args={[0.2, 0.008, 0.3]} />
      </mesh>
    </ObjetoInteractivo>
  );
}

/* --------------------------------------------------- Televisor y consola */

const estadoConsola = { encendida: true };

function ConsolaTv({ color }: { color: string }) {
  const m = obtenerMateriales();
  const mat = useMateriales({
    mueble: { color: marca.superficie, roughness: 0.6 },
    consola: { color: oficina.pedestal, roughness: 0.3 },
    mando: { color: oficina.gabinetePc, roughness: 0.5 },
    luz: { color, emissive: new THREE.Color(color), emissiveIntensity: 2 },
  });
  const pantalla = usePantallaJuego({
    modo: 1,
    colorA: color,
    colorB: marca.verde,
    id: 'consola',
    encendida: () => estadoConsola.encendida,
  });

  return (
    <ObjetoInteractivo
      id="consola"
      nombre="Consola y televisor"
      etiqueta="Videojuegos"
      posicion={g.tv.pos}
      rotY={g.tv.rotY}
      foco={focoObjeto(g.tv, 2.0, 1.25, 0.85)}
      info=""
      pendiente
      acciones={[
        {
          label: () => (estadoConsola.encendida ? 'Apagar la consola' : 'Encender la consola'),
          run: () => {
            estadoConsola.encendida = !estadoConsola.encendida;
            if (estadoConsola.encendida) audio.arranque();
            else audio.clic();
          },
        },
      ]}
    >
      {/* Mueble bajo */}
      <mesh position={[0, 0.22, 0]} material={mat.mueble} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.44, 0.38]} />
      </mesh>
      {/* Televisor */}
      <mesh position={[0, 0.49, -0.04]} material={m.metal}>
        <boxGeometry args={[0.28, 0.04, 0.16]} />
      </mesh>
      <mesh position={[0, 0.56, -0.05]} material={m.metal}>
        <boxGeometry args={[0.05, 0.12, 0.03]} />
      </mesh>
      <mesh position={[0, 0.95, -0.06]} material={m.plastico} castShadow>
        <boxGeometry args={[1.16, 0.68, 0.04]} />
      </mesh>
      <mesh position={[0, 0.95, -0.037]} material={pantalla}>
        <planeGeometry args={[1.1, 0.62]} />
      </mesh>
      {/* Consola con su luz y un mando */}
      <mesh position={[0.45, 0.48, 0.02]} material={mat.consola} castShadow>
        <boxGeometry args={[0.3, 0.07, 0.22]} />
      </mesh>
      <mesh position={[0.45, 0.48, 0.131]} material={mat.luz} userData={DECORATIVA}>
        <boxGeometry args={[0.2, 0.006, 0.002]} />
      </mesh>
      <group position={[-0.4, 0.465, 0.08]} rotation-y={0.4}>
        <mesh material={mat.mando} castShadow>
          <boxGeometry args={[0.12, 0.03, 0.07]} />
        </mesh>
        {[-1, 1].map((lado) => (
          <mesh key={lado} position={[lado * 0.065, 0, 0.02]} material={mat.mando}>
            <sphereGeometry args={[0.035, 12, 10]} />
          </mesh>
        ))}
      </group>
    </ObjetoInteractivo>
  );
}

/* ------------------------------------------------------------------ Puff */

function Puff({ color }: { color: string }) {
  const mat = useMateriales({
    tela: {
      color: new THREE.Color(color).lerp(new THREE.Color(marca.fondoOscuro), 0.55),
      roughness: 0.95,
    },
  });
  return (
    <group position={g.puff.pos} rotation-y={g.puff.rotY}>
      <mesh
        position={[0, 0.22, 0]}
        scale={[1, 0.62, 1]}
        material={mat.tela}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.38, 28, 20]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- Póster */

function Poster({ color }: { color: string }) {
  const m = obtenerMateriales();
  const material = useMemo(
    () => rastrear(new THREE.MeshStandardMaterial({ map: texturaPoster(color), roughness: 0.7 })),
    [color],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  return (
    <ObjetoInteractivo
      id="poster"
      nombre="Póster de videojuego"
      etiqueta="Videojuegos"
      posicion={g.poster.pos}
      foco={focoObjeto(g.poster, 1.6, 1.7, g.poster.pos[1])}
      info=""
      pendiente
      acciones={[]}
    >
      <mesh position={[0, 0, 0.012]} material={m.marco} castShadow>
        <boxGeometry args={[0.66, 0.9, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.024]} material={material}>
        <planeGeometry args={[0.6, 0.84]} />
      </mesh>
    </ObjetoInteractivo>
  );
}
