import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { oficina } from '../../../theme/theme';
import type { Integrante } from '../../../content/equipo';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { ambiente } from '../estudio/ambiente';
import { audio } from '../estudio/audio';
import { obtenerMateriales } from '../estudio/materiales';
import { liberar, rastrear } from '../estudio/recursos';
import { DECORATIVA, sinRaycast } from '../estudio/useInteractivo';
import { focoObjeto, objetos } from './oficinas.config';
import { useMateriales } from './hooksOficina';
import { texturaBalon, texturaCamiseta, texturaCancha } from './texturasOficina';

const f = objetos.futbol;
const RADIO_BALON = 0.11;

/** Oficina de Oscar: fútbol (cancha, portería, balón, camiseta, trofeo) y programación (escritorio). */
export function OficinaFutbol({ integrante }: { integrante: Integrante }) {
  return (
    <>
      <AlfombraCancha />
      <Porteria />
      <Balon />
      <CamisetaEnmarcada nombre={integrante.nombreCorto} color={integrante.colorLuz} />
      <Trofeo />
    </>
  );
}

function AlfombraCancha() {
  const material = useMemo(
    () => rastrear(new THREE.MeshStandardMaterial({ map: texturaCancha(), roughness: 0.95 })),
    [],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  const [ancho, fondo] = f.canchaTam;
  return (
    <mesh
      position={f.cancha.pos}
      rotation-x={-Math.PI / 2}
      material={material}
      receiveShadow
      userData={DECORATIVA}
      raycast={sinRaycast}
    >
      <planeGeometry args={[ancho, fondo]} />
    </mesh>
  );
}

/* ------------------------------------------------------------- Portería */

const ANCHO_ARCO = 1.6;
const ALTO_ARCO = 0.9;
const FONDO_ARCO = 0.5;

function Porteria() {
  const mat = useMateriales({ poste: { color: oficina.red, roughness: 0.35, metalness: 0.2 } });
  const red = useMemo(() => {
    // Red: rejilla de líneas en el fondo, el techo y los laterales
    const puntos: number[] = [];
    const paso = 0.1;
    const linea = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple) => puntos.push(...a, ...b);
    for (let x = -ANCHO_ARCO / 2; x <= ANCHO_ARCO / 2 + 1e-4; x += paso) {
      linea([x, 0, -FONDO_ARCO], [x, ALTO_ARCO, -FONDO_ARCO]);
      linea([x, ALTO_ARCO, -FONDO_ARCO], [x, ALTO_ARCO, 0]);
    }
    for (let y = 0; y <= ALTO_ARCO + 1e-4; y += paso)
      linea([-ANCHO_ARCO / 2, y, -FONDO_ARCO], [ANCHO_ARCO / 2, y, -FONDO_ARCO]);
    for (let z = -FONDO_ARCO; z <= 1e-4; z += paso)
      linea([-ANCHO_ARCO / 2, ALTO_ARCO, z], [ANCHO_ARCO / 2, ALTO_ARCO, z]);
    for (const lado of [-1, 1]) {
      const x = (lado * ANCHO_ARCO) / 2;
      for (let y = 0; y <= ALTO_ARCO + 1e-4; y += paso) linea([x, y, -FONDO_ARCO], [x, y, 0]);
      for (let z = -FONDO_ARCO; z <= 1e-4; z += paso) linea([x, 0, z], [x, ALTO_ARCO, z]);
    }
    const geometria = rastrear(new THREE.BufferGeometry());
    geometria.setAttribute('position', new THREE.Float32BufferAttribute(puntos, 3));
    const material = rastrear(
      new THREE.LineBasicMaterial({ color: oficina.red, transparent: true, opacity: 0.45 }),
    );
    return { geometria, material };
  }, []);
  useEffect(() => () => liberar(red.geometria, red.material), [red]);

  return (
    <ObjetoInteractivo
      id="porteria"
      nombre="Portería"
      etiqueta="Fútbol"
      posicion={f.porteria.pos}
      rotY={f.porteria.rotY}
      foco={focoObjeto(f.porteria, 2.2, 1.3, 0.5)}
      info=""
      pendiente
      acciones={[]}
    >
      {[-1, 1].map((lado) => (
        <mesh
          key={lado}
          position={[(lado * ANCHO_ARCO) / 2, ALTO_ARCO / 2, 0]}
          material={mat.poste}
          castShadow
        >
          <cylinderGeometry args={[0.03, 0.03, ALTO_ARCO, 12]} />
        </mesh>
      ))}
      <mesh position={[0, ALTO_ARCO, 0]} rotation-z={Math.PI / 2} material={mat.poste} castShadow>
        <cylinderGeometry args={[0.03, 0.03, ANCHO_ARCO + 0.06, 12]} />
      </mesh>
      <lineSegments geometry={red.geometria} material={red.material} userData={DECORATIVA} />
    </ObjetoInteractivo>
  );
}

/* ---------------------------------------------------------------- Balón */

function Balon() {
  const balon = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () => rastrear(new THREE.MeshStandardMaterial({ map: texturaBalon(), roughness: 0.45 })),
    [],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  const inicio = useMemo(() => new THREE.Vector3(...f.balon.pos), []);
  const tiro = useRef({
    fase: 'quieto' as 'quieto' | 'va' | 'vuelve',
    t: 0,
    destino: new THREE.Vector3(),
  });
  const eje = useMemo(() => new THREE.Vector3(), []);
  const previa = useMemo(() => new THREE.Vector3(), []);

  const patear = () => {
    if (tiro.current.fase !== 'quieto') return;
    // Hacia la boca de la portería, a una altura de rodado
    const [px, , pz] = f.porteria.pos;
    tiro.current = {
      fase: 'va',
      t: 0,
      destino: new THREE.Vector3(px - 0.2, RADIO_BALON, pz + (Math.random() - 0.5) * 1.0),
    };
    audio.clic();
  };

  useFrame((state, dt) => {
    const b = balon.current;
    const s = tiro.current;
    if (!b || s.fase === 'quieto') return;
    const duracion = ambiente.reducido ? 0.2 : s.fase === 'va' ? 0.9 : 1.6;
    s.t = Math.min(1, s.t + dt / duracion);
    const e = 1 - Math.pow(1 - s.t, 3);
    previa.copy(b.position);
    if (s.fase === 'va') b.position.lerpVectors(inicio, s.destino, e);
    else b.position.lerpVectors(s.destino, inicio, e);
    // Rodar: giro alrededor del eje perpendicular al avance
    const avance = b.position.clone().sub(previa);
    const distancia = avance.length();
    if (distancia > 1e-5) {
      eje.set(avance.z, 0, -avance.x).normalize();
      b.rotateOnWorldAxis(eje, distancia / RADIO_BALON);
    }
    if (s.t >= 1) {
      if (s.fase === 'va') {
        s.fase = 'vuelve';
        s.t = 0;
        audio.clic();
      } else s.fase = 'quieto';
    }
    state.invalidate();
  });

  return (
    <ObjetoInteractivo
      id="balon"
      nombre="Balón"
      etiqueta="Fútbol"
      posicion={[0, 0, 0]}
      foco={{
        pos: [inicio.x + 0.9, 0.9, inicio.z + 1.1],
        objetivo: [inicio.x - 0.6, 0.2, inicio.z - 0.5],
      }}
      info=""
      pendiente
      acciones={[{ label: () => 'Patear al arco', run: patear }]}
    >
      <mesh ref={balon} position={inicio} material={material} castShadow>
        <sphereGeometry args={[RADIO_BALON, 32, 24]} />
      </mesh>
    </ObjetoInteractivo>
  );
}

/* ------------------------------------------------------------- Camiseta */

function CamisetaEnmarcada({ nombre, color }: { nombre: string; color: string }) {
  const m = obtenerMateriales();
  const material = useMemo(
    () =>
      rastrear(
        new THREE.MeshStandardMaterial({ map: texturaCamiseta(nombre, color), roughness: 0.7 }),
      ),
    [nombre, color],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  return (
    <ObjetoInteractivo
      id="camiseta"
      nombre="Camiseta enmarcada"
      etiqueta="Fútbol"
      posicion={f.camiseta.pos}
      foco={focoObjeto(f.camiseta, 1.6, 1.65, f.camiseta.pos[1])}
      info=""
      pendiente
      acciones={[]}
    >
      <mesh position={[0, 0, 0.015]} material={m.maderaOscura} castShadow>
        <boxGeometry args={[0.7, 0.86, 0.03]} />
      </mesh>
      <mesh position={[0, 0, 0.032]} material={material}>
        <planeGeometry args={[0.6, 0.76]} />
      </mesh>
    </ObjetoInteractivo>
  );
}

/* --------------------------------------------------------------- Trofeo */

function Trofeo() {
  const mat = useMateriales({
    oro: { color: oficina.trofeo, metalness: 1, roughness: 0.25 },
    base: { color: oficina.balonParche, roughness: 0.5 },
  });
  const perfil = useMemo(() => {
    const puntos = [
      [0.0, 0.0],
      [0.05, 0.0],
      [0.02, 0.03],
      [0.015, 0.1],
      [0.03, 0.12],
      [0.07, 0.17],
      [0.075, 0.25],
      [0.0, 0.25],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return rastrear(new THREE.LatheGeometry(puntos, 28));
  }, []);
  useEffect(() => () => liberar(perfil), [perfil]);
  return (
    <group position={f.trofeo.pos} rotation-y={f.trofeo.rotY}>
      <mesh position={[0, 0.04, 0]} material={mat.base} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} geometry={perfil} material={mat.oro} castShadow />
    </group>
  );
}
