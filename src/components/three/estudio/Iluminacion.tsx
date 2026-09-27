import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sala } from '../../../theme/theme';
import { estudioConfig as cfg } from './estudio.config';
import { ambiente } from './ambiente';
import type { NivelCalidad } from './estadoEstudio';

const colorSol = new THREE.Color();
const colorDia = new THREE.Color(sala.sol);
const colorNoche = new THREE.Color(sala.luna);
const mezclar = (a: { dia: number; noche: number }, n: number) => a.dia + (a.noche - a.dia) * n;

/**
 * Luces del estudio, interpoladas entre día y noche con `ambiente.noche`:
 * direccional principal (entra por la ventana, única con sombra
 * PCFSoft), hemisférica y una puntual cálida de rebote. Los reflejos salen
 * de RoomEnvironment prefiltrado con PMREMGenerator: intensidad baja en
 * general y más alta en los metales.
 */
export function Iluminacion({ calidad }: { calidad: NivelCalidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const sol = useRef<THREE.DirectionalLight>(null);
  const hemisferio = useRef<THREE.HemisphereLight>(null);
  const rebote = useRef<THREE.PointLight>(null);
  const ultimaNoche = useRef(-1);
  const entorno = useRef<THREE.Texture | null>(null);

  // Entorno: RoomEnvironment → PMREM (se genera una sola vez)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const habitacion = new RoomEnvironment();
    const objetivo = pmrem.fromScene(habitacion, 0.04);
    scene.environment = objetivo.texture;
    entorno.current = objetivo.texture;
    ultimaNoche.current = -1;
    return () => {
      scene.environment = null;
      entorno.current = null;
      objetivo.dispose();
      pmrem.dispose();
      habitacion.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    };
  }, [gl, scene]);

  // El objetivo de la luz direccional debe estar en la escena
  useEffect(() => {
    const luz = sol.current;
    if (!luz) return;
    luz.target.position.set(0.5, 0, 1);
    scene.add(luz.target);
    return () => {
      scene.remove(luz.target);
    };
  }, [scene]);

  useFrame(() => {
    const n = ambiente.noche;
    const l = cfg.luces;
    if (sol.current) {
      sol.current.intensity = mezclar(l.sol, n);
      sol.current.color.copy(colorSol.copy(colorDia).lerp(colorNoche, n));
      sol.current.position.set(...l.posicionSol);
    }
    if (hemisferio.current) hemisferio.current.intensity = mezclar(l.hemisferio, n);
    if (rebote.current) {
      rebote.current.intensity = mezclar(l.rebote, n);
      rebote.current.position.set(...l.posicionRebote);
    }
    gl.toneMappingExposure = mezclar(l.exposicion, n);

    // Reflejos del entorno. Con scene.environment, three usa
    // scene.environmentIntensity para todos los materiales (intensidad
    // general, baja). Los metales llevan su propio envMap para poder darles
    // más intensidad; se recorren solo cuando cambia la hora.
    scene.environmentIntensity = mezclar(l.entorno, n);
    if (entorno.current && Math.abs(n - ultimaNoche.current) > 0.002) {
      ultimaNoche.current = n;
      const metal = mezclar(l.entornoMetal, n);
      scene.traverse((objeto) => {
        const material = (objeto as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!material?.isMeshStandardMaterial || material.metalness <= 0.5) return;
        if (material.envMap !== entorno.current) {
          material.envMap = entorno.current;
          material.needsUpdate = true;
        }
        material.envMapIntensity = metal;
      });
    }
  });

  const tamSombra = calidad === 'alto' ? 2048 : 1024;
  return (
    <>
      <directionalLight
        ref={sol}
        castShadow={calidad !== 'bajo'}
        shadow-mapSize={[tamSombra, tamSombra]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={2}
        shadow-camera-far={25}
      />
      <hemisphereLight ref={hemisferio} args={[sala.cieloLuz, sala.sueloLuz, 0.8]} />
      <pointLight ref={rebote} color={sala.rebote} distance={9} decay={1.6} />
    </>
  );
}
