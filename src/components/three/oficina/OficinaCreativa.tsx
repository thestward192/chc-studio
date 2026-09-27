import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { marca, oficina } from '../../../theme/theme';
import type { Integrante } from '../../../content/equipo';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { ambiente } from '../estudio/ambiente';
import { audio } from '../estudio/audio';
import { useEstudio } from '../estudio/estadoEstudio';
import { obtenerMateriales } from '../estudio/materiales';
import { liberar, rastrear } from '../estudio/recursos';
import { DECORATIVA, sinRaycast } from '../estudio/useInteractivo';
import { focoObjeto, objetos } from './oficinas.config';
import { useMateriales, usePantallaJuego } from './hooksOficina';
import { texturaPaletaDiseno } from './texturasOficina';

const c = objetos.creativo;

/** Oficina de Stward: videojuegos (arcade), modelado 3D (pedestal) y diseño (muestrario). */
export function OficinaCreativa({ integrante }: { integrante: Integrante }) {
  return (
    <>
      <MaquinaArcade color={integrante.colorLuz} />
      <PedestalModelo color={integrante.colorLuz} />
      <MuestrarioColor color={integrante.colorLuz} />
    </>
  );
}

/* --------------------------------------------------------------- Arcade */

const estadoArcade = { encendida: true };

function MaquinaArcade({ color }: { color: string }) {
  const m = obtenerMateriales();
  const mat = useMateriales({
    cuerpo: { color: oficina.arcade, roughness: 0.55 },
    lateral: { color: oficina.arcadeLateral, roughness: 0.5 },
    franja: { color, emissive: new THREE.Color(color), emissiveIntensity: 1.6 },
    marquesina: {
      color: marca.fondoOscuro,
      emissive: new THREE.Color(color),
      emissiveIntensity: 1.1,
    },
    b0: { color: oficina.botones[0], roughness: 0.3 },
    b1: { color: oficina.botones[1], roughness: 0.3 },
    b2: { color: oficina.botones[2], roughness: 0.3 },
  });
  const pantalla = usePantallaJuego({
    modo: 0,
    colorA: color,
    colorB: marca.verde,
    id: 'arcade',
    encendida: () => estadoArcade.encendida,
  });

  return (
    <ObjetoInteractivo
      id="arcade"
      nombre="Máquina arcade"
      etiqueta="Videojuegos"
      posicion={c.arcade.pos}
      rotY={c.arcade.rotY}
      foco={focoObjeto(c.arcade, 1.55, 1.5, 1.25)}
      info=""
      pendiente
      acciones={[
        {
          label: () => (estadoArcade.encendida ? 'Apagar la máquina' : 'Encender la máquina'),
          run: () => {
            estadoArcade.encendida = !estadoArcade.encendida;
            if (estadoArcade.encendida) audio.arranque();
            else audio.clic();
          },
        },
      ]}
    >
      {/* Mueble: base, cuerpo y marquesina */}
      <mesh position={[0, 0.48, 0]} material={mat.cuerpo} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.96, 0.62]} />
      </mesh>
      <mesh position={[0, 1.38, -0.09]} material={mat.cuerpo} castShadow>
        <boxGeometry args={[0.7, 0.84, 0.44]} />
      </mesh>
      <mesh position={[0, 1.88, -0.04]} material={mat.cuerpo} castShadow>
        <boxGeometry args={[0.7, 0.2, 0.54]} />
      </mesh>
      <mesh position={[0, 1.88, 0.232]} material={mat.marquesina}>
        <boxGeometry args={[0.62, 0.14, 0.01]} />
      </mesh>
      {/* Laterales con franja de luz */}
      {[-1, 1].map((lado) => (
        <group key={lado} position={[lado * 0.36, 0, 0]}>
          <mesh position={[0, 0.98, -0.02]} material={mat.lateral} castShadow>
            <boxGeometry args={[0.03, 1.96, 0.7]} />
          </mesh>
          <mesh
            position={[lado * 0.017, 1.1, 0.2]}
            rotation-x={-0.35}
            material={mat.franja}
            userData={DECORATIVA}
          >
            <boxGeometry args={[0.006, 1.3, 0.025]} />
          </mesh>
        </group>
      ))}
      {/* Pantalla (juego en el shader) con bisel */}
      <mesh position={[0, 1.4, 0.135]} rotation-x={-0.14} material={m.plastico}>
        <boxGeometry args={[0.64, 0.52, 0.02]} />
      </mesh>
      <mesh position={[0, 1.4, 0.147]} rotation-x={-0.14} material={pantalla}>
        <planeGeometry args={[0.56, 0.44]} />
      </mesh>
      {/* Panel de control inclinado con palanca y botones */}
      <group position={[0, 1.0, 0.24]} rotation-x={0.32}>
        <mesh material={mat.cuerpo} castShadow>
          <boxGeometry args={[0.7, 0.05, 0.3]} />
        </mesh>
        <mesh position={[-0.17, 0.07, 0]} material={m.metal}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
        </mesh>
        <mesh position={[-0.17, 0.14, 0]} material={mat.b0}>
          <sphereGeometry args={[0.028, 16, 12]} />
        </mesh>
        {[mat.b0, mat.b1, mat.b2].map((material, i) => (
          <mesh key={i} position={[0.04 + i * 0.075, 0.03, (i % 2) * -0.04]} material={material}>
            <cylinderGeometry args={[0.022, 0.022, 0.025, 16]} />
          </mesh>
        ))}
      </group>
    </ObjetoInteractivo>
  );
}

/* ------------------------------------------------------ Modelo 3D girando */

const FORMAS = ['Icosaedro', 'Nudo', 'Octaedro'] as const;
const estadoModelo = { forma: 0, malla: false };

function PedestalModelo({ color }: { color: string }) {
  const giro = useRef<THREE.Group>(null);
  const mat = useMateriales({
    pedestal: { color: oficina.pedestal, roughness: 0.35 },
    solido: { color, flatShading: true, metalness: 0.25, roughness: 0.35 },
  });
  const recursos = useMemo(() => {
    const geometrias = [
      rastrear(new THREE.IcosahedronGeometry(0.2, 0)),
      rastrear(new THREE.TorusKnotGeometry(0.13, 0.045, 90, 10)),
      rastrear(new THREE.OctahedronGeometry(0.21, 0)),
    ];
    const bordes = geometrias.map((g) => rastrear(new THREE.EdgesGeometry(g, 20)));
    const linea = rastrear(new THREE.LineBasicMaterial({ color: marca.verde, toneMapped: false }));
    return { geometrias, bordes, linea };
  }, []);
  useEffect(
    () => () => liberar(...recursos.geometrias, ...recursos.bordes, recursos.linea),
    [recursos],
  );
  const solido = useRef<THREE.Mesh>(null);
  const lineas = useRef<THREE.LineSegments>(null);

  useFrame((state, dt) => {
    if (giro.current && !ambiente.reducido) giro.current.rotation.y += dt * 0.6;
    if (giro.current)
      giro.current.position.y = 1.18 + Math.sin(ambiente.t * 1.4) * (ambiente.reducido ? 0 : 0.025);
    if (solido.current) {
      solido.current.geometry = recursos.geometrias[estadoModelo.forma];
      solido.current.visible = !estadoModelo.malla;
    }
    if (lineas.current) lineas.current.geometry = recursos.bordes[estadoModelo.forma];
    if (useEstudio.getState().seleccionado === 'pedestal' && !ambiente.reducido) state.invalidate();
  });

  return (
    <ObjetoInteractivo
      id="pedestal"
      nombre="Modelo 3D en el pedestal"
      etiqueta="Modelado 3D"
      posicion={c.pedestal.pos}
      rotY={c.pedestal.rotY}
      foco={focoObjeto(c.pedestal, 1.35, 1.45, 1.05)}
      info=""
      pendiente
      acciones={[
        {
          label: () => `Cambiar forma (${FORMAS[(estadoModelo.forma + 1) % FORMAS.length]})`,
          run: () => {
            estadoModelo.forma = (estadoModelo.forma + 1) % FORMAS.length;
            audio.clic();
          },
        },
        {
          label: () => (estadoModelo.malla ? 'Ver sólido' : 'Ver en malla'),
          run: () => {
            estadoModelo.malla = !estadoModelo.malla;
            audio.clic();
          },
        },
      ]}
    >
      <mesh position={[0, 0.45, 0]} material={mat.pedestal} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.9, 32]} />
      </mesh>
      <mesh position={[0, 0.91, 0]} material={mat.pedestal} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.03, 32]} />
      </mesh>
      <group ref={giro} position={[0, 1.18, 0]}>
        <mesh ref={solido} geometry={recursos.geometrias[0]} material={mat.solido} castShadow />
        <lineSegments
          ref={lineas}
          geometry={recursos.bordes[0]}
          material={recursos.linea}
          userData={DECORATIVA}
          raycast={sinRaycast}
        />
      </group>
    </ObjetoInteractivo>
  );
}

/* ----------------------------------------------------- Muestrario de color */

function MuestrarioColor({ color }: { color: string }) {
  const m = obtenerMateriales();
  const material = useMemo(
    () =>
      rastrear(new THREE.MeshStandardMaterial({ map: texturaPaletaDiseno(color), roughness: 0.6 })),
    [color],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  const invalidate = useThree((s) => s.invalidate);
  const original = useRef<THREE.Color | null>(null);
  const tonos = [color, marca.verde, marca.cian, oficina.botones[0], oficina.botones[1]];
  const indice = useRef(-1);

  const pintarPared = (paso: number) => {
    if (!original.current) original.current = m.paredFondo.color.clone();
    indice.current = paso < 0 ? -1 : (indice.current + 1) % tonos.length;
    const destino =
      indice.current < 0
        ? original.current
        : new THREE.Color(tonos[indice.current]).lerp(new THREE.Color(marca.fondoOscuro), 0.72);
    m.paredFondo.color.copy(destino);
    audio.clic();
    invalidate();
  };

  return (
    <ObjetoInteractivo
      id="muestrario"
      nombre="Muestrario de color"
      etiqueta="Diseño"
      posicion={c.paleta.pos}
      foco={focoObjeto(c.paleta, 1.6, 1.6, c.paleta.pos[1])}
      info=""
      pendiente
      acciones={[
        { label: () => 'Pintar la pared con otro tono', run: () => pintarPared(1) },
        { label: () => 'Volver al tono original', run: () => pintarPared(-1) },
      ]}
    >
      <mesh position={[0, 0, 0.012]} material={m.marco} castShadow>
        <boxGeometry args={[0.86, 0.86, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.024]} material={material}>
        <planeGeometry args={[0.8, 0.8]} />
      </mesh>
    </ObjetoInteractivo>
  );
}
