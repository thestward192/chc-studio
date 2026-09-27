import * as THREE from 'three';
import { proyectos } from '../../content/proyectos';
import { equipo } from '../../content/equipo';
import { sala } from '../../theme/theme';
import { CuadroProyecto } from './CuadroProyecto';
import { Puerta } from './Puerta';
import { destinoIntegrante } from './destinoPuerta';
import { estudioConfig as cfg } from './estudio/estudio.config';
import { ambiente } from './estudio/ambiente';
import { LienzoSala } from './estudio/LienzoSala';
import { Sala } from './estudio/Sala';
import { Alfombra } from './estudio/Alfombra';
import { Escritorio } from './estudio/Escritorio';
import { RackServidores } from './estudio/RackServidores';
import { Estanteria } from './estudio/Estanteria';
import { Ventana } from './estudio/Ventana';
import { Pizarra } from './estudio/Pizarra';
import { Cafetera } from './estudio/Cafetera';
import { Planta } from './estudio/Planta';
import { LetreroNeon } from './estudio/LetreroNeon';
import { Particulas } from './estudio/Particulas';

interface Props {
  movimientoReducido: boolean;
}

/**
 * Taller 3D de CHC Studio (estudio.html). Se carga con import dinámico.
 * El motor (canvas, luces, cámara, selección, posprocesado, calidad) es
 * LienzoSala, compartido con las oficinas del equipo; aquí solo va el
 * contenido del taller.
 */
export default function EscenaSalaProyectos({ movimientoReducido }: Props) {
  // Haz de luz de la ventana (para el polvo)
  const [vx, vy, vz] = cfg.objetos.ventana.pos;
  const dirSol = new THREE.Vector3(0.5, 0, 1)
    .sub(new THREE.Vector3(...cfg.luces.posicionSol))
    .normalize();

  return (
    <LienzoSala movimientoReducido={movimientoReducido}>
      {(calidad) => {
        const particulas = cfg.calidad.particulas[calidad];
        return (
          <>
            <Sala />
            <Alfombra />

            {proyectos.slice(0, cfg.cuadros.length).map((proyecto, i) => (
              <CuadroProyecto
                key={proyecto.id}
                proyecto={proyecto}
                indice={i}
                colocacion={cfg.cuadros[i]}
              />
            ))}
            {equipo.slice(0, cfg.puertas.length).map((integrante, i) => (
              <Puerta
                key={integrante.id}
                destino={destinoIntegrante(integrante)}
                indice={i}
                colocacion={cfg.puertas[i]}
              />
            ))}

            <Escritorio
              colocacion={cfg.objetos.escritorios[0]}
              indice={0}
              extra="lampara"
              principal
            />
            <Escritorio colocacion={cfg.objetos.escritorios[1]} indice={1} extra="radio" />
            <RackServidores />
            <Estanteria />
            <Ventana />
            <Pizarra />
            <Cafetera cantidadVapor={particulas.vapor} />
            {cfg.objetos.plantas.map((planta, i) => (
              <Planta
                key={i}
                posicion={planta.pos}
                rotY={planta.rotY}
                escala={i === 2 ? 1.25 : 1}
              />
            ))}
            <LetreroNeon />
            <Particulas
              modo="polvo"
              cantidad={particulas.polvo}
              color={sala.sol}
              tam={cfg.shaders.particulas.tamPolvo}
              cajaMin={[vx + 0.1, 0.2, vz - 2.2]}
              cajaMax={[vx + 5.5, 2.8, vz + 1.4]}
              hazOrigen={[vx, vy, vz]}
              hazDir={[dirSol.x, dirSol.y, dirSol.z]}
              hazRadio={1.1}
              opacidad={() => (1 - ambiente.noche * 0.85) * 0.9}
            />
          </>
        );
      }}
    </LienzoSala>
  );
}
