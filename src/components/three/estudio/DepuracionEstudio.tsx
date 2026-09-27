import { button, Leva, useControls } from 'leva';
import type { Schema } from 'leva/dist/declarations/src/types';
import { estudioConfig } from './estudio.config';
import { useEstudio } from './estadoEstudio';

/**
 * Panel de depuración del estudio (solo en desarrollo, con ?debug).
 * Un control por cada número de estudio.config.ts (luces, posprocesado,
 * shaders, cámara y posiciones). Los cambios de luces, bloom y shaders se
 * ven en el siguiente fotograma; los de posición remontan los objetos.
 * No se guardan: "Copiar config" copia el objeto como JSON.
 */
export default function DepuracionEstudio() {
  return (
    <>
      <Leva collapsed titleBar={{ title: 'Estudio 3D' }} />
      <ControlesGenerales />
      {SECCIONES.map(([titulo, ruta]) => (
        <ControlesSeccion key={titulo} titulo={titulo} ruta={ruta} />
      ))}
    </>
  );
}

// [título en el panel, ruta dentro de estudioConfig]
const SECCIONES: [string, string[]][] = [
  ['luces', ['luces']],
  ['outline', ['posproceso', 'outline']],
  ['bloom', ['posproceso', 'bloom']],
  ['viñeta y tinte', ['posproceso', 'vineta']],
  ['tinte', ['posproceso', 'tinte']],
  ['monitor', ['shaders', 'monitor']],
  ['cuadro', ['shaders', 'cuadro']],
  ['puerta', ['shaders', 'puerta']],
  ['ventana', ['shaders', 'ventana']],
  ['partículas', ['shaders', 'particulas']],
  ['cámara', ['camara']],
  ['cuadros (posición)', ['cuadros']],
  ['puertas (posición)', ['puertas']],
  ['objetos (posición)', ['objetos']],
];

const SECCIONES_DE_POSICION = new Set(['cuadros', 'puertas', 'objetos']);

function ControlesGenerales() {
  useControls('general', {
    noche: {
      value: useEstudio.getState().noche,
      onChange: (v: boolean) => useEstudio.getState().set({ noche: v }),
    },
    calidad: {
      value: 'auto',
      options: ['auto', 'alto', 'medio', 'bajo'],
      onChange: (v: string) =>
        useEstudio.getState().set({ calidadForzada: v === 'auto' ? null : (v as 'alto' | 'medio' | 'bajo') }),
    },
    'Copiar config': button(() => {
      void navigator.clipboard?.writeText(JSON.stringify(estudioConfig, null, 2));
    }),
  });
  return null;
}

function ControlesSeccion({ titulo, ruta }: { titulo: string; ruta: string[] }) {
  useControls(titulo, () => construirEsquema(ruta), { collapsed: true });
  return null;
}

/** Recorre la sección y crea un control por número (o elemento de tupla numérica). */
function construirEsquema(ruta: string[]): Schema {
  let objeto: unknown = estudioConfig;
  for (const clave of ruta) objeto = (objeto as Record<string, unknown>)[clave];
  const esquema: Schema = {};
  const remontar = SECCIONES_DE_POSICION.has(ruta[0]);

  const visitar = (valor: unknown, prefijo: string, asignar: (v: number) => void, profundidad: number) => {
    if (typeof valor === 'number') {
      esquema[prefijo] = {
        value: valor,
        step: Math.abs(valor) >= 10 ? 0.5 : 0.01,
        onChange: (v: number) => {
          asignar(v);
          // Las posiciones se leen al montar: se remontan los objetos
          if (remontar) {
            const e = useEstudio.getState();
            e.set({ versionConfig: e.versionConfig + 1 });
          }
        },
        transient: false,
      };
      return;
    }
    if (profundidad > 3 || valor === null || typeof valor !== 'object') return;
    for (const [clave, hijo] of Object.entries(valor as Record<string, unknown>)) {
      const contenedor = valor as Record<string, unknown>;
      visitar(hijo, prefijo ? `${prefijo}.${clave}` : clave, (v) => (contenedor[clave] = v), profundidad + 1);
    }
  };
  visitar(objeto, '', () => {}, 0);
  return esquema;
}
