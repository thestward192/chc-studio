import { marca, oficina, ui } from '../../../theme/theme';
import { aTextura, azar, lienzo, mezclar } from '../estudio/texturas';

/**
 * Texturas en canvas de las oficinas del equipo. Colores del tema
 * (`marca`, `oficina`) y del integrante (`color` = su colorLuz).
 */

const redondeado = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

/**
 * Tablero "Lo que hago": nombre, gustos (reales) y, donde irá la
 * explicación de lo que hace, líneas de marcador sin texto.
 */
export function texturaTablero(nombre: string, gustos: string[], color: string) {
  const { c, ctx } = lienzo(1024, 572);
  ctx.fillStyle = marca.fondoOscuro;
  redondeado(ctx, 0, 0, 1024, 572, 36);
  ctx.fill();

  // Halo del color de la persona en la esquina
  const halo = ctx.createRadialGradient(900, 90, 0, 900, 90, 420);
  halo.addColorStop(0, mezclar(color, marca.fondoOscuro, 0.72));
  halo.addColorStop(1, marca.fondoOscuro);
  ctx.fillStyle = halo;
  redondeado(ctx, 0, 0, 1024, 572, 36);
  ctx.fill();

  // Etiqueta "Lo que hago" con la rayita de color
  ctx.fillStyle = color;
  redondeado(ctx, 64, 70, 44, 8, 4);
  ctx.fill();
  ctx.fillStyle = marca.textoTenue;
  ctx.font = `600 30px ${ui.fuenteUi}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('Lo que hago', 124, 75);

  // Nombre
  ctx.fillStyle = marca.texto;
  ctx.font = `700 78px ${ui.fuenteUi}`;
  ctx.fillText(nombre, 64, 160);

  // Texto pendiente: líneas sin texto
  [0.86, 0.94, 0.72, 0.8].forEach((f, i) => {
    ctx.fillStyle = i === 0 ? mezclar(color, marca.fondoOscuro, 0.55) : 'rgba(255, 255, 255, 0.1)';
    redondeado(ctx, 64, 236 + i * 46, 880 * f, 20, 10);
    ctx.fill();
  });

  // Gustos como etiquetas
  ctx.font = `500 28px ${marca.fuenteTexto}`;
  let x = 64;
  for (const gusto of gustos) {
    const w = ctx.measureText(gusto).width + 48;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    redondeado(ctx, x, 452, w, 56, 28);
    ctx.stroke();
    ctx.fillStyle = marca.texto;
    ctx.fillText(gusto, x + 24, 481);
    x += w + 16;
  }
  return aTextura(c);
}

/** Cancha de fútbol para la alfombra de Oscar (vista cenital, franjas y líneas). */
export function texturaCancha() {
  const { c, ctx } = lienzo(1024, 656);
  const franjas = 10;
  for (let i = 0; i < franjas; i++) {
    ctx.fillStyle = i % 2 ? oficina.cesped : oficina.cespedClaro;
    ctx.fillRect((1024 / franjas) * i, 0, 1024 / franjas + 1, 656);
  }
  ctx.strokeStyle = oficina.lineaCancha;
  ctx.lineWidth = 7;
  const m = 34;
  ctx.strokeRect(m, m, 1024 - m * 2, 656 - m * 2);
  ctx.beginPath();
  ctx.moveTo(512, m);
  ctx.lineTo(512, 656 - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(512, 328, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = oficina.lineaCancha;
  ctx.beginPath();
  ctx.arc(512, 328, 9, 0, Math.PI * 2);
  ctx.fill();
  for (const lado of [0, 1]) {
    const x = lado ? 1024 - m - 150 : m;
    ctx.strokeRect(x, 328 - 170, 150, 340);
    const xc = lado ? 1024 - m - 58 : m;
    ctx.strokeRect(xc, 328 - 80, 58, 160);
  }
  return aTextura(c);
}

/** Balón: blanco con parches oscuros (mapa equirrectangular). */
export function texturaBalon() {
  const { c, ctx } = lienzo(512, 256);
  ctx.fillStyle = oficina.balon;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = oficina.balonParche;
  const pentagono = (cx: number, cy: number, r: number, estirar: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.lineTo(cx + Math.cos(a) * r * estirar, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  };
  pentagono(256, 10, 22, 6); // polo norte (muy estirado en el mapa)
  pentagono(256, 246, 22, 6);
  for (let i = 0; i < 5; i++) {
    pentagono(51 + i * 102, 92, 24, 1.25);
    pentagono(102 + i * 102, 166, 24, 1.25);
  }
  return aTextura(c);
}

/** Camiseta enmarcada: silueta con número y nombre, en el color de la persona. */
export function texturaCamiseta(nombreCorto: string, color: string) {
  const { c, ctx } = lienzo(512, 640);
  ctx.fillStyle = marca.fondoOscuro;
  ctx.fillRect(0, 0, 512, 640);
  // Silueta
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(176, 90);
  ctx.quadraticCurveTo(256, 130, 336, 90);
  ctx.lineTo(446, 150);
  ctx.lineTo(410, 250);
  ctx.lineTo(372, 232);
  ctx.lineTo(372, 560);
  ctx.lineTo(140, 560);
  ctx.lineTo(140, 232);
  ctx.lineTo(102, 250);
  ctx.lineTo(66, 150);
  ctx.closePath();
  ctx.fill();
  // Franjas de las mangas
  ctx.fillStyle = marca.fondoOscuro;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(100, 205, 60, 14);
  ctx.fillRect(352, 205, 60, 14);
  ctx.globalAlpha = 1;
  // Nombre y número (la espalda de la camiseta)
  ctx.fillStyle = marca.fondoOscuro;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 40px ${ui.fuenteUi}`;
  ctx.fillText(nombreCorto.toUpperCase(), 256, 210);
  ctx.font = `700 190px ${ui.fuenteUi}`;
  ctx.fillText('10', 256, 380);
  return aTextura(c);
}

/** Póster gamer: invasor de píxeles con el degradado de la persona. */
export function texturaPoster(color: string) {
  const { c, ctx } = lienzo(512, 720);
  ctx.fillStyle = marca.fondoOscuro;
  ctx.fillRect(0, 0, 512, 720);
  const r = azar(5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < 70; i++) ctx.fillRect(r() * 512, r() * 720, 3, 3);
  const figura = [
    '00100000100',
    '00010001000',
    '00111111100',
    '01101110110',
    '11111111111',
    '10111111101',
    '10100000101',
    '00011011000',
  ];
  const tam = 36;
  const x0 = 256 - (figura[0].length * tam) / 2;
  const g = ctx.createLinearGradient(
    x0,
    180,
    x0 + figura[0].length * tam,
    180 + figura.length * tam,
  );
  g.addColorStop(0, color);
  g.addColorStop(1, marca.cian);
  ctx.fillStyle = g;
  figura.forEach((fila, y) =>
    [...fila].forEach((v, x) => {
      if (v === '1') ctx.fillRect(x0 + x * tam, 200 + y * tam, tam - 3, tam - 3);
    }),
  );
  ctx.fillStyle = marca.texto;
  ctx.textAlign = 'center';
  ctx.font = `700 46px ${ui.fuenteCodigo}`;
  ctx.fillText('PRESS START', 256, 590);
  ctx.fillStyle = color;
  ctx.fillRect(176, 620, 160, 8);
  return aTextura(c);
}

/** Muestrario de diseño: paleta de marca y del integrante, con sus códigos. */
export function texturaPaletaDiseno(color: string) {
  const { c, ctx } = lienzo(640, 640);
  ctx.fillStyle = oficina.pedestal;
  ctx.fillRect(0, 0, 640, 640);
  const colores = [
    marca.verde,
    marca.cian,
    color,
    marca.fondoOscuro,
    marca.superficie,
    '#ff5f6d',
    '#ffd166',
    '#8b7bff',
    '#f4f6f8',
  ];
  colores.forEach((col, i) => {
    const x = 40 + (i % 3) * 196;
    const y = 40 + Math.floor(i / 3) * 196;
    ctx.fillStyle = col;
    redondeado(ctx, x, y, 168, 124, 18);
    ctx.fill();
    ctx.fillStyle = marca.textoOscuroTenue;
    ctx.font = `500 22px ${ui.fuenteCodigo}`;
    ctx.fillText(col.toUpperCase(), x + 4, y + 158);
  });
  return aTextura(c);
}
