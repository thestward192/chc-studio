import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { marca, oficina, sala } from '../../../theme/theme';
import type { Integrante } from '../../../content/equipo';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { ambiente } from '../estudio/ambiente';
import { audio } from '../estudio/audio';
import { obtenerMateriales } from '../estudio/materiales';
import { liberar, rastrear } from '../estudio/recursos';
import { localAMundo } from '../estudio/estudio.config';
import { DECORATIVA } from '../estudio/useInteractivo';
import { focoObjeto, objetos } from './oficinas.config';
import { useMateriales } from './hooksOficina';

const b = objetos.belleza;
const ALTO_MESA = 0.74;

/** Oficina de Fabiola: maquillaje (tocador con espejo de luces, paleta, labiales) y programación (escritorio). */
export function OficinaBelleza({ integrante }: { integrante: Integrante }) {
  return (
    <>
      <Tocador color={integrante.colorLuz} />
      <PaletaMaquillaje />
      <Banco color={integrante.colorLuz} />
      <Florero />
      <EspejoRedondo />
    </>
  );
}

/* ---------------------------------------------------------------- Tocador */

const estadoEspejo = { luces: true };
const BOMBILLAS: [number, number][] = [
  ...[-0.33, -0.11, 0.11, 0.33].map((x) => [x, 0.5] as [number, number]),
  ...[0.3, 0.1, -0.1, -0.3].map((y) => [-0.42, y] as [number, number]),
  ...[0.3, 0.1, -0.1, -0.3].map((y) => [0.42, y] as [number, number]),
];

function Tocador({ color }: { color: string }) {
  const m = obtenerMateriales();
  const mat = useMateriales({
    mueble: { color: oficina.tocador, roughness: 0.45 },
    espejo: { color: oficina.espejo, metalness: 1, roughness: 0.06 },
    marcoEspejo: { color: oficina.tocador, roughness: 0.4 },
    bombilla: {
      color: oficina.bombilla,
      emissive: new THREE.Color(oficina.bombilla),
      emissiveIntensity: 1.5,
    },
    tiradera: { color: oficina.trofeo, metalness: 1, roughness: 0.3 },
    labiales: { color: oficina.trofeo, metalness: 1, roughness: 0.25 },
    l0: { color: oficina.labiales[0], roughness: 0.3 },
    l1: { color: oficina.labiales[1], roughness: 0.3 },
    l2: { color: oficina.labiales[2], roughness: 0.3 },
    vaso: {
      color: new THREE.Color(color).lerp(new THREE.Color(oficina.tocador), 0.4),
      roughness: 0.3,
    },
    cerda: { color: oficina.paleta[0], roughness: 0.9 },
  });
  const luz = useRef<THREE.PointLight>(null);
  const encendido = useRef(1);

  useFrame((state, dt) => {
    const objetivo = estadoEspejo.luces ? 1 : 0;
    encendido.current += (objetivo - encendido.current) * (1 - Math.exp(-dt * 10));
    mat.bombilla.emissiveIntensity = 1.5 * encendido.current;
    if (luz.current) luz.current.intensity = 0.5 * encendido.current;
    if (Math.abs(objetivo - encendido.current) > 0.01) state.invalidate();
  });

  return (
    <ObjetoInteractivo
      id="tocador"
      nombre="Tocador con espejo de luces"
      etiqueta="Maquillaje"
      posicion={b.tocador.pos}
      rotY={b.tocador.rotY}
      foco={focoObjeto(b.tocador, 1.7, 1.45, 1.05)}
      info=""
      pendiente
      acciones={[
        {
          label: () =>
            estadoEspejo.luces ? 'Apagar las luces del espejo' : 'Encender las luces del espejo',
          run: () => {
            estadoEspejo.luces = !estadoEspejo.luces;
            audio.clic();
          },
        },
      ]}
    >
      {/* Mesa con cajones y patas */}
      <mesh position={[0, ALTO_MESA - 0.02, 0]} material={mat.mueble} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.04, 0.46]} />
      </mesh>
      <mesh position={[0, ALTO_MESA - 0.13, -0.02]} material={mat.mueble} castShadow>
        <boxGeometry args={[1.06, 0.18, 0.42]} />
      </mesh>
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, ALTO_MESA - 0.13, 0.195]} material={mat.tiradera}>
          <boxGeometry args={[0.1, 0.012, 0.012]} />
        </mesh>
      ))}
      {[-0.5, 0.5].map((x) =>
        [-0.18, 0.18].map((z) => (
          <mesh
            key={`${x}${z}`}
            position={[x, (ALTO_MESA - 0.22) / 2, z]}
            material={mat.mueble}
            castShadow
          >
            <cylinderGeometry args={[0.022, 0.016, ALTO_MESA - 0.22, 10]} />
          </mesh>
        )),
      )}
      {/* Espejo de camerino con bombillas */}
      <group position={[0, 1.38, -0.2]}>
        <mesh material={mat.marcoEspejo} castShadow>
          <boxGeometry args={[0.96, 1.1, 0.04]} />
        </mesh>
        <mesh position={[0, -0.02, 0.021]} material={mat.espejo}>
          <planeGeometry args={[0.74, 0.88]} />
        </mesh>
        {BOMBILLAS.map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.04]} material={mat.bombilla} userData={DECORATIVA}>
            <sphereGeometry args={[0.028, 14, 10]} />
          </mesh>
        ))}
        <pointLight
          ref={luz}
          position={[0, 0, 0.35]}
          color={oficina.bombilla}
          distance={2.4}
          decay={2}
          intensity={0.5}
        />
      </group>
      {/* Labiales */}
      {[mat.l0, mat.l1, mat.l2].map((tono, i) => (
        <group key={i} position={[0.24 + i * 0.07, ALTO_MESA, 0.08 - i * 0.02]}>
          <mesh position={[0, 0.035, 0]} material={mat.labiales} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.07, 14]} />
          </mesh>
          <mesh position={[0, 0.085, 0]} material={tono}>
            <cylinderGeometry args={[0.01, 0.012, 0.03, 14]} />
          </mesh>
        </group>
      ))}
      {/* Vaso con brochas */}
      <group position={[0.42, ALTO_MESA, -0.08]}>
        <mesh position={[0, 0.06, 0]} material={mat.vaso} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.12, 18]} />
        </mesh>
        {[-0.2, 0.05, 0.25, -0.05].map((giro, i) => (
          <group
            key={i}
            position={[Math.sin(i * 1.7) * 0.018, 0.12, Math.cos(i * 1.7) * 0.018]}
            rotation={[giro * 0.6, 0, giro]}
          >
            <mesh position={[0, 0.05, 0]} material={m.maderaOscura}>
              <cylinderGeometry args={[0.005, 0.006, 0.12, 8]} />
            </mesh>
            <mesh position={[0, 0.125, 0]} material={mat.cerda}>
              <sphereGeometry args={[0.014, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    </ObjetoInteractivo>
  );
}

/* ------------------------------------------------ Paleta de maquillaje */

const estadoPaleta = { abierta: false };

function PaletaMaquillaje() {
  const tapa = useRef<THREE.Group>(null);
  const mat = useMateriales({
    caja: { color: marca.fondoOscuro, roughness: 0.35, metalness: 0.2 },
    espejo: { color: oficina.espejo, metalness: 1, roughness: 0.08 },
    ...Object.fromEntries(
      oficina.paleta.map((col, i) => [`p${i}`, { color: col, roughness: 0.85 }]),
    ),
  } as Record<string, THREE.MeshStandardMaterialParameters>);
  // Sobre la mesa del tocador, a la izquierda
  const posicion = localAMundo(b.tocador, [-0.28, ALTO_MESA, 0.04]);
  const angulo = useRef(0);

  useFrame((state, dt) => {
    const objetivo = estadoPaleta.abierta ? -1.9 : 0;
    angulo.current +=
      (objetivo - angulo.current) * (1 - Math.exp(-dt * (ambiente.reducido ? 40 : 6)));
    if (tapa.current) tapa.current.rotation.x = angulo.current;
    if (Math.abs(objetivo - angulo.current) > 0.002) state.invalidate();
  });

  return (
    <ObjetoInteractivo
      id="paleta-maquillaje"
      nombre="Paleta de sombras"
      etiqueta="Maquillaje"
      posicion={posicion}
      rotY={b.tocador.rotY}
      foco={{
        pos: localAMundo(b.tocador, [-0.1, 1.2, 0.75]),
        objetivo: localAMundo(b.tocador, [-0.28, ALTO_MESA + 0.02, 0.04]),
      }}
      info=""
      pendiente
      acciones={[
        {
          label: () => (estadoPaleta.abierta ? 'Cerrar la paleta' : 'Abrir la paleta'),
          run: () => {
            estadoPaleta.abierta = !estadoPaleta.abierta;
            audio.clic();
          },
        },
      ]}
    >
      <mesh position={[0, 0.012, 0]} material={mat.caja} castShadow>
        <boxGeometry args={[0.24, 0.024, 0.16]} />
      </mesh>
      {oficina.paleta.map((_, i) => (
        <mesh
          key={i}
          position={[-0.075 + (i % 3) * 0.075, 0.0245, -0.035 + Math.floor(i / 3) * 0.07]}
          material={mat[`p${i}`]}
        >
          <cylinderGeometry args={[0.028, 0.028, 0.004, 20]} />
        </mesh>
      ))}
      {/* Tapa con bisagra en el borde trasero y espejito por dentro */}
      <group ref={tapa} position={[0, 0.024, -0.08]}>
        <mesh position={[0, 0.006, 0.08]} material={mat.caja} castShadow>
          <boxGeometry args={[0.24, 0.012, 0.16]} />
        </mesh>
        <mesh position={[0, -0.0005, 0.08]} rotation-x={Math.PI / 2} material={mat.espejo}>
          <planeGeometry args={[0.2, 0.13]} />
        </mesh>
      </group>
    </ObjetoInteractivo>
  );
}

/* ------------------------------------------------------------ Decoración */

function Banco({ color }: { color: string }) {
  const m = obtenerMateriales();
  const mat = useMateriales({
    asiento: {
      color: new THREE.Color(color).lerp(new THREE.Color(oficina.tocador), 0.35),
      roughness: 0.85,
    },
  });
  return (
    <group position={b.banco.pos}>
      <mesh position={[0, 0.46, 0]} material={mat.asiento} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.2, 0.08, 28]} />
      </mesh>
      <mesh position={[0, 0.22, 0]} material={m.cromo} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.42, 12]} />
      </mesh>
      <mesh position={[0, 0.015, 0]} material={m.cromo}>
        <cylinderGeometry args={[0.17, 0.19, 0.03, 24]} />
      </mesh>
    </group>
  );
}

function Florero() {
  const mat = useMateriales({
    jarron: { color: oficina.tocador, roughness: 0.25 },
    tallo: { color: sala.plantaOscura, roughness: 0.8 },
    flor: { color: oficina.flor, roughness: 0.6 },
    centro: { color: oficina.botones[1], roughness: 0.6 },
  });
  const perfil = useMemo(() => {
    const puntos = [
      [0, 0],
      [0.1, 0],
      [0.14, 0.12],
      [0.12, 0.34],
      [0.06, 0.48],
      [0.075, 0.55],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return rastrear(new THREE.LatheGeometry(puntos, 28));
  }, []);
  useEffect(() => () => liberar(perfil), [perfil]);
  const flores = [
    [0.0, 1.02, 0.0, 0],
    [0.12, 0.9, 0.05, 0.35],
    [-0.1, 0.94, -0.04, -0.3],
    [0.05, 0.82, -0.12, 0.2],
    [-0.08, 0.84, 0.1, -0.25],
  ];
  return (
    <group position={b.florero.pos} rotation-y={b.florero.rotY}>
      <mesh geometry={perfil} material={mat.jarron} castShadow receiveShadow />
      {flores.map(([x, y, z, giro], i) => (
        <group key={i}>
          <mesh
            position={[x / 2, (y + 0.5) / 2, z / 2]}
            rotation={[z * 1.2, 0, -x * 1.2 + giro * 0.1]}
            material={mat.tallo}
          >
            <cylinderGeometry args={[0.006, 0.008, y - 0.45, 6]} />
          </mesh>
          <mesh position={[x, y, z]} material={mat.flor} castShadow>
            <icosahedronGeometry args={[0.055, 1]} />
          </mesh>
          <mesh position={[x, y + 0.03, z]} material={mat.centro}>
            <sphereGeometry args={[0.02, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function EspejoRedondo() {
  const mat = useMateriales({
    marco: { color: oficina.trofeo, metalness: 1, roughness: 0.3 },
    espejo: { color: oficina.espejo, metalness: 1, roughness: 0.05 },
  });
  return (
    <group position={b.espejoPared.pos}>
      <mesh position={[0, 0, 0.02]} rotation-x={Math.PI / 2} material={mat.marco} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.04, 48]} />
      </mesh>
      <mesh position={[0, 0, 0.041]} material={mat.espejo}>
        <circleGeometry args={[0.35, 48]} />
      </mesh>
    </group>
  );
}
