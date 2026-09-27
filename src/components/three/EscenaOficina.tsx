import { useEffect } from 'react';
import { marca, oficina } from '../../theme/theme';
import type { Integrante } from '../../content/equipo';
import { Puerta } from './Puerta';
import { estudioConfig as cfg } from './estudio/estudio.config';
import { LienzoSala } from './estudio/LienzoSala';
import { obtenerMateriales } from './estudio/materiales';
import { Sala } from './estudio/Sala';
import { Alfombra } from './estudio/Alfombra';
import { Escritorio } from './estudio/Escritorio';
import { Estanteria } from './estudio/Estanteria';
import { Ventana } from './estudio/Ventana';
import { Planta } from './estudio/Planta';
import { disenoPorSlug } from './oficina/oficinas.config';
import { TableroQueHago } from './oficina/ComunOficina';
import { OficinaCreativa } from './oficina/OficinaCreativa';
import { OficinaFutbol } from './oficina/OficinaFutbol';
import { OficinaGamer } from './oficina/OficinaGamer';
import { OficinaBelleza } from './oficina/OficinaBelleza';

interface Props {
  integrante: Integrante;
  movimientoReducido: boolean;
}

/**
 * Oficina de un integrante (equipo/integrante-N.html). Usa el mismo motor
 * que el taller (LienzoSala) con la sala de oficina de oficinas.config.ts
 * (aplicada por la página antes de montar esto). Base común: escritorio con
 * monitor de código y lámpara, estantería, ventana, planta, tablero "Lo que
 * hago" y la puerta de vuelta al taller; encima, los objetos de sus gustos.
 */
export default function EscenaOficina({ integrante, movimientoReducido }: Props) {
  const diseno = disenoPorSlug[integrante.slug] ?? 'creativo';
  const colorPared = oficina.paredes[integrante.slug] ?? marca.fondoOscuro;

  // Pared de acento del color de la oficina (los materiales son compartidos)
  useEffect(() => {
    obtenerMateriales().paredFondo.color.set(colorPared);
  }, [colorPared]);

  return (
    <LienzoSala movimientoReducido={movimientoReducido} fondo={colorPared}>
      {() => (
        <>
          <Sala />
          {diseno !== 'futbol' && <Alfombra />}
          <Escritorio
            colocacion={cfg.objetos.escritorios[0]}
            indice={0}
            extra="lampara"
            principal
          />
          <Estanteria />
          <Ventana />
          {cfg.objetos.plantas.map((planta, i) => (
            <Planta key={i} posicion={planta.pos} rotY={planta.rotY} />
          ))}
          <TableroQueHago integrante={integrante} />
          <Puerta
            destino={{
              id: 'salida',
              nombre: 'Taller',
              colorLuz: marca.cian,
              colorPuerta: marca.superficie,
              href: '/estudio.html',
              info: 'Vuelve al taller, donde están los proyectos y las otras oficinas.',
              accion: 'Volver al taller',
            }}
            indice={0}
            colocacion={cfg.puertas[0]}
          />

          {diseno === 'creativo' && <OficinaCreativa integrante={integrante} />}
          {diseno === 'futbol' && <OficinaFutbol integrante={integrante} />}
          {diseno === 'gamer' && <OficinaGamer integrante={integrante} />}
          {diseno === 'belleza' && <OficinaBelleza integrante={integrante} />}
        </>
      )}
    </LienzoSala>
  );
}
