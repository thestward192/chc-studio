import * as THREE from 'three';
import { sala, ui, marca } from '../../../theme/theme';
import type { Proyecto } from '../../../content/proyectos';
import type { PasoProceso } from '../../../content/proceso';
import { rastrear } from './recursos';

/**
 * Texturas procedurales dibujadas en <canvas> (sin imágenes externas).
 * Todas se registran en recursos.ts para liberarlas al salir.
 */

/** Generador pseudoaleatorio con semilla (texturas estables entre recargas). */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lienzo(ancho: number, alto: number) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return { c, ctx: c.getContext('2d')! };
}

function aTextura(
  c: HTMLCanvasElement,
  opciones: { repetir?: [number, number]; srgb?: boolean } = {},
) {
  const textura = rastrear(new THREE.CanvasTexture(c));
  if (opciones.srgb !== false) textura.colorSpace = THREE.SRGBColorSpace;
  if (opciones.repetir) {
    textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
    textura.repeat.set(...opciones.repetir);
  }
  textura.anisotropy = 4;
  return textura;
}

function mezclar(a: string, b: string, t: number) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

/** Madera: tablas (suelo) o una sola pieza (mesas), con vetas. */
export function texturaMadera(opciones: {
  tablas: boolean;
  repetir?: [number, number];
  semilla?: number;
}) {
  const { c, ctx } = lienzo(1024, 1024);
  const r = azar(opciones.semilla ?? 7);
  const filas = opciones.tablas ? 8 : 1;
  const alto = 1024 / filas;
  for (let f = 0; f < filas; f++) {
    const desfase = opciones.tablas ? r() * 1024 : 0;
    const tono = mezclar(sala.maderaClara, sala.maderaOscura, 0.15 + r() * 0.35);
    ctx.fillStyle = tono;
    ctx.fillRect(0, f * alto, 1024, alto);
    // Vetas: curvas finas a lo largo de la tabla
    for (let v = 0; v < 38; v++) {
      const y = f * alto + r() * alto;
      ctx.strokeStyle = mezclar(tono, sala.maderaOscura, 0.3 + r() * 0.5);
      ctx.globalAlpha = 0.18 + r() * 0.25;
      ctx.lineWidth = 0.6 + r() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 1024; x += 64) {
        ctx.lineTo(x, y + Math.sin(x * 0.01 + v + r()) * (2 + r() * 3));
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (opciones.tablas) {
      // Juntas entre tablas (a lo largo y a lo ancho)
      ctx.fillStyle = sala.maderaOscura;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, f * alto, 1024, 2);
      ctx.fillRect(desfase, f * alto, 2, alto);
      ctx.globalAlpha = 1;
    }
  }
  return aTextura(c, { repetir: opciones.repetir });
}

/** Tela tejida: trama fina con ligera variación. */
export function texturaTela(base: string, repetir: [number, number] = [1, 1], semilla = 3) {
  const { c, ctx } = lienzo(256, 256);
  const r = azar(semilla);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    for (let x = 0; x < 256; x += 2) {
      const luz = (x + y) % 4 === 0 ? 0.08 : -0.06;
      ctx.fillStyle = luz > 0 ? '#ffffff' : '#000000';
      ctx.globalAlpha = Math.abs(luz) * (0.6 + r() * 0.8);
      ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.globalAlpha = 1;
  return aTextura(c, { repetir });
}

/** Alfombra con borde y motivo geométrico. */
export function texturaAlfombra() {
  const { c, ctx } = lienzo(1024, 600);
  ctx.fillStyle = sala.telaAlfombra;
  ctx.fillRect(0, 0, 1024, 600);
  ctx.strokeStyle = sala.telaAlfombra2;
  ctx.lineWidth = 14;
  ctx.strokeRect(34, 34, 1024 - 68, 600 - 68);
  ctx.lineWidth = 4;
  ctx.strokeRect(62, 62, 1024 - 124, 600 - 124);
  ctx.fillStyle = sala.telaAlfombra2;
  for (let i = 0; i < 9; i++) {
    const x = 140 + i * 93;
    ctx.save();
    ctx.translate(x, 300);
    ctx.rotate(Math.PI / 4);
    ctx.globalAlpha = i % 2 ? 0.5 : 0.85;
    ctx.fillRect(-26, -26, 52, 52);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  // Pelo de la alfombra
  const r = azar(11);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
    ctx.globalAlpha = 0.05;
    ctx.fillRect(r() * 1024, r() * 600, 2, 2);
  }
  ctx.globalAlpha = 1;
  return aTextura(c);
}

/** Pizarra: diagrama "Cómo trabajamos" a mano (fuente Caveat). */
export function texturaPizarra(pasos: PasoProceso[]) {
  const { c, ctx } = lienzo(1280, 800);
  ctx.fillStyle = sala.pizarra;
  ctx.fillRect(0, 0, 1280, 800);
  // Restos de borrado
  const r = azar(21);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = sala.tinta;
    ctx.globalAlpha = 0.03;
    ctx.beginPath();
    ctx.ellipse(r() * 1280, r() * 800, 80 + r() * 160, 20 + r() * 40, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = sala.tinta;
  ctx.font = `700 84px ${ui.fuenteManuscrita}`;
  ctx.fillText('Cómo trabajamos', 70, 120);
  ctx.strokeStyle = sala.tinta2;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(70, 140);
  ctx.quadraticCurveTo(360, 158, 640, 138);
  ctx.stroke();

  // Pasos en zigzag unidos con flechas
  const n = pasos.length;
  pasos.forEach((paso, i) => {
    const x = 90 + i * ((1280 - 260) / Math.max(1, n - 1));
    const y = i % 2 ? 470 : 330;
    ctx.strokeStyle = sala.tinta;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x - 10 + r() * 6, y - 60, 200, 110, 26);
    ctx.stroke();
    ctx.fillStyle = sala.tinta;
    ctx.font = `700 54px ${ui.fuenteManuscrita}`;
    ctx.fillText(`${i + 1}. ${paso.titulo}`, x + 4, y + 12);
    if (i < n - 1) {
      const x2 = 90 + (i + 1) * ((1280 - 260) / Math.max(1, n - 1));
      const y2 = (i + 1) % 2 ? 470 : 330;
      ctx.strokeStyle = sala.tinta2;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 195, y - 5);
      ctx.quadraticCurveTo((x + x2) / 2 + 90, (y + y2) / 2 - 40, x2 - 14, y2 - 10);
      ctx.stroke();
      // Punta de flecha
      ctx.beginPath();
      ctx.moveTo(x2 - 14, y2 - 10);
      ctx.lineTo(x2 - 38, y2 - 22);
      ctx.moveTo(x2 - 14, y2 - 10);
      ctx.lineTo(x2 - 30, y2 + 10);
      ctx.stroke();
    }
  });
  ctx.fillStyle = sala.tinta2;
  ctx.font = `600 46px ${ui.fuenteManuscrita}`;
  ctx.fillText('…y vuelta a empezar ↺', 760, 680);
  ctx.fillStyle = sala.tinta;
  ctx.font = `500 38px ${ui.fuenteManuscrita}`;
  ctx.fillText('* café antes de cada deploy', 90, 700);
  return aTextura(c);
}

/** Lomo de libro en escala de grises (el color de cada libro va por instancia). */
export function texturaLomos() {
  const { c, ctx } = lienzo(64, 128);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 128);
  ctx.fillStyle = '#000000';
  // Bandas del lomo y "título"
  ctx.globalAlpha = 0.28;
  ctx.fillRect(0, 10, 64, 5);
  ctx.fillRect(0, 110, 64, 5);
  ctx.globalAlpha = 0.4;
  ctx.fillRect(24, 34, 16, 52);
  ctx.globalAlpha = 1;
  return aTextura(c);
}

/**
 * Imagen de marcador de un proyecto (color + nombre). `ancho` define la
 * resolución: una versión liviana al inicio y otra alta al acercarse.
 */
export function lienzoProyecto(proyecto: Proyecto, indice: number, ancho: number) {
  const alto = Math.round(ancho / 1.47);
  const { c, ctx } = lienzo(ancho, alto);
  const k = ancho / 1024;
  const acento = proyecto.colorMarcador;

  // Tarjeta azul noche, como el hero de Inicio
  ctx.fillStyle = marca.fondoOscuro;
  ctx.fillRect(0, 0, ancho, alto);

  // Halo del color del proyecto + halo de marca, y anillos concéntricos
  const cx = 760 * k;
  const cy = alto * 0.52;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 420 * k);
  halo.addColorStop(0, mezclar(acento, marca.fondoOscuro, 0.35));
  halo.addColorStop(0.55, mezclar(marca.cian, marca.fondoOscuro, 0.82));
  halo.addColorStop(1, marca.fondoOscuro);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, ancho, alto);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2 * k;
  for (const r of [330, 250, 175]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Arco abierto del color del proyecto (la "C" de marca), girado según el índice
  const giro = azar(indice * 13 + 1)() * Math.PI * 2;
  ctx.strokeStyle = acento;
  ctx.lineWidth = 6 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, 250 * k, giro + 0.45, giro + Math.PI * 2 - 0.45);
  ctx.stroke();

  // Maqueta de interfaz (ventana oscura con cabecera del color del proyecto)
  ctx.fillStyle = marca.superficie;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2 * k;
  ctx.beginPath();
  ctx.roundRect(590 * k, 170 * k, 340 * k, 330 * k, 22 * k);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = acento;
  ctx.beginPath();
  ctx.roundRect(616 * k, 196 * k, 288 * k, 118 * k, 12 * k);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(616 * k, (338 + i * 36) * k, (288 - i * 52) * k, 14 * k, 7 * k);
    ctx.fill();
  }

  // Número en el color del proyecto y título en Sora
  ctx.fillStyle = acento;
  ctx.font = `700 ${Math.round(38 * k)}px ${ui.fuenteCodigo}`;
  ctx.fillText(String(indice + 1).padStart(2, '0'), 70 * k, 120 * k);
  ctx.fillStyle = marca.texto;
  ctx.font = `700 ${Math.round(62 * k)}px ${ui.fuenteUi}`;
  const palabras = proyecto.titulo.replace('Texto de marcador: ', '').split(' ');
  palabras.forEach((p, i) => ctx.fillText(p, 70 * k, (400 + i * 70) * k));
  ctx.font = `500 ${Math.round(26 * k)}px ${ui.fuenteUi}`;
  ctx.fillStyle = marca.textoTenue;
  ctx.fillText(`${proyecto.cliente} · ${proyecto.anio}`, 70 * k, (alto / k - 64) * k);
  // Rayita con el degradado de marca sobre el cliente
  const raya = ctx.createLinearGradient(70 * k, 0, 110 * k, 0);
  raya.addColorStop(0, marca.verde);
  raya.addColorStop(1, marca.cian);
  ctx.fillStyle = raya;
  ctx.beginPath();
  ctx.roundRect(70 * k, (alto / k - 112) * k, 40 * k, 6 * k, 3 * k);
  ctx.fill();
  return c;
}

export function texturaProyecto(proyecto: Proyecto, indice: number, ancho: number) {
  return aTextura(lienzoProyecto(proyecto, indice, ancho));
}

/** Placa con el nombre (sobre las puertas). */
export function texturaPlaca(texto: string, color: string) {
  const { c, ctx } = lienzo(512, 128);
  ctx.fillStyle = sala.marco;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 128, 24);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(28, 50, 28, 28);
  ctx.fillStyle = ui.texto;
  ctx.font = `600 44px ${ui.fuenteUi}`;
  ctx.textBaseline = 'middle';
  let t = texto;
  while (ctx.measureText(t).width > 420 && t.length > 4) t = t.slice(0, -2);
  ctx.fillText(t === texto ? t : t + '…', 76, 66);
  return aTextura(c);
}

/** Máscara del neón: tubo nítido (blanco) + halo difuso (gris). */
export function mascaraNeon(texto: string) {
  const { c, ctx } = lienzo(1024, 256);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 256);
  // Logo de marca en Sora (como el header), ajustado al ancho del letrero
  let tamano = 150;
  ctx.font = `700 ${tamano}px ${ui.fuenteUi}`;
  while (ctx.measureText(texto).width > 900 && tamano > 60) {
    tamano -= 6;
    ctx.font = `700 ${tamano}px ${ui.fuenteUi}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Halo (gris: el shader lo distingue del tubo por intensidad)
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 40;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(texto, 512, 128);
  // Tubo
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(texto, 512, 128);
  return aTextura(c, { srgb: false });
}

/** Líneas de código que el monitor principal "escribe" en vivo. */
const CODIGO = `// estudio.ts - CHC Studio
import { idea } from './cafe';

export async function construir(proyecto) {
  const plan = await idea(proyecto);
  for (const paso of plan.pasos) {
    await paso.disenar();
    await paso.programar({ pruebas: true });
  }
  return desplegar(plan, { sinDrama: true });
}

construir('tu próximo proyecto');`;

const PALABRAS_CLAVE = /\b(import|from|export|async|function|const|await|for|of|return)\b/g;

export class LienzoCodigo {
  readonly textura: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  readonly total = CODIGO.length;

  constructor() {
    const { c, ctx } = lienzo(1024, 640);
    this.ctx = ctx;
    this.textura = aTextura(c);
    this.dibujar(0);
  }

  /** Dibuja los primeros `n` caracteres y un cursor. */
  dibujar(n: number) {
    const ctx = this.ctx;
    ctx.fillStyle = sala.pantallaFondo;
    ctx.fillRect(0, 0, 1024, 640);
    ctx.font = `500 26px ${ui.fuenteCodigo}`;
    ctx.textBaseline = 'top';
    const visible = CODIGO.slice(0, n);
    const lineas = visible.split('\n');
    lineas.forEach((linea, i) => {
      const y = 36 + i * 40;
      ctx.fillStyle = sala.codigo[3];
      ctx.fillText(String(i + 1).padStart(2, ' '), 24, y);
      // Coloreado mínimo: comentarios, cadenas y palabras clave
      let x = 90;
      const trozos = linea.startsWith('//') ? [{ t: linea, c: sala.codigo[3] }] : colorear(linea);
      for (const trozo of trozos) {
        ctx.fillStyle = trozo.c;
        ctx.fillText(trozo.t, x, y);
        x += ctx.measureText(trozo.t).width;
      }
      if (i === lineas.length - 1) {
        ctx.fillStyle = sala.cursor;
        ctx.fillRect(x + 2, y, 13, 28);
      }
    });
    this.textura.needsUpdate = true;
  }
}

function colorear(linea: string) {
  const trozos: { t: string; c: string }[] = [];
  const partes = linea.split(/('[^']*'?)/);
  for (const parte of partes) {
    if (parte.startsWith("'")) {
      trozos.push({ t: parte, c: sala.codigo[1] });
      continue;
    }
    let ultimo = 0;
    for (const m of parte.matchAll(PALABRAS_CLAVE)) {
      if (m.index! > ultimo) trozos.push({ t: parte.slice(ultimo, m.index), c: ui.texto });
      trozos.push({ t: m[0], c: sala.codigo[0] });
      ultimo = m.index! + m[0].length;
    }
    if (ultimo < parte.length) trozos.push({ t: parte.slice(ultimo), c: ui.texto });
  }
  return trozos;
}

/** Degradado radial blanco (halos de luz: galería, lámpara). El color lo pone el material. */
let halo: THREE.CanvasTexture | null = null;
export function texturaHalo() {
  if (halo) return halo;
  const { c, ctx } = lienzo(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  halo = aTextura(c, { srgb: false });
  halo.addEventListener('dispose', () => (halo = null));
  return halo;
}
