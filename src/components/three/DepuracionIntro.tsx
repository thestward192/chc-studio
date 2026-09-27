import { button, Leva, useControls } from 'leva';
import type { Schema } from 'leva/dist/declarations/src/types';
import { avisarCambioConfig, laptopConfig } from './laptop.config';

/**
 * Panel de depuración de la intro (solo en desarrollo, con ?debug en la URL).
 * Genera un control por cada número de laptop.config.ts, agrupados por
 * sección; al moverlos se muta la config en vivo y la escena se redibuja.
 * Los valores no se guardan: cópialos a laptop.config.ts cuando te gusten
 * (el botón "Copiar config" los deja en el portapapeles como JSON).
 */
export default function DepuracionIntro() {
  return (
    <>
      <Leva collapsed={false} titleBar={{ title: 'Intro laptop' }} />
      <ControlesCalidad />
      {SECCIONES.map((seccion) => (
        <ControlesSeccion key={seccion} seccion={seccion} />
      ))}
    </>
  );
}

const SECCIONES = [
  'secuencia',
  'reposo',
  'entrada',
  'pantalla',
  'ranura',
  'estudio',
  'aluminio',
  'postproceso',
  'camara',
  'laptop',
] as const;

type Seccion = (typeof SECCIONES)[number];

function ControlesCalidad() {
  useControls('calidad', {
    forzar: {
      value: laptopConfig.calidad.forzar,
      options: ['auto', 'alto', 'medio', 'bajo'],
      onChange: (valor: typeof laptopConfig.calidad.forzar) => {
        laptopConfig.calidad.forzar = valor;
        avisarCambioConfig();
      },
    },
    'Copiar config': button(() => {
      void navigator.clipboard?.writeText(JSON.stringify(laptopConfig, null, 2));
    }),
  });
  return null;
}

function ControlesSeccion({ seccion }: { seccion: Seccion }) {
  useControls(seccion, () => construirEsquema(seccion), { collapsed: true });
  return null;
}

/** Un control numérico por cada número (o elemento de tupla) de la sección. */
function construirEsquema(seccion: Seccion): Schema {
  const objeto = laptopConfig[seccion] as Record<string, unknown>;
  const esquema: Schema = {};
  for (const [clave, valor] of Object.entries(objeto)) {
    if (typeof valor === 'number') {
      esquema[clave] = control(valor, (v) => (objeto[clave] = v));
    } else if (Array.isArray(valor) && valor.every((n) => typeof n === 'number')) {
      valor.forEach((n: number, i: number) => {
        esquema[`${clave}[${i}]`] = control(n, (v) => ((objeto[clave] as number[])[i] = v));
      });
    }
  }
  return esquema;
}

function control(valor: number, aplicar: (v: number) => void) {
  const paso = Math.abs(valor) >= 100 ? 10 : Math.abs(valor) >= 10 ? 0.5 : 0.005;
  return {
    value: valor,
    step: paso,
    onChange: (v: number) => {
      aplicar(v);
      avisarCambioConfig();
    },
  };
}
