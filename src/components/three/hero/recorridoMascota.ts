import { heroConfig } from './hero.config';
import type { DatosRecorrido } from './senalHero';
import {
  rebote,
  salida,
  suave,
  suavisimo,
  tramo,
  volumen,
  type Cara,
  type Efecto,
  type PoseTruco,
} from './trucosMascota';

/**
 * Piezas comunes de los paseos de la mascota por la página (Proyectos,
 * Nosotros, Contacto y el pie) y el recorrido por las tarjetas de Proyectos.
 *
 * Cada paseo es una coreografía con estado propio que, en cada fotograma,
 * recibe de la UI dónde están sus puntos de apoyo (px del canvas) y a cuál
 * toca ir según el scroll, y devuelve la pose del personaje. Los cambios de
 * sitio van por tiempo (no pegados al scroll): así siempre termina posada
 * en algún lugar y nunca a medio aire.
 *
 * Unidades: las del personaje. La escena coloca la cámara para que
 * `alturaPx` px de la pantalla sean ALTO_MASCOTA unidades, así que la escala
 * del cuerpo es 1 y todo lo demás (muelle de la punta, parpadeo) funciona
 * igual que en el hero.
 */

export const [BX, BY] = heroConfig.movimiento.pose;
/** Alto del personaje (de la colita a la punta), en sus unidades. */
export const ALTO_MASCOTA = 2.05;
/** Del centro a la base del cuerpo: lo que se apoya en los bordes. */
const BASE = 0.95;

/** Lienzo de la escena: tamaño en px y escala/distancia de la cámara. */
export interface LienzoRecorrido {
  ancho: number;
  alto: number;
  pxPorUnidad: number;
  distancia: number;
}

/** Una coreografía de paso: pose por fotograma y avisos para la UI. */
export interface Paseo {
  pose: (datos: DatosRecorrido, t: number, lienzo: LienzoRecorrido) => PoseTruco | null;
  /** Avisos pendientes (la escena se los pasa a la UI y vacía la lista). */
  eventos: string[];
}

/** Punto de apoyo en px del canvas; `aire`: fuera de la pantalla, volando. */
export interface Punto {
  x: number;
  y: number;
  aire?: boolean;
}

/**
 * El cuerpo como lo piensan las coreografías: posición en px del canvas
 * (`base`: donde apoya la colita), alto relativo (squash & stretch), giro,
 * cara y mirada.
 */
export interface Cuerpo {
  x: number;
  base: number;
  sy: number;
  giroX: number;
  giroY: number;
  giroZ: number;
  cara: Cara;
  rapidezCara: number;
  mirada: [number, number];
  /** Escala uniforme (se encoge al zambullirse en la ventana de Nosotros). */
  escala?: number;
  efectos?: Efecto[];
}

export function cuerpoEn(x: number, base: number, t: number): Cuerpo {
  return {
    x,
    base,
    sy: 1,
    giroX: BX,
    giroY: BY,
    giroZ: Math.sin(t * 0.9) * 0.035,
    cara: 'neutro',
    rapidezCara: 8,
    mirada: [0, 0.1],
  };
}

/** Pasa el cuerpo (px) a la pose de la escena (unidades). */
export function aPose(c: Cuerpo, lienzo: LienzoRecorrido): PoseTruco {
  const e = c.escala ?? 1;
  const ppu = lienzo.pxPorUnidad;
  const px = (c.x - lienzo.ancho / 2) / ppu;
  // La base apoyada en el punto; el grupo de la escena está 0.08 más abajo
  const py = (lienzo.alto / 2 - c.base) / ppu + BASE * c.sy * e + 0.08;
  const [ex, ey, ez] = volumen(c.sy);
  return {
    pos: [px, py, 0],
    // Compensa la perspectiva: lejos del centro se vería de lado o desde abajo
    rot: [
      c.giroX + Math.atan2(py, lienzo.distancia),
      c.giroY - Math.atan2(px, lienzo.distancia),
      c.giroZ,
    ],
    escala: [ex * e, ey * e, ez * e],
    cara: c.cara,
    rapidezCara: c.rapidezCara,
    mirada: c.mirada,
    rojo: 0,
    giroOjos: 0,
    flex: [0, 0],
    efectos: c.efectos ?? [],
  };
}

/**
 * Posada en un borde: rebota al llegar (sigue al aplaste de la caída),
 * respira, se balancea un poco y de vez en cuando se asoma a mirar lo que
 * tiene debajo (la pantalla de una laptop, la ventana del estudio) y le
 * gusta lo que ve. `semilla` desfasa el ciclo entre lugares.
 */
export function cuerpoPosado(
  p: Punto,
  t: number,
  llegada: number,
  semilla: number,
  asomarse = true,
): Cuerpo {
  const c = cuerpoEn(p.x, p.y, t);
  const tau = t - llegada;
  c.sy = 1 + Math.sin(t * 2.4) * 0.022 - 0.22 * rebote(tau, 2.6, 5.5);
  c.giroY = BY + Math.sin(t * 0.5 + semilla) * 0.12;
  if (tau < 1.1) {
    c.cara = 'alegre';
    return c;
  }
  if (!asomarse) return c;
  const ciclo = (t + semilla * 1.9) % 7.5;
  c.giroX = BX + 0.32 * Math.sin(Math.PI * tramo(ciclo, 1.8, 4.4)) ** 0.6;
  if (ciclo > 1.8 && ciclo < 4.4) {
    c.mirada = [0.1, -1];
    c.rapidezCara = 6;
  } else if (ciclo >= 4.4 && ciclo < 5.6) c.cara = 'alegre';
  return c;
}

/**
 * Salto (o vuelo, si un extremo está fuera de la pantalla) de `a` a `b`,
 * con `h` de 0 a 1: se agacha mirando a donde va, despega estirada, hace un
 * arco y cae aplastándose. Al entrar volando frena planeando; al irse acelera.
 */
export function cuerpoSalto(
  a: Punto,
  b: Punto,
  h: number,
  t: number,
  alturaPx: number,
  arcoMax = 120,
): Cuerpo {
  const dir = Math.sign(b.x - a.x) || 1;
  const despega = !a.aire;
  const aterriza = !b.aire;
  // Tramos: agacharse, vuelo y caída (sin agacharse si ya venía volando)
  const t0 = despega ? 0.22 : 0;
  const t1 = aterriza ? 0.84 : 1;
  const agachar = despega ? suave(tramo(h, 0, t0)) : 0;
  const v = tramo(h, t0, t1);
  const caer = aterriza ? suave(tramo(h, t1, 1)) : 0;

  // Avance: casi constante en los saltos (parabólico); al entrar frena
  // planeando y al irse acelera
  const avance = a.aire ? salida(v) : b.aire ? v * v : (v + suavisimo(v)) / 2;
  const c = cuerpoEn(a.x + (b.x - a.x) * avance, 0, t);
  // Arco: más alto cuanto más lejos salta, sin salirse del canvas por arriba
  const tope = Math.max(Math.min(a.y, b.y) - alturaPx * 1.08 - 6, 0);
  const alturaArco =
    a.aire || b.aire ? 24 : Math.min(Math.abs(b.x - a.x) * 0.16 + 30, arcoMax, tope);
  const bajada = a.aire ? suave(v) : v;
  c.base = a.y + (b.y - a.y) * bajada - 4 * alturaArco * v * (1 - v);

  // Squash & stretch: aplastada al agacharse, estirada al despegar, redonda
  // en la cima, algo estirada antes de caer y aplastada al tocar
  const estiron = v < 0.5 ? 0.2 * (1 - 2 * v) ** 2 : 0.1 * (2 * v - 1) ** 2;
  c.sy = h < t0 ? 1 - 0.2 * agachar : 1 + (v < 1 ? estiron : 0.1) * (1 - caer) - 0.22 * caer;
  if (despega && h >= t0 && h < t0 + 0.06) {
    // Del agachado al estirón sin salto brusco
    c.sy = 0.8 + (1 + estiron - 0.8) * suave(tramo(h, t0, t0 + 0.06));
  }

  // Se gira hacia donde va: empieza al agacharse y vuelve al frente al caer
  const encarar =
    (despega ? suave(tramo(h, 0, t0 + 0.1)) : 1) *
    (aterriza ? 1 - suave(tramo(h, t1 - 0.14, 1)) : 1);
  c.giroY = BY + (dir * Math.PI * 0.42 - BY) * encarar;
  // Al agacharse se echa atrás; en el aire se inclina hacia delante
  c.giroX = BX - 0.16 * agachar * (1 - v) + 0.3 * Math.sin(Math.PI * v) * encarar;
  c.giroZ = dir * 0.08 * agachar * (1 - v);
  c.cara = 'alegre';
  c.rapidezCara = 10;
  // Antes de saltar mira a donde va
  c.mirada = h < t0 ? [dir * 0.85 * agachar, 0.05] : [0, 0.1];
  return c;
}

/**
 * Avance de sitio en sitio: la mascota está en `actual` (-1 y n son "fuera")
 * y va hacia el objetivo de uno en uno, sin saltarse ninguno. Cada paso dura
 * lo que diga `duracion` (más rápido si aún le quedan pasos).
 */
export class Escalones {
  actual = -1;
  salto: { desde: number; hasta: number; inicio: number; duracion: number } | null = null;
  /** Instante del último aterrizaje (para el rebote al posarse). */
  llegada = -99;
  private iniciado = false;

  constructor(
    private readonly duracion: (
      desde: number,
      hasta: number,
      apurada: boolean,
      n: number,
    ) => number,
    /** Al llegar a un paso (la coreografía puede avisar a la UI). */
    private readonly alCambiar?: (desde: number, hasta: number, fase: 'sale' | 'llega') => void,
  ) {}

  avanzar(objetivo: number, t: number, n: number, inicial = -1) {
    if (!this.iniciado) {
      this.iniciado = true;
      this.actual = inicial;
    }
    if (this.salto && t - this.salto.inicio >= this.salto.duracion) {
      const { desde, hasta } = this.salto;
      this.actual = hasta;
      this.salto = null;
      if (hasta >= 0 && hasta < n) this.llegada = t;
      this.alCambiar?.(desde, hasta, 'llega');
    }
    if (!this.salto && objetivo !== this.actual) {
      const hasta = this.actual + Math.sign(objetivo - this.actual);
      const apurada = Math.abs(objetivo - hasta) > 0;
      this.salto = {
        desde: this.actual,
        hasta,
        inicio: t,
        duracion: this.duracion(this.actual, hasta, apurada, n),
      };
      this.alCambiar?.(this.actual, hasta, 'sale');
    }
  }

  /** Avance 0..1 del paso en curso. */
  progreso(t: number) {
    return this.salto ? Math.min((t - this.salto.inicio) / this.salto.duracion, 1) : 1;
  }
}

/**
 * Proyectos: llega volando por la izquierda, se posa sobre la laptop de la
 * primera tarjeta y, según baja el scroll, salta de laptop en laptop (una a
 * una, más rápido si se quedó atrás) hasta la última; después se va volando
 * por la derecha. Al subir hace el camino al revés.
 */
export function crearRecorridoProyectos(): Paseo {
  // Los vuelos de entrada y salida duran más que un salto entre tarjetas
  const pasos = new Escalones(
    (desde, hasta, apurada, n) =>
      (desde < 0 || hasta < 0 || desde >= n || hasta >= n ? 1.3 : 0.74) * (apurada ? 0.62 : 1),
  );
  return {
    eventos: [],
    pose(datos, t, lienzo) {
      const { anclas, alturaPx } = datos;
      const n = anclas.length;
      if (!n) return null;
      const objetivo = Math.min(Math.max(Math.round(datos.objetivo), -1), n);
      // Si al montarse ya se pasó la sección, espera fuera por la derecha
      pasos.avanzar(objetivo, t, n, objetivo >= n ? n : -1);

      // Fuera de la pantalla, algo más alto: entra planeando y baja a posarse
      const punto = (i: number): Punto => {
        if (i < 0) return { x: -alturaPx * 1.4, y: anclas[0].y - alturaPx * 0.5, aire: true };
        if (i >= n)
          return {
            x: lienzo.ancho + alturaPx * 1.4,
            y: anclas[n - 1].y - alturaPx * 0.35,
            aire: true,
          };
        return anclas[i];
      };
      const s = pasos.salto;
      if (s) {
        return aPose(
          cuerpoSalto(punto(s.desde), punto(s.hasta), pasos.progreso(t), t, alturaPx),
          lienzo,
        );
      }
      if (pasos.actual < 0 || pasos.actual >= n) return null;
      return aPose(cuerpoPosado(punto(pasos.actual), t, pasos.llegada, pasos.actual), lienzo);
    },
  };
}
