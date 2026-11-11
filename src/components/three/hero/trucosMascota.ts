import { heroConfig } from './hero.config';
import type { Truco } from './senalHero';

/**
 * Coreografía de los trucos de la mascota (menú del hero). Cada truco es
 * una función pura del tiempo que devuelve la pose del personaje: posición
 * respecto a su casa, giro, escala del cuerpo (squash & stretch, siempre
 * conservando el volumen), cara, mirada, brillo rojo y efectos (Zzz,
 * estrellas, notas, marca de enojo). La escena la mezcla con el movimiento
 * normal al entrar y al salir, así que todas empiezan y acaban en reposo.
 *
 * Unidades: las del personaje (mide ~2 de alto; el centro está en su casa,
 * la base del cuerpo en y ≈ -0.95 y el suelo en y ≈ -1). La cámara está en
 * z = 8.6 mirando al personaje; a ~7 unidades a un lado ya no se ve.
 * Principios: anticipación antes de cada salto, estiramiento al subir,
 * aplaste al tocar el suelo (con rebote amortiguado) y seguimiento de la
 * punta (flex) en los cambios de ritmo.
 */

export type Cara = 'neutro' | 'alegre' | 'curioso' | 'enojado' | 'mareado' | 'dormido' | 'sorpresa';

/** Orden de los pesos de cara en los shaders (uExpresion + uExpresion2). */
export const CARAS: Cara[] = [
  'neutro',
  'alegre',
  'curioso',
  'enojado',
  'mareado',
  'dormido',
  'sorpresa',
];

export type TipoEfecto = 'z' | 'estrella' | 'enojo' | 'nota';

export interface Efecto {
  tipo: TipoEfecto;
  /** Posición respecto a la casa del personaje (sigue su paseo, no su giro). */
  x: number;
  y: number;
  z: number;
  escala: number;
  opacidad: number;
  giro: number;
}

export interface PoseTruco {
  pos: [number, number, number];
  /** Giro absoluto del personaje (x, y, z), en el orden YXZ de la escena. */
  rot: [number, number, number];
  /** Escala del cuerpo en sus ejes (x lado, y alto, z hacia la cara). */
  escala: [number, number, number];
  cara: Cara;
  /** Rapidez del cambio de cara (más alto = más brusco). */
  rapidezCara: number;
  mirada: [number, number];
  /** Brillo rojo del cuerpo y los ojos (0..1). */
  rojo: number;
  /** Giro de los ojos en espiral (rad). */
  giroOjos: number;
  /** Doblez extra de la punta (x lado, z adelante). */
  flex: [number, number];
  efectos: Efecto[];
}

export interface DefinicionTruco {
  duracion: number;
  /** Instante del golpe contra la pantalla (la UI rompe el vidrio). */
  golpe?: number;
  pose: (t: number, opciones: { dir: number }) => PoseTruco;
}

const [BX, BY] = heroConfig.movimiento.pose;
const TAU = Math.PI * 2;
/** Distancia del centro a la base del cuerpo: al aplastarse, la base no se despega del suelo. */
const BASE = 0.95;

/* ------------------------------------------------------------------ Curvas */

const limitar = (v: number) => Math.min(Math.max(v, 0), 1);
/** Avance 0..1 de t entre a y b. */
const tramo = (t: number, a: number, b: number) => limitar((t - a) / (b - a));
const suave = (u: number) => u * u * (3 - 2 * u);
const suavisimo = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
const salida = (u: number) => 1 - (1 - u) ** 3;
const mezclar = (a: number, b: number, u: number) => a + (b - a) * u;
/** Parábola de salto: 0 al despegar y al caer, `h` en la cima. */
const arco = (u: number, h: number) => 4 * h * u * (1 - u);
/** Rebote amortiguado (para aplastes y temblores que se calman); 0 antes de empezar. */
const rebote = (t: number, frecuencia: number, amortiguacion: number) =>
  t < 0 ? 0 : Math.exp(-amortiguacion * t) * Math.cos(TAU * frecuencia * t);
/** Campana 0→1→0 entre a y b. */
const campana = (t: number, a: number, b: number) => Math.sin(Math.PI * tramo(t, a, b));

/** Escala que conserva el volumen para un alto `sy`. */
function volumen(sy: number): [number, number, number] {
  const lado = 1 / Math.sqrt(sy);
  return [lado, sy, lado];
}

function reposo(): PoseTruco {
  return {
    pos: [0, 0, 0],
    rot: [BX, BY, 0],
    escala: [1, 1, 1],
    cara: 'neutro',
    rapidezCara: 8,
    mirada: [0, 0],
    rojo: 0,
    giroOjos: 0,
    flex: [0, 0],
    efectos: [],
  };
}

/** Efecto que nace en `inicio`, vive `vida` segundos y avanza con `trayecto(τ)`. */
function emitir(
  t: number,
  inicio: number,
  vida: number,
  tipo: TipoEfecto,
  trayecto: (u: number) => Omit<Efecto, 'tipo' | 'opacidad'> & { opacidad?: number },
): Efecto | null {
  const u = (t - inicio) / vida;
  if (u < 0 || u > 1) return null;
  const e = trayecto(u);
  return { tipo, opacidad: e.opacidad ?? Math.sin(Math.PI * u) ** 0.7, ...e };
}

/* ------------------------------------------------------------------ Trucos */

/**
 * Voltereta: se agacha, salta estirándose, da un mortal hacia atrás en el
 * aire (sorprendida al subir, feliz al bajar) y aterriza con un aplaste que
 * rebota.
 */
const voltereta: DefinicionTruco = {
  duracion: 2.6,
  pose(t) {
    const p = reposo();
    const DESPEGUE = 0.42;
    const ATERRIZAJE = 1.62;
    let sy = 1;
    let y = 0;
    if (t < DESPEGUE) {
      // Anticipación: se hunde y se inclina hacia delante
      const a = salida(tramo(t, 0, DESPEGUE));
      sy = 1 - 0.26 * a;
      p.rot[0] = BX + 0.16 * a;
      y = -(1 - sy) * BASE;
    } else if (t < ATERRIZAJE) {
      const u = tramo(t, DESPEGUE, ATERRIZAJE);
      // Sale estirada, se redondea en la cima y se estira un poco antes de caer
      sy = 1 + 0.24 * Math.exp(-u * 7) + 0.08 * suave(tramo(u, 0.7, 1));
      if (u < 0.08) sy = mezclar(0.74, sy, suave(u / 0.08));
      y = -0.247 * (1 - suave(tramo(u, 0, 0.15))) + arco(u, 1.65);
      // Mortal hacia atrás: la punta se va hacia la espalda
      const giro = suavisimo(tramo(u, 0.06, 0.88));
      p.rot[0] = BX + 0.16 * (1 - suave(tramo(u, 0, 0.12))) - TAU * giro;
      p.flex = [0, 0.22 * Math.sin(Math.PI * u)];
      p.cara = u < 0.45 ? 'sorpresa' : 'alegre';
      p.rapidezCara = 14;
      p.mirada = [0, 0.4 * (1 - u)];
    } else {
      // Aterriza: aplaste que rebota y se calma
      const d = t - ATERRIZAJE;
      sy = 1 - 0.3 * rebote(d, 2.6, 6.5);
      y = -(1 - Math.min(sy, 1)) * BASE;
      p.rot[0] = BX - TAU + 0.12 * rebote(d, 1.8, 5);
      p.cara = 'alegre';
    }
    p.pos[1] = y;
    p.escala = volumen(sy);
    return p;
  },
};

/**
 * Bailar: pasos de lado al compás (130 bpm) con rebote en cada tiempo,
 * inclinándose hacia donde va, cabeceo y la punta que sigue el ritmo; a
 * mitad da un giro completo y termina con una pose. Suelta notas.
 */
const bailar: DefinicionTruco = {
  duracion: 5.2,
  pose(t) {
    const p = reposo();
    const PULSO = 60 / 130;
    const b = t / PULSO;
    const final = suave(tramo(t, 4.0, 4.3)) * (1 - suave(tramo(t, 4.7, 5.2)));
    const env = suave(tramo(t, 0, 0.45)) * (1 - suave(tramo(t, 3.9, 4.3)));
    const rb = Math.abs(Math.sin(Math.PI * b));
    const paso = Math.sin((Math.PI * b) / 2);
    const velPaso = Math.cos((Math.PI * b) / 2);
    let sy = 1 + (0.07 * rb - 0.11 * (1 - rb) ** 5) * env;
    sy *= 1 + 0.07 * final;
    p.pos[0] = 0.36 * paso * env;
    p.pos[1] = 0.15 * rb * env - (1 - Math.min(sy, 1)) * BASE + 0.1 * final;
    // Giro completo a mitad del baile
    const giro = TAU * suavisimo(tramo(t, 2.3, 3.25));
    p.rot = [
      BX + 0.09 * rb * env,
      BY + 0.42 * paso * env + giro,
      -0.2 * velPaso * env + 0.24 * final,
    ];
    p.escala = volumen(sy);
    p.flex = [0.17 * Math.sin(Math.PI * b + 0.8) * env, 0.06 * Math.cos(Math.PI * b) * env];
    p.cara = t < 4.9 ? 'alegre' : 'neutro';
    p.mirada = [0.35 * paso * env, 0.15];
    for (let k = 0; k < 4; k++) {
      const lado = k % 2 ? 1 : -1;
      const e = emitir(t, 0.35 + k * 1.05, 1.7, 'nota', (u) => ({
        x: lado * (0.8 + 0.15 * u) + 0.12 * Math.sin(u * 7),
        y: 0.7 + 1.0 * u,
        z: 0.2,
        escala: 0.3 * (0.7 + 0.3 * salida(tramo(u, 0, 0.2))),
        giro: lado * 0.25 * Math.sin(u * 5),
      }));
      if (e) p.efectos.push(e);
    }
    return p;
  },
};

/**
 * Dormir: bosteza estirándose, se acomoda (se hunde y ladea la cabeza),
 * respira despacio con los ojos cerrados mientras salen las Z, y despierta
 * de un sobresalto.
 */
const dormir: DefinicionTruco = {
  duracion: 6.0,
  pose(t) {
    const p = reposo();
    const DUERME = 1.8;
    const DESPIERTA = 5.0;
    let sy = 1;
    // Bostezo: se estira hacia arriba echando la cabeza atrás
    const bostezo = campana(t, 0, 1.1);
    sy += 0.13 * bostezo;
    p.rot[0] = BX - 0.14 * bostezo;
    // Acomodarse: se hunde, inclina la cabeza y se queda
    const acomodo =
      suave(tramo(t, 1.0, DUERME)) * (1 - suave(tramo(t, DESPIERTA, DESPIERTA + 0.25)));
    const respira = Math.sin((TAU * Math.max(t - DUERME, 0)) / 2.4) * suave(tramo(t, DUERME, 2.4));
    sy = mezclar(sy, 0.92 + 0.03 * respira, acomodo);
    p.rot[0] += acomodo * (0.18 + 0.03 * respira);
    p.rot[2] = acomodo * (0.17 + 0.04 * Math.sin((TAU * t) / 4.8));
    // Sobresalto: salta estirada con los ojos muy abiertos y cae con aplaste
    const s = tramo(t, DESPIERTA, DESPIERTA + 0.38);
    if (t >= DESPIERTA) {
      sy *= 1 + 0.14 * Math.sin(Math.PI * s);
      sy *= 1 - 0.14 * rebote(t - DESPIERTA - 0.38, 2.4, 7);
    }
    // La base se queda en el suelo al aplastarse
    p.pos[1] = -(1 - Math.min(sy, 1)) * BASE - 0.05 * acomodo + arco(s, 0.36);
    p.escala = [
      (1 / Math.sqrt(sy)) * (1 + 0.012 * respira * acomodo),
      sy,
      (1 / Math.sqrt(sy)) * (1 + 0.012 * respira * acomodo),
    ];
    p.cara =
      t < 0.15
        ? 'neutro'
        : t < 0.75
          ? 'sorpresa'
          : t < DESPIERTA
            ? 'dormido'
            : t < DESPIERTA + 0.55
              ? 'sorpresa'
              : 'neutro';
    p.rapidezCara = t >= DESPIERTA ? 20 : 5;
    p.mirada = [0, t < DESPIERTA ? -0.3 * acomodo : 0];
    for (let k = 0; k < 4; k++) {
      const e = emitir(t, 2.0 + k * 0.75, 1.6, 'z', (u) => ({
        x: 0.6 + 0.6 * u + 0.08 * Math.sin(u * 8),
        y: 0.85 + 0.7 * u,
        z: 0.1,
        escala: 0.26 + 0.3 * u,
        giro: 0.3 * Math.sin(u * 4) - 0.15,
        opacidad: Math.sin(Math.PI * u) ** 0.6 * (1 - tramo(t, DESPIERTA, DESPIERTA + 0.15)),
      }));
      if (e) p.efectos.push(e);
    }
    return p;
  },
};

/**
 * Ponerse bravo: se pone roja, se infla y tiembla de rabia, da dos
 * pisotones, se voltea ofendida ("¡hmph!") y al final suelta el aire y se
 * calma. Le sale la marca de enojo sobre la cabeza.
 */
const enojarse: DefinicionTruco = {
  duracion: 3.8,
  pose(t, { dir }) {
    const p = reposo();
    const arranque = salida(tramo(t, 0, 0.22));
    const inflada = suave(tramo(t, 0.22, 0.5)) * (1 - suave(tramo(t, 2.7, 3.3)));
    let sy = 1 - 0.1 * arranque * (1 - inflada);
    // Dos pisotones
    let y = 0;
    for (const inicio of [0.55, 1.12]) {
      const u = tramo(t, inicio, inicio + 0.36);
      y += arco(u, 0.2);
      sy *= 1 - 0.2 * rebote(t - inicio - 0.36, 2.8, 8);
    }
    // Temblor de rabia (más fuerte en oleadas)
    const temblor = inflada * (0.65 + 0.35 * Math.sin(t * 9));
    p.pos[0] = 0.032 * temblor * Math.sin(t * 61);
    // "¡Hmph!": se voltea con la barbilla arriba y vuelve
    const hmph = suave(tramo(t, 1.85, 2.15)) * (1 - suave(tramo(t, 2.55, 2.9)));
    p.rot = [
      BX - 0.14 * hmph + 0.03 * temblor * Math.sin(t * 43),
      BY + 0.95 * hmph * dir,
      0.05 * temblor * Math.sin(t * 47 + 1),
    ];
    // Suelta el aire al calmarse
    sy *= 1 - 0.07 * campana(t, 2.9, 3.6);
    p.pos[1] = y - (1 - Math.min(sy, 1)) * BASE;
    const infla = 1 + 0.08 * inflada;
    const [sx, , sz] = volumen(sy);
    p.escala = [sx * infla, sy * infla, sz * infla];
    p.rojo =
      Math.min(arranque, 1) * (1 - suave(tramo(t, 2.8, 3.6))) * (0.65 + 0.35 * Math.sin(t * 7));
    p.cara = t < 3.0 ? 'enojado' : 'neutro';
    p.rapidezCara = t < 1 ? 16 : 6;
    p.mirada = [-0.5 * hmph * dir, -0.15 + 0.45 * hmph];
    const marca = emitir(t, 0.3, 2.6, 'enojo', (u) => ({
      x: 0.62,
      y: 0.98,
      z: 0.25,
      escala: 0.34 * (1 - rebote(u * 2.6, 1.6, 6)) * (1 + 0.12 * Math.sin(t * 15)),
      giro: 0.1 * Math.sin(t * 15),
      opacidad: 1 - tramo(u, 0.85, 1),
    }));
    if (marca) p.efectos.push(marca);
    return p;
  },
};

/**
 * Salir corriendo: se gira de perfil, se encoge para tomar impulso y sale
 * disparada a saltitos, inclinada y estirada por la velocidad. Desaparece
 * por un lado, "da la vuelta al mundo" y entra por el otro frenando hasta
 * pasarse un poco; derrapa echándose atrás, se gira hacia ti contenta y
 * jadea.
 */
const correr: DefinicionTruco = {
  duracion: 6.2,
  pose(t, { dir }) {
    const p = reposo();
    // De perfil, pero girada solo lo justo para que se le vea la cara al correr
    const perfil = BY + dir * Math.PI * 0.3;
    const FUERA = 8.4;
    const SALE = 0.5;
    const AFUERA = 1.4;
    const ENTRA = 2.45;
    const LLEGA = 3.6;
    const FRENA = 4.1;
    let x = 0;
    let rapidez = 0; // 0..1, para la inclinación, el estiramiento y la zancada
    if (t < AFUERA) {
      const u = tramo(t, SALE, AFUERA);
      x = dir * FUERA * u * u;
      rapidez = suave(tramo(t, SALE, SALE + 0.3));
    } else if (t < ENTRA) {
      x = dir * FUERA;
      rapidez = 1;
    } else if (t < LLEGA) {
      const u = tramo(t, ENTRA, LLEGA);
      x = -dir * FUERA + dir * (FUERA + 0.45) * salida(u);
      rapidez = 1 - suave(tramo(u, 0.55, 1));
    } else {
      // Derrape: se pasa un poco y vuelve a su sitio
      x = dir * 0.45 * (1 - suavisimo(tramo(t, LLEGA, FRENA)));
    }
    p.pos[0] = x;
    // Zancadas: saltitos rápidos con aplaste en cada apoyo
    const zancada = Math.abs(Math.sin(Math.PI * 7.4 * (t - SALE)));
    let sy = 1;
    let y = 0;
    if (t > SALE && t < LLEGA) {
      y += 0.14 * zancada * rapidez;
      sy *= 1 - 0.08 * (1 - zancada) ** 4 * rapidez;
    }
    // Anticipación: se encoge echándose atrás
    const encoge = campana(t, 0.12, SALE + 0.08);
    sy *= 1 - 0.17 * encoge;
    const derrape = campana(t, LLEGA - 0.05, FRENA + 0.1);
    sy *= 1 - 0.1 * derrape;
    // Jadeo al final
    sy *= 1 + 0.035 * Math.sin(t * 21) * campana(t, 4.5, 5.8);
    // Saltito contento al mirarte
    y += arco(tramo(t, 4.35, 4.75), 0.2);
    sy *= 1 - 0.12 * rebote(t - 4.75, 2.6, 7);
    p.pos[1] = y - (1 - Math.min(sy, 1)) * BASE;
    // Estirada hacia donde corre (el eje z del cuerpo es su frente)
    const estira = 0.17 * rapidez;
    p.escala = [1 / (sy * (1 + estira)), sy, 1 + estira];
    // Gira de perfil al empezar y vuelve a mirarte tras el derrape
    const deFrente = suave(tramo(t, FRENA - 0.15, FRENA + 0.4));
    p.rot = [
      BX - 0.22 * encoge + 0.4 * rapidez - 0.3 * derrape,
      mezclar(mezclar(BY, perfil, suave(tramo(t, 0, SALE))), BY, deFrente),
      0.04 * Math.sin(Math.PI * 7.4 * (t - SALE)) * rapidez,
    ];
    p.flex = [0, -0.12 * rapidez + 0.16 * derrape];
    p.cara = t < ENTRA ? 'neutro' : 'alegre';
    p.mirada = [0, 0];
    return p;
  },
};

/**
 * Chocar con la pantalla: te mira con curiosidad, se lanza hacia ti cada vez
 * más rápido y se da cuenta tarde: se estampa contra el vidrio (se aplasta
 * en el cristal con un temblor), resbala, se despega y cae de espaldas al
 * suelo. Se queda mareada con estrellas girando, sacude la cabeza, se
 * levanta y vuelve a su sitio a saltitos.
 */
const chocar: DefinicionTruco = {
  duracion: 8.0,
  golpe: 1.7,
  pose(t) {
    const p = reposo();
    const GOLPE = 1.7;
    const VIDRIO = 6.35; // z del cristal (la cámara está en 8.6)
    const ALTO = 0.82;
    const PROF = 0.84; // media profundidad del cuerpo hacia la cara
    const CAE = 3.45;
    const SUELO = 4.35;
    const LEVANTA = 6.0;
    const SALTOS = 6.95;
    const LADEO = 0.1;
    const ECHADA = -0.15; // altura del centro con el cuerpo echado de espaldas en el suelo
    const x = 0;
    let y = 0;
    let z = 0;
    let s: [number, number, number] = [1, 1, 1];

    if (t < GOLPE) {
      // Curiosa: ladea la cabeza y se acerca; luego acelera hacia ti
      const mira = suave(tramo(t, 0, 0.45));
      const u = tramo(t, 0.7, GOLPE);
      const sz = 1 + 0.24 * u * u;
      z = Math.min(
        0.45 * suave(tramo(t, 0.2, 0.7)) + (VIDRIO - 1.3) * u ** 2.3,
        VIDRIO - PROF * sz,
      );
      y = ALTO * suave(u);
      s = [1 / Math.sqrt(sz), 1 / Math.sqrt(sz), sz];
      p.rot = [(BX + 0.1 * mira) * (1 - u), BY * (1 - u), 0.17 * mira * (1 - suave(u))];
      p.cara = t < 0.7 ? 'curioso' : t < 1.38 ? 'alegre' : 'sorpresa';
      p.rapidezCara = t > 1.3 ? 22 : 8;
    } else if (t < CAE) {
      // Pegada al vidrio: aplastada con un temblor; luego resbala
      const d = t - GOLPE;
      const r = tramo(t, 2.5, CAE);
      // El aplaste se completa en 60 ms (el frente ya está en el vidrio)
      const sz = mezclar(
        mezclar(1.24, 0.52 - 0.14 * rebote(d, 3, 6), suave(tramo(d, 0, 0.06))),
        0.68,
        suave(r),
      );
      s = [1 / Math.sqrt(sz), 1 / Math.sqrt(sz), sz];
      z = VIDRIO - PROF * sz;
      y = ALTO - 1.45 * r ** 1.8;
      p.rot = [0, 0, LADEO * Math.sin(r * 5) * r];
      p.cara = d < 0.35 ? 'sorpresa' : 'mareado';
      p.rapidezCara = 18;
      p.giroOjos = d * 5;
    } else if (t < SUELO) {
      // Se despega y cae de espaldas
      const f = tramo(t, CAE, SUELO);
      const sz = mezclar(0.68, 1, suave(tramo(f, 0, 0.5)));
      s = [1 / Math.sqrt(sz), 1 / Math.sqrt(sz), sz];
      z = mezclar(VIDRIO - PROF * 0.68, 3.0, salida(f));
      y = mezclar(ALTO - 1.45, ECHADA, f) + arco(f, 0.55);
      p.rot = [-1.0 * suave(f), 0, LADEO * Math.sin(5) * (1 - f)];
      p.cara = 'mareado';
      p.giroOjos = (t - GOLPE) * 5;
    } else if (t < LEVANTA) {
      // En el suelo, de espaldas y mareada: rebota y se tambalea
      const d = t - SUELO;
      z = 3.0;
      const sy = 1 - 0.18 * rebote(d, 2.2, 6);
      s = volumen(sy);
      y =
        ECHADA + 0.22 * Math.exp(-4 * d) * Math.abs(Math.sin(9 * d)) - (1 - Math.min(sy, 1)) * 0.6;
      p.rot = [-1.0 + 0.07 * Math.sin(t * 3), 0.16 * Math.sin(t * 2.1), 0.12 * Math.sin(t * 2.6)];
      p.cara = 'mareado';
      p.giroOjos = (t - GOLPE) * 6;
      // Estrellas dando vueltas sobre la cabeza (que está echada atrás)
      for (let k = 0; k < 3; k++) {
        const a = t * 3.3 + (k * TAU) / 3;
        p.efectos.push({
          tipo: 'estrella',
          x: Math.cos(a) * 0.62,
          y: 0.62 + Math.sin(a) * 0.12,
          z: -0.55 + Math.sin(a) * 0.5,
          escala: 0.22 + 0.04 * Math.sin(t * 9 + k),
          giro: t * 2 + k,
          opacidad: tramo(t, SUELO + 0.1, SUELO + 0.4) * (1 - tramo(t, LEVANTA - 0.3, LEVANTA)),
        });
      }
    } else if (t < SALTOS) {
      // Se levanta y sacude la cabeza
      const g = suave(tramo(t, LEVANTA, LEVANTA + 0.5));
      const sacude = tramo(t, LEVANTA + 0.45, SALTOS);
      z = 3.0;
      y = mezclar(ECHADA, 0, g) + arco(tramo(t, LEVANTA, LEVANTA + 0.5), 0.18);
      p.rot = [
        mezclar(-1.0, BX, g),
        BY * g + 0.32 * Math.sin(TAU * 5.5 * sacude) * (1 - sacude) * Math.min(sacude * 6, 1),
        0,
      ];
      p.cara = t < LEVANTA + 0.45 ? 'mareado' : 'neutro';
      p.giroOjos = (t - GOLPE) * 6;
    } else {
      // Vuelve a su sitio en dos saltitos
      const h = tramo(t, SALTOS, SALTOS + 0.95);
      const n = Math.min(Math.floor(h * 2), 1);
      const u = h * 2 - n;
      const desde = 3.0 * (1 - n / 2);
      const hasta = 3.0 * (1 - (n + 1) / 2);
      z = mezclar(desde, hasta, suave(u));
      const sy =
        h < 1 ? 1 + 0.08 * Math.sin(Math.PI * u) : 1 - 0.14 * rebote(t - SALTOS - 0.95, 2.6, 7);
      s = volumen(sy);
      y = h < 1 ? arco(u, 0.32) : -(1 - Math.min(sy, 1)) * BASE;
      p.cara = 'neutro';
    }
    p.pos = [x, y, z];
    p.escala = s;
    return p;
  },
};

export const trucos: Record<Truco, DefinicionTruco> = {
  voltereta,
  bailar,
  dormir,
  enojarse,
  correr,
  chocar,
};

/** Mezcla de entrada y salida del truco (todos empiezan y acaban en reposo). */
export function pesoTruco(t: number, duracion: number) {
  return suave(tramo(t, 0, 0.16)) * (1 - suave(tramo(t, duracion - 0.22, duracion)));
}
