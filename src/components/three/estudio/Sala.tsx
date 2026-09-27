import { Habitacion } from '../Habitacion';
import { estudioConfig as cfg } from './estudio.config';
import { obtenerMateriales } from './materiales';

/**
 * Cáscara del estudio: la Habitacion reutilizable con los materiales de la
 * sala (suelo de tablas, pared de acento al fondo), zócalos, paneles de luz
 * del techo y bañadores de luz sobre los cuadros de la galería.
 * Las lámparas son emisivas (el bloom las hace brillar), no luces reales.
 */
export function Sala() {
  const m = obtenerMateriales();
  const { ancho, fondo, alto } = cfg.sala;
  const zocalo = 0.1;

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
      {[-3, 0, 3].map((x) => (
        <group key={x} position={[x, alto - 0.02, 0.4]}>
          <mesh material={m.marco}>
            <boxGeometry args={[1.3, 0.03, 0.42]} />
          </mesh>
          <mesh position={[0, -0.017, 0]} rotation-x={Math.PI / 2} material={m.emisivoLampara}>
            <planeGeometry args={[1.2, 0.32]} />
          </mesh>
        </group>
      ))}

      {/* Riel de galería con focos sobre cada cuadro */}
      <mesh position={[0, alto - 0.12, -fondo / 2 + 0.45]} material={m.metal}>
        <boxGeometry args={[10.4, 0.03, 0.03]} />
      </mesh>
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
