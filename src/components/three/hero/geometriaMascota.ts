import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { heroConfig } from './hero.config';

/**
 * Geometría procedural de la mascota. El cuerpo se construye a partir de su
 * contorno visto de frente (`cuerpo.silueta`, medido de la imagen de
 * referencia): cada punto del contorno se une con la cara y con la espalda
 * por una sección redondeada, así la silueta coincide exactamente con el
 * dibujo y el volumen queda blandito. Encima va el hueco del visor; el visor es un casquete que sigue la superficie.
 * Se genera una vez en CPU; el movimiento lo ponen la escena y los shaders.
 */

const { cuerpo: C, visor: V } = heroConfig;

const suave = THREE.MathUtils.smoothstep;

/**
 * Versiones cada vez más suavizadas del contorno (desenfoque gaussiano
 * circular). Las capas interiores del volumen usan las más suaves: así la
 * punta y los lóbulos son redondeados por dentro y no forman una arista,
 * mientras que el borde exterior conserva la silueta exacta.
 */
const contornos = [0, 1, 2, 3.5, 5.5, 8].map((sigma) => {
  const n = C.silueta.length;
  if (sigma === 0) return [...C.silueta];
  const alcance = Math.ceil(sigma * 3);
  return C.silueta.map((_, i) => {
    let suma = 0;
    let peso = 0;
    for (let d = -alcance; d <= alcance; d++) {
      const w = Math.exp(-((d / sigma) ** 2) / 2);
      suma += C.silueta[(i + d + n) % n] * w;
      peso += w;
    }
    return suma / peso;
  });
});

/** Radio de un contorno en el ángulo `theta` (Catmull-Rom periódico). */
function radioEn(valores: readonly number[], theta: number) {
  const n = valores.length;
  const t = ((((theta / (Math.PI * 2)) % 1) + 1) % 1) * n;
  const i = Math.floor(t);
  const f = t - i;
  const p = (k: number) => valores[(i + k + n) % n];
  const [p0, p1, p2, p3] = [p(-1), p(0), p(1), p(2)];
  return (
    p1 + 0.5 * f * (p2 - p0 + f * (2 * p0 - 5 * p1 + 4 * p2 - p3 + f * (3 * (p1 - p2) + p3 - p0)))
  );
}

/** Radio de la capa `c` (1 = borde exacto, 0 = centro de la cara) en `theta`. */
function radioContorno(theta: number, c: number) {
  const nivel = Math.min((1 - c) * 1.6, 1) * (contornos.length - 1);
  const i = Math.min(Math.floor(nivel), contornos.length - 2);
  const f = nivel - i;
  return radioEn(contornos[i], theta) * (1 - f) + radioEn(contornos[i + 1], theta) * f;
}

const { frente, espalda, relleno } = C.profundidad;
/** Media profundidad según la "latitud" (sin φ: 1 en la cara, -1 en la espalda). */
const profundidad = (s: number) => espalda + (frente - espalda) * (0.5 + 0.5 * s);

/** La parte alta se inclina hacia atrás. */
const desplazamientoPunta = (y: number) => -C.curvaPunta * suave(y, 0.3, 1.05) ** 2;

/** Altura de la cara (z, sin el hueco del visor) en un punto (x, y) visto de frente. */
function superficieFrontal(x: number, y: number) {
  // Busca la capa c cuyo contorno pasa por (x, y)
  const r = Math.hypot(x, y);
  const theta = Math.atan2(y, x);
  let [bajo, alto] = [0, 1];
  for (let k = 0; k < 24; k++) {
    const medio = (bajo + alto) / 2;
    if (medio * radioContorno(theta, medio) < r) bajo = medio;
    else alto = medio;
  }
  const c = (bajo + alto) / 2;
  const s = Math.sqrt(1 - Math.pow(c, 2 / relleno));
  return profundidad(s) * s;
}

/** 0 fuera del visor, 1 dentro (con borde suave). */
function huecoVisor(x: number, y: number) {
  const e = Math.hypot((x - V.centroX) / V.semiancho, (y - V.centroY) / V.semialto);
  return suave(1 - e, -0.03, 0.13);
}

export function crearGeometriaCuerpo(anillos: number, segmentos: number) {
  const pos: number[] = [];
  const hueco: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= anillos; i++) {
    // φ de -π/2 (espalda) a π/2 (cara)
    const fi = -Math.PI / 2 + (i / anillos) * Math.PI;
    const s = i === anillos ? 1 : i === 0 ? -1 : Math.sin(fi);
    const c = i === 0 || i === anillos ? 0 : Math.pow(Math.cos(fi), relleno);
    for (let j = 0; j <= segmentos; j++) {
      const theta = (j / segmentos) * Math.PI * 2;
      const r = radioContorno(theta, c) * c;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      let z = profundidad(s) * s;

      // Hueco del visor: solo en la cara
      const h = huecoVisor(x, y) * suave(s, 0.0, 0.3);
      z -= V.hueco * h;

      pos.push(x, y, z + desplazamientoPunta(y));
      hueco.push(h);
    }
  }

  const fila = segmentos + 1;
  for (let i = 0; i < anillos; i++) {
    for (let j = 0; j < segmentos; j++) {
      const a = i * fila + j;
      const b = a + fila;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  return terminar(pos, indices, { aHueco: [hueco, 1] });
}

export function crearGeometriaVisor(anillos: number, segmentos: number) {
  const pos: number[] = [];
  const cara: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= anillos; i++) {
    const rho = i / anillos;
    for (let j = 0; j <= segmentos; j++) {
      const theta = (j / segmentos) * Math.PI * 2;
      const u = rho * Math.cos(theta) * V.semiancho;
      const v = rho * Math.sin(theta) * V.semialto;
      const x = V.centroX + u;
      const y = V.centroY + v;
      const z = superficieFrontal(x, y) - V.retiro + V.domo * (1 - rho * rho);
      pos.push(x, y, z + desplazamientoPunta(y));
      // Coordenadas de la cara (centradas en el visor) para dibujar los ojos
      cara.push(u / V.escalaOjos, v / V.escalaOjos);
    }
  }

  const fila = segmentos + 1;
  for (let i = 0; i < anillos; i++) {
    for (let j = 0; j < segmentos; j++) {
      const a = i * fila + j;
      const b = a + fila;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  return terminar(pos, indices, { aCara: [cara, 2] });
}

/** Une vértices repetidos (costura y polos) y calcula normales suaves. */
function terminar(pos: number[], indices: number[], extra: Record<string, [number[], number]>) {
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  for (const [nombre, [datos, tam]] of Object.entries(extra)) {
    g.setAttribute(nombre, new THREE.Float32BufferAttribute(datos, tam));
  }
  g.setIndex(indices);
  g = mergeVertices(g, 1e-5);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
