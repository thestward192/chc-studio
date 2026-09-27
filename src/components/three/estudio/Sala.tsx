import { Habitacion } from '../Habitacion';
import { estudioConfig as cfg } from './estudio.config';
import { obtenerMateriales } from './materiales';

/**
 * Cáscara de la sala: la Habitacion reutilizable con los materiales de la
 * sala (suelo de tablas, pared de acento al fondo), zócalos, paneles de luz
 * del techo y, si hay cuadros, el riel de galería con un foco sobre cada uno.
 * Las lámparas son emisivas (el bloom las hace brillar), no luces reales.
 * La usan el estudio y las oficinas del equipo (todo sale de la config).
 */
export function Sala() {
  const m = obtenerMateriales();
  const { ancho, fondo, alto, lucesTecho, zLucesTecho } = cfg.sala;
  const zocalo = 0.1;
  const xs = cfg.cuadros.map((c) => c.pos[0]);
  const anchoRiel = xs.length ? Math.max(...xs) - Math.min(...xs) + 2.4 : 0;

  return (
    <Habitacion
      ancho={ancho}
      profundidad={fondo}
      alto={alto}
      materialSuelo={m.suelo}
      materialPared={m.pared}
      materialParedFondo={m.paredFondo}
      materialTecho={m.techo}
      iluminacion={false}
      recibirSombras
    >
      {/* Zócalos */}
      <mesh position={[0, zocalo / 2, -fondo / 2 + 0.01]} material={m.zocalo} receiveShadow>
        <boxGeometry args={[ancho, zocalo, 0.02]} />
      </mesh>
      <mesh position={[0, zocalo / 2, fondo / 2 - 0.01]} material={m.zocalo}>
        <boxGeometry args={[ancho, zocalo, 0.02]} />
      </mesh>
      <mesh position={[-ancho / 2 + 0.01, zocalo / 2, 0]} material={m.zocalo}>
        <boxGeometry args={[0.02, zocalo, fondo]} />
      </mesh>
      <mesh position={[ancho / 2 - 0.01, zocalo / 2, 0]} material={m.zocalo}>
        <boxGeometry args={[0.02, zocalo, fondo]} />
      </mesh>

      {/* Paneles de luz del techo */}
      {lucesTecho.map((x) => (
        <group key={x} position={[x, alto - 0.02, zLucesTecho]}>
          <mesh material={m.marco}>
            <boxGeometry args={[1.3, 0.03, 0.42]} />
          </mesh>
          <mesh position={[0, -0.017, 0]} rotation-x={Math.PI / 2} material={m.emisivoLampara}>
            <planeGeometry args={[1.2, 0.32]} />
          </mesh>
        </group>
      ))}

      {/* Riel de galería con focos sobre cada cuadro */}
      {xs.length > 0 && (
        <mesh
          position={[(Math.max(...xs) + Math.min(...xs)) / 2, alto - 0.12, -fondo / 2 + 0.45]}
          material={m.metal}
        >
          <boxGeometry args={[anchoRiel, 0.03, 0.03]} />
        </mesh>
      )}
      {cfg.cuadros.map((cuadro, i) => (
        <group key={i} position={[cuadro.pos[0], alto - 0.2, -fondo / 2 + 0.45]} rotation-x={0.9}>
          <mesh material={m.metal} castShadow>
            <cylinderGeometry args={[0.045, 0.06, 0.16, 16]} />
          </mesh>
          <mesh position={[0, -0.081, 0]} rotation-x={Math.PI / 2} material={m.emisivoLampara}>
            <circleGeometry args={[0.05, 16]} />
          </mesh>
        </group>
      ))}
    </Habitacion>
  );
}
