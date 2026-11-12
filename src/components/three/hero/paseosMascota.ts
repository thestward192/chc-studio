import type { DatosRecorrido, TipoPaseo } from './senalHero';
import {
  aPose,
  BX,
  BY,
  crearRecorridoProyectos,
  cuerpoEn,
  cuerpoPosado,
  cuerpoSalto,
  Escalones,
  type Cuerpo,
  type Paseo,
  type Punto,
} from './recorridoMascota';
import { rebote, salida, suave, suavisimo, tramo } from './trucosMascota';

/**
 * Coreografías de la mascota en la segunda mitad de Inicio (ver
 * recorridoMascota.ts): Nosotros, Contacto y el pie. Recorrido completo:
 *
 * - Proyectos: salta de laptop en laptop y se va volando por la derecha.
 * - Nosotros: vuelve por la derecha y se posa en el borde de la ventana del
 *   estudio 3D; al cambiar de escena da un saltito y se asoma a mirarla. Al
 *   seguir bajando se zambulle en la ventana (entra al estudio).
 * - Contacto: reaparece pequeña asomándose por detrás del vidrio del
 *   formulario, mira a los lados y sube a sentarse en su borde; mira el campo
 *   que se está llenando y se alegra al señalar "Enviar". Al seguir bajando
 *   se esconde detrás del formulario.
 * - Pie: se asoma por encima de las letras de "CHC STUDIO", de letra en
 *   letra (a veces solo los ojos, a veces medio cuerpo y a veces da un
 *   salto); si el mouse se le acerca, se esconde asustada.
 */

const TAU = Math.PI * 2;
const limitar = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

export function crearPaseo(tipo: TipoPaseo): Paseo {
  if (tipo === 'nosotros') return crearPaseoNosotros();
  if (tipo === 'contacto') return crearPaseoContacto();
  if (tipo === 'pie') return crearPaseoPie();
  return crearRecorridoProyectos();
}

/* ------------------------------------------------------------------ Nosotros */

/**
 * Sitios: -1 fuera por la derecha, 0 posada en el borde de la ventana,
 * 1 dentro de la ventana (zambullida). Anclas: [borde, centro de la ventana].
 * Avisa a la UI 'chapuzon' al entrar en la ventana y 'emerger' al salir (la
 * ventana hace una onda).
 */
function crearPaseoNosotros(): Paseo {
  const eventos: string[] = [];
  const zambullida = (desde: number, hasta: number) => Math.max(desde, hasta) === 1;
  const pasos = new Escalones(
    (desde, hasta, apurada) => (zambullida(desde, hasta) ? 1.2 : 1.3) * (apurada ? 0.7 : 1),
    (desde, hasta, fase) => {
      if (fase === 'llega' && hasta === 1) eventos.push('chapuzon');
      if (fase === 'sale' && desde === 1) eventos.push('emerger');
    },
  );
  let aviso: number | undefined;
  let reaccion = -99;
  return {
    eventos,
    pose(datos, t, lienzo) {
      const [borde, centro] = datos.anclas;
      if (!borde || !centro) return null;
      const h = datos.alturaPx;
      const objetivo = limitar(Math.round(datos.objetivo), -1, 1);
      pasos.avanzar(objetivo, t, 1, objetivo === 1 ? 1 : -1);
      // Otra escena en la ventana: lo nota
      if (datos.aviso !== aviso) {
        if (aviso !== undefined) reaccion = t;
        aviso = datos.aviso;
      }

      const s = pasos.salto;
      if (s) {
        const u = pasos.progreso(t);
        if (zambullida(s.desde, s.hasta)) {
          const c = cuerpoZambullida(borde, centro, s.desde === 0 ? u : 1 - u, t, h);
          return (c.escala ?? 1) < 0.03 ? null : aPose(c, lienzo);
        }
        const fuera: Punto = { x: lienzo.ancho + h * 1.4, y: borde.y - h * 0.6, aire: true };
        const a = s.desde < 0 ? fuera : borde;
        const b = s.hasta < 0 ? fuera : borde;
        return aPose(cuerpoSalto(a, b, u, t, h), lienzo);
      }
      if (pasos.actual !== 0) return null;

      const c = cuerpoPosado(borde, t, pasos.llegada, 3);
      // Reacción al cambio de escena: saltito en el sitio y se asoma a mirar
      const tr = t - reaccion;
      if (tr >= 0 && tr < 2.6) {
        if (tr < 0.5) {
          const v = tr / 0.5;
          c.base -= 4 * 0.3 * h * v * (1 - v);
          c.sy = 1 + 0.12 * Math.sin(Math.PI * v);
          c.cara = 'alegre';
        } else {
          c.sy *= 1 - 0.2 * rebote(tr - 0.5, 2.6, 6);
          const mirar = Math.sin(Math.PI * tramo(tr, 0.6, 2.6)) ** 0.6;
          c.giroX = BX + 0.36 * mirar;
          c.giroY = BY - 0.25 * mirar;
          c.mirada = [-0.45 * mirar, -mirar];
          c.cara = tr < 1 ? 'alegre' : 'neutro';
        }
      }
      return aPose(c, lienzo);
    },
  };
}

/**
 * Zambullida en la ventana (h de 0 a 1; al revés, sale de ella): se agacha
 * mirando la ventana, salta en arco dando una vuelta y se encoge hacia el
 * centro de la imagen, de cabeza, como si entrara al estudio.
 */
function cuerpoZambullida(borde: Punto, centro: Punto, h: number, t: number, alturaPx: number) {
  const t0 = 0.2;
  const agachar = suave(tramo(h, 0, t0));
  const v = tramo(h, t0, 1);
  const c = cuerpoEn(borde.x + (centro.x - borde.x) * suave(v), 0, t);
  c.base = borde.y + (centro.y - borde.y) * v ** 1.8 - 4 * 0.6 * alturaPx * v * (1 - v);
  c.escala = 1 - suave(tramo(v, 0.3, 1));
  const estiron = 1 + 0.15 * Math.sin(Math.PI * v);
  c.sy = h < t0 ? 1 - 0.2 * agachar : 0.8 + (estiron - 0.8) * suave(tramo(v, 0, 0.12));
  c.giroY = BY + TAU * suavisimo(tramo(v, 0.12, 0.95));
  c.giroX = BX - 0.16 * agachar * (1 - v) + 0.6 * suave(tramo(v, 0.4, 1));
  c.cara = 'alegre';
  c.rapidezCara = 10;
  c.mirada = h < t0 ? [-0.5 * agachar, -0.7 * agachar] : [0, -0.3];
  return c;
}

/* ------------------------------------------------------------------ Contacto */

/**
 * Sitios: -1 escondida detrás del formulario, 0 sentada en su borde. El
 * canvas está detrás del formulario (vidrio): escondida se ve borrosa a
 * través de él, como algo detrás de un cristal esmerilado.
 */
function crearPaseoContacto(): Paseo {
  const pasos = new Escalones((_, hasta) => (hasta === 0 ? 1.8 : 0.6));
  return {
    eventos: [],
    pose(datos, t, lienzo) {
      const p = datos.anclas[0];
      if (!p) return null;
      const h = datos.alturaPx;
      pasos.avanzar(datos.objetivo === 0 ? 0 : -1, t, 1);
      const escondida = p.y + h * 1.05;
      const asomada = p.y + h * 0.3;

      const s = pasos.salto;
      if (s) {
        const u = pasos.progreso(t);
        return aPose(
          s.hasta === 0
            ? cuerpoSubir(p, u, t, h, escondida, asomada)
            : cuerpoBajar(p, u, t, h, escondida),
          lienzo,
        );
      }
      if (pasos.actual !== 0) return null;

      const c = cuerpoPosado(p, t, pasos.llegada, 5, !datos.mirar);
      // Mira el campo que se está llenando
      if (datos.mirar) {
        const dx = datos.mirar.x - p.x;
        const dy = datos.mirar.y - (p.y - h * 0.5);
        c.mirada = [limitar(dx / 260, -1, 1), limitar(-dy / 260, -1, 1)];
        c.giroY = BY + limitar(dx / 700, -0.5, 0.5);
        c.giroX = BX + limitar(dy / 900, -0.1, 0.3);
      }
      // Señalar "Enviar" (o ya enviado): contenta, a saltitos
      if (datos.alegre) {
        const r = Math.abs(Math.sin(t * Math.PI * 1.9));
        c.cara = 'alegre';
        c.base -= r * 0.14 * h;
        c.sy = 1 + 0.07 * r - 0.14 * (1 - r) ** 6;
      }
      return aPose(c, lienzo);
    },
  };
}

/** Se asoma por detrás del formulario, mira a los lados y sube a sentarse en el borde. */
function cuerpoSubir(
  p: Punto,
  u: number,
  t: number,
  h: number,
  escondida: number,
  asomada: number,
) {
  const c = cuerpoEn(p.x, asomada, t);
  if (u < 0.22) {
    const k = salida(tramo(u, 0, 0.22));
    c.base = escondida + (asomada - escondida) * k;
    c.sy = 1 + 0.12 * (1 - k);
    c.mirada = [0, 0.2];
  } else if (u < 0.62) {
    // Primero a la izquierda, luego a la derecha
    const m = tramo(u, 0.22, 0.62);
    const lado = m < 0.5 ? -1 : 1;
    const fuerza = Math.sin(Math.PI * ((m * 2) % 1));
    c.mirada = [lado * 0.9 * fuerza, 0.1];
    c.giroY = BY + lado * 0.35 * fuerza;
    c.sy = 1 + Math.sin(t * 2.4) * 0.02;
  } else if (u < 0.72) {
    c.sy = 1 - 0.18 * suave(tramo(u, 0.62, 0.72));
    c.cara = 'alegre';
  } else {
    const v = tramo(u, 0.72, 0.92);
    const caer = suave(tramo(u, 0.92, 1));
    c.base = asomada + (p.y - asomada) * v - 4 * 0.5 * h * v * (1 - v);
    const estiron = 1 + 0.2 * (1 - v) ** 2 + 0.1 * v ** 2;
    c.sy =
      caer > 0
        ? 1 + 0.1 * (1 - caer) - 0.22 * caer
        : 0.82 + (estiron - 0.82) * suave(tramo(v, 0, 0.1));
    c.giroX = BX + 0.2 * Math.sin(Math.PI * v);
    c.cara = 'alegre';
  }
  return c;
}

/** Saltito de despedida y se deja caer detrás del formulario. */
function cuerpoBajar(p: Punto, u: number, t: number, h: number, escondida: number): Cuerpo {
  const c = cuerpoEn(p.x, p.y, t);
  const sube = tramo(u, 0, 0.3);
  const baja = tramo(u, 0.3, 1);
  c.base =
    p.y -
    (u < 0.3 ? 4 * 0.22 * h * sube * (1 - sube) : 0) +
    (escondida + h * 0.25 - p.y) * baja * baja;
  c.sy = u < 0.3 ? 1 + 0.1 * Math.sin(Math.PI * sube) : 1 + 0.14 * baja;
  c.escala = 1 - 0.35 * suave(baja);
  c.giroX = BX - 0.1 * Math.sin(Math.PI * sube);
  c.cara = 'alegre';
  c.mirada = [0, 0.3];
  return c;
}

/* ------------------------------------------------------------------ Pie */

type FasePie = 'oculta' | 'subir' | 'arriba' | 'bajar';
type VariantePie = 'ojos' | 'medio' | 'salto';

/** Cuánto asoma (centro del cuerpo sobre la línea de las letras, en unidades). */
const ASOMA: Record<VariantePie, number> = { ojos: 0.42, medio: 0.8, salto: 0.8 };
/** Escondida: la punta queda justo debajo de la línea. */
const ESCONDIDA = -1.15;

/**
 * Anclas: el centro de la parte de arriba de cada letra donde se puede
 * asomar (px del canvas; el canvas termina justo en esa línea, así que lo
 * de abajo no se ve: parece que está detrás de las letras). Objetivo: 0
 * mientras las letras están a la vista, -1 si no.
 */
function crearPaseoPie(): Paseo {
  let fase: FasePie = 'oculta';
  let inicio = 0;
  let siguiente = 0.5;
  let letra = -1;
  let variante: VariantePie = 'medio';
  let arriba = 2.6;
  let susto = false;
  return {
    eventos: [],
    pose(datos, t, lienzo) {
      const { anclas, alturaPx: h, puntero } = datos;
      const n = anclas.length;
      if (!n) return null;
      const activo = datos.objetivo === 0;
      const durSubir = 0.42;
      const durBajar = susto ? 0.18 : 0.34;
      const tf = t - inicio;

      if (fase === 'oculta') {
        if (activo && t >= siguiente) {
          letra = elegirLetra(anclas, letra, puntero, h);
          const azar = Math.random();
          variante = azar < 0.35 ? 'ojos' : azar < 0.82 ? 'medio' : 'salto';
          arriba = 2.3 + Math.random() * 1.2 + (variante === 'salto' ? 1.1 : 0);
          susto = false;
          fase = 'subir';
          inicio = t;
        }
      } else if (fase === 'subir' && (tf >= durSubir || !activo)) {
        fase = activo ? 'arriba' : 'bajar';
        inicio = t;
      } else if (fase === 'arriba' && (tf >= arriba || !activo)) {
        fase = 'bajar';
        inicio = t;
      } else if (fase === 'bajar' && tf >= durBajar) {
        fase = 'oculta';
        siguiente = t + (susto ? 0.8 : 0.5 + Math.random() * 0.9);
      }
      // Si el mouse se le acerca, se esconde de golpe
      if ((fase === 'subir' || fase === 'arriba') && puntero && letra >= 0) {
        const a = anclas[letra];
        if (Math.hypot(puntero.x - a.x, puntero.y - (a.y - h * 0.4)) < h * 1.25) {
          susto = true;
          fase = 'bajar';
          inicio = t;
        }
      }
      if (fase === 'oculta' || letra < 0 || letra >= n) return null;

      const a = anclas[letra];
      const alto = ASOMA[variante];
      const c = cuerpoEn(a.x, 0, t);
      const u = t - inicio;
      let d: number;
      if (fase === 'subir') {
        const k = u / durSubir;
        d = ESCONDIDA + (alto - ESCONDIDA) * salida(Math.min(k, 1));
        c.sy = 1 + 0.15 * (1 - k);
        c.mirada = [0, 0.3];
      } else if (fase === 'arriba') {
        d = alto;
        c.sy = 1 - 0.12 * rebote(u, 2.8, 6) + Math.sin(t * 2.4) * 0.02;
        // Mira a un lado, al otro y a quien la mira
        const m = u / arriba;
        const lado = m < 0.33 ? -1 : m < 0.66 ? 1 : 0;
        const fuerza = lado ? Math.sin(Math.PI * ((m * 3) % 1)) ** 0.5 : 0;
        c.mirada = [lado * 0.9 * fuerza, 0.05];
        c.giroY = BY + lado * 0.4 * fuerza;
        c.giroZ = -lado * 0.12 * fuerza;
        if (lado === 0) c.cara = 'alegre';
        if (variante === 'salto') {
          // Salta por encima de la letra dando una vuelta y vuelve a su sitio
          const j = tramo(u, arriba * 0.4, arriba * 0.4 + 0.85);
          if (j > 0 && j < 1) {
            d = alto + 4 * 1.25 * j * (1 - j);
            c.giroY = BY + TAU * suavisimo(j);
            c.giroZ = 0;
            c.sy = 1 + 0.15 * Math.sin(Math.PI * j);
            c.cara = 'alegre';
          }
        }
      } else {
        const k = Math.min(u / durBajar, 1);
        d = alto + (ESCONDIDA - alto) * k * k;
        c.sy = 1 + 0.12 * k;
        if (susto) {
          c.cara = 'sorpresa';
          c.rapidezCara = 24;
        }
      }
      // d: centro sobre la línea (unidades) → base en px
      const ppu = lienzo.pxPorUnidad;
      c.base = a.y - d * ppu + 0.95 * c.sy * ppu;
      return aPose(c, lienzo);
    },
  };
}

/** Otra letra distinta de la anterior y lejos del mouse (si se puede). */
function elegirLetra(
  anclas: DatosRecorrido['anclas'],
  previa: number,
  puntero: DatosRecorrido['puntero'],
  h: number,
) {
  const candidatas = anclas
    .map((_, i) => i)
    .filter(
      (i) =>
        i !== previa &&
        (!puntero || Math.hypot(puntero.x - anclas[i].x, puntero.y - anclas[i].y) > h * 2.5),
    );
  const lista = candidatas.length
    ? candidatas
    : anclas.map((_, i) => i).filter((i) => i !== previa);
  return lista[Math.floor(Math.random() * lista.length)] ?? 0;
}
