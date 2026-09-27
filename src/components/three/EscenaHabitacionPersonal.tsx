import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, Html, PerformanceMonitor, Text, useCursor } from '@react-three/drei';
import { useState } from 'react';
import { Habitacion } from './Habitacion';
import { ControlesCamara } from './ControlesCamara';
import type { Integrante, ObjetoGusto } from '../../content/equipo';
import { colores } from '../../theme/theme';
import { obtenerRangoDpr } from '../../utils/rendimiento';

interface Props {
  integrante: Integrante;
  onVolver: (href: string) => void;
}

function GeometriaPorForma({ forma }: { forma: ObjetoGusto['formaPlaceholder'] }) {
  switch (forma) {
    case 'esfera':
      return <sphereGeometry args={[0.35, 24, 24]} />;
    case 'cilindro':
      return <cylinderGeometry args={[0.3, 0.3, 0.6, 20]} />;
    case 'cono':
      return <coneGeometry args={[0.35, 0.6, 20]} />;
    case 'torus':
      return <torusGeometry args={[0.3, 0.12, 16, 32]} />;
    case 'caja':
    default:
      return <boxGeometry args={[0.5, 0.5, 0.5]} />;
  }
}

/**
 * Objeto de gustos personales dentro de la habitación de un integrante
 * (geometría simple de marcador; ver ModeloGLTF.tsx para usar un .glb).
 */
function ObjetoGustoHabitacion({ objeto }: { objeto: ObjetoGusto }) {
  const [activo, setActivo] = useState(false);
  useCursor(activo);

  return (
    <group position={objeto.posicion}>
      <mesh
        onPointerOver={() => setActivo(true)}
        onPointerOut={() => setActivo(false)}
        onClick={(evento) => {
          evento.stopPropagation();
          setActivo((v) => !v);
        }}
      >
        <GeometriaPorForma forma={objeto.formaPlaceholder} />
        <meshStandardMaterial color={objeto.colorPlaceholder} />
      </mesh>
      {activo && (
        <Html position={[0, 0.6, 0]} center distanceFactor={6} occlude>
          <div className="etiqueta-objeto-3d">
            <strong>{objeto.nombre}</strong>
            <p>{objeto.descripcion}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function PuertaSalida({ onVolver }: { onVolver: (href: string) => void }) {
  const [sobre, setSobre] = useState(false);
  useCursor(sobre);

  return (
    <group
      position={[0, 0, 4.9]}
      rotation={[0, Math.PI, 0]}
      onPointerOver={() => setSobre(true)}
      onPointerOut={() => setSobre(false)}
      onClick={(evento) => {
        evento.stopPropagation();
        onVolver('/estudio.html');
      }}
    >
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.9, 2.2, 0.08]} />
        <meshStandardMaterial
          color={colores.marca}
          emissive={sobre ? colores.acento : '#000000'}
          emissiveIntensity={sobre ? 0.25 : 0}
        />
      </mesh>
      <Text position={[0, 2.5, 0]} fontSize={0.16} color={colores.texto} anchorX="center">
        Volver a la sala de proyectos
      </Text>
    </group>
  );
}

export default function EscenaHabitacionPersonal({ integrante, onVolver }: Props) {
  const [dprMax, setDprMax] = useState(() => obtenerRangoDpr()[1]);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, dprMax]}
      camera={{ fov: 50, position: [0, 1.6, 3.5] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor onDecline={() => setDprMax((actual) => Math.max(1, actual - 0.5))} />
      <AdaptiveDpr pixelated={false} />
      <color attach="background" args={[colores.fondo]} />
      <Habitacion ancho={10} profundidad={10} alto={4}>
        {integrante.objetosHabitacion.map((objeto) => (
          <ObjetoGustoHabitacion key={objeto.id} objeto={objeto} />
        ))}
        <PuertaSalida onVolver={onVolver} />
      </Habitacion>
      <ControlesCamara distanciaMinima={1.2} distanciaMaxima={7} />
    </Canvas>
  );
}
