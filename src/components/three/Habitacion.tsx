import type { ReactNode } from 'react';
import * as THREE from 'three';
import { colores } from '../../theme/theme';

interface Props {
  ancho?: number;
  profundidad?: number;
  alto?: number;
  colorSuelo?: string;
  colorPared?: string;
  colorTecho?: string;
  /** Materiales propios (tienen prioridad sobre los colores). */
  materialSuelo?: THREE.Material;
  materialPared?: THREE.Material;
  /** Material distinto para la pared del fondo (−Z), p. ej. una pared de acento. */
  materialParedFondo?: THREE.Material;
  materialTecho?: THREE.Material;
  /** Luces de marcador incluidas (ambiental + direccional). false si la escena trae las suyas. */
  iluminacion?: boolean;
  /** Suelo y paredes reciben sombras en tiempo real. */
  recibirSombras?: boolean;
  children?: ReactNode;
}

/**
 * Sala 3D base y reutilizable: suelo, techo y 4 paredes. La usan el estudio
 * (estudio.html) y las 4 habitaciones del equipo, configuradas por props.
 *
 * Las superficies se marcan con `userData.bloquea` para que el raycaster
 * del estudio no "atraviese" paredes al buscar objetos interactivos.
 */
export function Habitacion({
  ancho = 10,
  profundidad = 10,
  alto = 4,
  colorSuelo = colores.superficieAlta,
  colorPared = colores.superficie,
  colorTecho = colores.fondoAlterno,
  materialSuelo,
  materialPared,
  materialParedFondo,
  materialTecho,
  iluminacion = true,
  recibirSombras = false,
  children,
}: Props) {
  const mitadAncho = ancho / 2;
  const mitadProfundidad = profundidad / 2;
  const bloquea = { bloquea: true };

  const pared = (material?: THREE.Material) =>
    material ? <primitive object={material} attach="material" /> : (
      <meshStandardMaterial color={colorPared} side={THREE.DoubleSide} />
    );

  return (
    <group>
      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={recibirSombras} userData={bloquea}>
        <planeGeometry args={[ancho, profundidad]} />
        {materialSuelo ? (
          <primitive object={materialSuelo} attach="material" />
        ) : (
          <meshStandardMaterial color={colorSuelo} side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* Techo */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, alto, 0]} userData={bloquea}>
        <planeGeometry args={[ancho, profundidad]} />
        {materialTecho ? (
          <primitive object={materialTecho} attach="material" />
        ) : (
          <meshStandardMaterial color={colorTecho} side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* Pared trasera (-Z) */}
      <mesh position={[0, alto / 2, -mitadProfundidad]} receiveShadow={recibirSombras} userData={bloquea}>
        <planeGeometry args={[ancho, alto]} />
        {pared(materialParedFondo ?? materialPared)}
      </mesh>

      {/* Pared frontal (+Z) */}
      <mesh
        position={[0, alto / 2, mitadProfundidad]}
        rotation={[0, Math.PI, 0]}
        receiveShadow={recibirSombras}
        userData={bloquea}
      >
        <planeGeometry args={[ancho, alto]} />
        {pared(materialPared)}
      </mesh>

      {/* Pared izquierda (-X) */}
      <mesh
        position={[-mitadAncho, alto / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow={recibirSombras}
        userData={bloquea}
      >
        <planeGeometry args={[profundidad, alto]} />
        {pared(materialPared)}
      </mesh>

      {/* Pared derecha (+X) */}
      <mesh
        position={[mitadAncho, alto / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow={recibirSombras}
        userData={bloquea}
      >
        <planeGeometry args={[profundidad, alto]} />
        {pared(materialPared)}
      </mesh>

      {iluminacion && (
        <>
          {/* Luz horneada de marcador: ambiental + una direccional suave,
              sin sombras en tiempo real (ver theme.ts > iluminacion). */}
          <ambientLight intensity={0.6} color={colores.acento} />
          <directionalLight position={[4, alto + 2, 4]} intensity={0.8} castShadow={false} />
        </>
      )}

      {children}
    </group>
  );
}
