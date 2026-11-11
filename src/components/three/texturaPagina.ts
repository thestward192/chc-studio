import * as THREE from 'three';
import { marca } from '../../theme/theme';
import { ctaNav, enlacesNav, hero, volverIntro } from '../../content/cabecera';

const ANCHO = 1280;
const ALTO = 800; // 16:10, como la pantalla

/**
 * Dibuja en un <canvas> una miniatura del header de Inicio tal como se ve
 * ahora (estilo iPhone): navbar de vidrio en cápsula con el chip "Intro",
 * tarjeta oscura con el titular centrado, la mascota sobre su piso y los
 * botones debajo, con la letra del sistema (SF Pro, o Inter). Es lo que
 * muestra la pantalla de la laptop al encenderse. El centro de la pantalla
 * cae dentro de la tarjeta oscura (entre el subtítulo y la mascota), que es
 * el color al que se funde el zoom final (`marca.fondoOscuro`).
 *
 * Se dibuja al instante con lo que haya y se vuelve a dibujar cuando cargan
 * la fuente y el póster de la mascota; `alActualizar` avisa para
 * pedir un fotograma nuevo (la escena renderiza bajo demanda).
 */
export function crearTexturaPagina(alActualizar?: () => void): THREE.CanvasTexture {
  const lienzo = document.createElement('canvas');
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d')!;
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;

  let mascota: HTMLImageElement | null = null;
  const redibujar = () => {
    dibujar(ctx, mascota);
    textura.needsUpdate = true;
    alActualizar?.();
  };
  dibujar(ctx, null);

  const fuentes = document.fonts
    ? Promise.all(
        ['700 60px Inter', '500 20px Inter', '400 20px Inter'].map((f) => document.fonts.load(f)),
      ).catch(() => undefined)
    : Promise.resolve();
  const imagen = new Promise<void>((resolver) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      mascota = img;
      resolver();
    };
    img.onerror = () => resolver();
    img.src = hero.poster;
  });
  fuentes.then(redibujar);
  Promise.all([fuentes, imagen]).then(redibujar);

  return textura;
}

function dibujar(ctx: CanvasRenderingContext2D, mascota: HTMLImageElement | null) {
  const F = marca.fuenteApple;
  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Página clara
  ctx.fillStyle = marca.fondoPagina;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // ---------- Tarjeta oscura del hero (detrás del navbar, que flota encima)
  const tarjeta = { x: 16, y: 86, w: ANCHO - 32, h: ALTO };
  ctx.fillStyle = marca.fondoOscuro;
  rectRedondeado(ctx, tarjeta.x, tarjeta.y, tarjeta.w, tarjeta.h, [36, 36, 0, 0]);
  ctx.fill();
  ctx.save();
  ctx.clip();

  // Estrellas tenues (semilla fija: siempre las mismas)
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(30, 200, 216, ${0.12 + azar() * 0.3})`;
    ctx.beginPath();
    ctx.arc(tarjeta.x + azar() * tarjeta.w, tarjeta.y + azar() * 640, 0.8 + azar() * 1.4, 0, 7);
    ctx.fill();
  }

  // Piso en perspectiva bajo la mascota
  const fuga = { x: ANCHO / 2, y: 470 };
  ctx.strokeStyle = 'rgba(30, 200, 216, 0.13)';
  ctx.lineWidth = 1.2;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(fuga.x + i * 14, 590);
    ctx.lineTo(fuga.x + i * 150, ALTO);
    ctx.stroke();
  }
  for (let y = 600, paso = 10; y < ALTO; y += paso, paso *= 1.35) {
    ctx.beginPath();
    ctx.moveTo(tarjeta.x, y);
    ctx.lineTo(tarjeta.x + tarjeta.w, y);
    ctx.stroke();
  }
  // Brillo aqua bajo la mascota
  const brillo = ctx.createRadialGradient(ANCHO / 2, 630, 0, ANCHO / 2, 630, 260);
  brillo.addColorStop(0, 'rgba(46, 230, 192, 0.32)');
  brillo.addColorStop(1, 'rgba(46, 230, 192, 0)');
  ctx.fillStyle = brillo;
  ctx.fillRect(tarjeta.x, 400, tarjeta.w, 400);

  // Antetítulo, titular (centrado, 2 líneas) y subtítulo
  ctx.textAlign = 'center';
  ctx.font = `500 22px ${F}`;
  textoDegradadoCentrado(ctx, hero.antetitulo, ANCHO / 2, 153);
  ctx.font = `700 60px ${F}`;
  ctx.letterSpacing = '-2px';
  let ty = 207;
  hero.titular.forEach((partes) => {
    const linea = partes.map((p) => p.texto).join('');
    if (partes.some((p) => p.destacado)) {
      textoDegradadoCentrado(ctx, linea, ANCHO / 2, ty);
    } else {
      ctx.fillStyle = marca.texto;
      ctx.fillText(linea, ANCHO / 2, ty);
    }
    ty += 63;
  });
  ctx.letterSpacing = '0px';
  ctx.font = `400 19px ${F}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  lineas(ctx, hero.subtitulo, 520).forEach((linea, i) =>
    ctx.fillText(linea, ANCHO / 2, 336 + i * 27),
  );

  // Mascota (póster del render 3D)
  if (mascota) {
    const lado = 300;
    ctx.drawImage(mascota, ANCHO / 2 - lado / 2 - 25, 395, lado, lado);
  }

  // Botones bajo la mascota: píldora con degradado + enlace al estudio 3D
  ctx.textAlign = 'left';
  const anchoBoton = anchoPildora(ctx, hero.boton.etiqueta, 17, 54);
  const enlace = `${hero.prueba.enlace.etiqueta}  ›`;
  ctx.font = `500 18px ${F}`;
  const anchoEnlace = ctx.measureText(enlace).width;
  const inicio = (ANCHO - anchoBoton - 28 - anchoEnlace) / 2;
  pildora(ctx, inicio, 703, anchoBoton, 54, hero.boton.etiqueta, 17);
  ctx.font = `500 18px ${F}`;
  ctx.fillStyle = marca.cian;
  ctx.fillText(enlace, inicio + anchoBoton + 28, 731);
  ctx.restore();

  // ---------- Navbar: cápsula de vidrio claro flotando arriba
  const nav = { x: 80, y: 14, w: ANCHO - 160, h: 56 };
  ctx.save();
  ctx.shadowColor = 'rgba(18, 22, 31, 0.12)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  rectRedondeado(ctx, nav.x, nav.y, nav.w, nav.h, [28, 28, 28, 28]);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(18, 22, 31, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const centroNav = nav.y + nav.h / 2;
  // Logo: "CHC" oscuro + "STUDIO" con el degradado
  ctx.font = `700 25px ${F}`;
  ctx.fillStyle = marca.textoOscuro;
  ctx.fillText('CHC', nav.x + 22, centroNav + 1);
  const anchoChc = ctx.measureText('CHC ').width;
  textoDegradado(ctx, 'STUDIO', nav.x + 22 + anchoChc, centroNav + 1);
  const finLogo = nav.x + 22 + anchoChc + ctx.measureText('STUDIO').width;

  // Chip "Intro" con la laptop
  ctx.font = `500 14px ${F}`;
  const anchoChip = 40 + ctx.measureText(volverIntro.etiqueta).width + 14;
  const chipX = finLogo + 12;
  ctx.fillStyle = 'rgba(18, 22, 31, 0.08)';
  rectRedondeado(ctx, chipX, centroNav - 17, anchoChip, 34, [17, 17, 17, 17]);
  ctx.fill();
  ctx.strokeStyle = marca.textoOscuro;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(chipX + 14, centroNav - 6, 12, 8);
  ctx.beginPath();
  ctx.moveTo(chipX + 11, centroNav + 5);
  ctx.lineTo(chipX + 29, centroNav + 5);
  ctx.stroke();
  ctx.fillStyle = marca.textoOscuro;
  ctx.fillText(volverIntro.etiqueta, chipX + 34, centroNav + 1);

  // Enlaces centrados
  ctx.font = `400 15px ${F}`;
  const anchos = enlacesNav.map((e) => ctx.measureText(e.etiqueta).width);
  const hueco = 42;
  let x = ANCHO / 2 - (anchos.reduce((a, b) => a + b, 0) + hueco * (anchos.length - 1)) / 2;
  enlacesNav.forEach((e, i) => {
    ctx.fillStyle = 'rgba(18, 22, 31, 0.72)';
    ctx.fillText(e.etiqueta, x, centroNav + 1);
    x += anchos[i] + hueco;
  });

  // Botón "Hablemos"
  const anchoCta = anchoPildora(ctx, ctaNav.etiqueta, 15, 38);
  pildora(ctx, nav.x + nav.w - 10 - anchoCta, centroNav - 19, anchoCta, 38, ctaNav.etiqueta, 15);
}

/* ------------------------------------------------------------------ Ayudas */

function degradado(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, marca.verde);
  g.addColorStop(1, marca.cian);
  return g;
}

function textoDegradado(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number) {
  ctx.fillStyle = degradado(ctx, x, x + ctx.measureText(texto).width);
  ctx.fillText(texto, x, y);
}

/** Texto con el degradado de marca, centrado en x (textAlign = center). */
function textoDegradadoCentrado(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
) {
  const ancho = ctx.measureText(texto).width;
  ctx.fillStyle = degradado(ctx, x - ancho / 2, x + ancho / 2);
  ctx.fillText(texto, x, y);
}

function pildora(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  texto: string,
  tamano: number,
) {
  ctx.fillStyle = degradado(ctx, x, x + w);
  rectRedondeado(ctx, x, y, w, h, [h / 2, h / 2, h / 2, h / 2]);
  ctx.fill();
  const r = h / 2 - 5;
  ctx.fillStyle = marca.textoSobreAcento;
  ctx.beginPath();
  ctx.arc(x + w - r - 5, y + h / 2, r, 0, Math.PI * 2);
  ctx.fill();
  // Flecha
  ctx.strokeStyle = marca.verde;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const fx = x + w - r - 5;
  const fy = y + h / 2;
  const a = r * 0.42;
  ctx.beginPath();
  ctx.moveTo(fx - a, fy);
  ctx.lineTo(fx + a, fy);
  ctx.moveTo(fx + a * 0.25, fy - a * 0.7);
  ctx.lineTo(fx + a, fy);
  ctx.lineTo(fx + a * 0.25, fy + a * 0.7);
  ctx.stroke();
  ctx.font = `500 ${tamano}px ${marca.fuenteApple}`;
  ctx.fillStyle = marca.textoSobreAcento;
  ctx.fillText(texto, x + h * 0.45, y + h / 2 + 1);
}

/** Ancho de la píldora: texto + margen izquierdo + círculo de la flecha. */
function anchoPildora(ctx: CanvasRenderingContext2D, texto: string, tamano: number, alto: number) {
  ctx.font = `500 ${tamano}px ${marca.fuenteApple}`;
  return Math.ceil(alto * 0.45 + ctx.measureText(texto).width + 14 + alto);
}

function lineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const resultado: string[] = [];
  let actual = '';
  for (const palabra of texto.split(' ')) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > ancho && actual) {
      resultado.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) resultado.push(actual);
  return resultado;
}

function rectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  [ai, ad, bd, bi]: [number, number, number, number],
) {
  ctx.beginPath();
  ctx.moveTo(x + ai, y);
  ctx.lineTo(x + w - ad, y);
  ctx.arcTo(x + w, y, x + w, y + ad, ad);
  ctx.lineTo(x + w, y + h - bd);
  ctx.arcTo(x + w, y + h, x + w - bd, y + h, bd);
  ctx.lineTo(x + bi, y + h);
  ctx.arcTo(x, y + h, x, y + h - bi, bi);
  ctx.lineTo(x, y + ai);
  ctx.arcTo(x, y, x + ai, y, ai);
  ctx.closePath();
}
