import * as THREE from 'three';
import { marca } from '../../theme/theme';
import { ctaNav, enlacesNav, hero } from '../../content/cabecera';

const ANCHO = 1280;
const ALTO = 800; // 16:10, como la pantalla

/**
 * Dibuja en un <canvas> una miniatura del header de Inicio (navbar con la
 * pestaña oscura, tarjeta del hero con titular, botón y el Núcleo) con los
 * colores y tipografías de marca. Es lo que muestra la pantalla de la laptop
 * al encenderse. El centro de la pantalla cae dentro de la tarjeta oscura,
 * que es el color al que se funde el zoom final (`marca.fondoOscuro`).
 *
 * Se dibuja al instante con lo que haya y se vuelve a dibujar cuando cargan
 * las fuentes (Sora/Inter) y el póster del Núcleo; `alActualizar` avisa para
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

  let nucleo: HTMLImageElement | null = null;
  const redibujar = () => {
    dibujar(ctx, nucleo);
    textura.needsUpdate = true;
    alActualizar?.();
  };
  dibujar(ctx, null);

  const fuentes = document.fonts
    ? Promise.all(
        ['700 60px Sora', '600 20px Sora', '400 20px Inter', '500 20px Inter'].map((f) =>
          document.fonts.load(f),
        ),
      ).catch(() => undefined)
    : Promise.resolve();
  const imagen = new Promise<void>((resolver) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      nucleo = img;
      resolver();
    };
    img.onerror = () => resolver();
    img.src = hero.poster;
  });
  fuentes.then(redibujar);
  Promise.all([fuentes, imagen]).then(redibujar);

  return textura;
}

function dibujar(ctx: CanvasRenderingContext2D, nucleo: HTMLImageElement | null) {
  const T = marca.fuenteTitulos;
  const B = marca.fuenteTexto;
  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.textBaseline = 'middle';

  // Página clara
  ctx.fillStyle = marca.fondoPagina;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // ---------- Navbar
  const altoNav = 86;
  const margen = 9; // borde claro alrededor de la tarjeta (fino: en pantalla brilla)
  // Logo: "CHC" oscuro + "STUDIO" con el degradado
  ctx.font = `700 30px ${T}`;
  ctx.fillStyle = marca.textoOscuro;
  ctx.fillText('CHC', 44, altoNav / 2 + 4);
  const anchoChc = ctx.measureText('CHC ').width;
  textoDegradado(ctx, 'STUDIO', 44 + anchoChc, altoNav / 2 + 4);

  // Pestaña oscura con esquinas invertidas
  const tabAncho = 560;
  const tabX = (ANCHO - tabAncho) / 2;
  const radio = 22;
  ctx.fillStyle = marca.fondoOscuro;
  rectRedondeado(ctx, tabX, 10, tabAncho, altoNav, [radio, radio, 0, 0]);
  ctx.fill();
  esquinaInvertida(ctx, tabX, altoNav + 10, radio, 'izquierda');
  esquinaInvertida(ctx, tabX + tabAncho, altoNav + 10, radio, 'derecha');

  ctx.font = `600 19px ${T}`;
  const anchos = enlacesNav.map((e) => ctx.measureText(e.etiqueta).width);
  const hueco = (tabAncho - 80 - anchos.reduce((a, b) => a + b, 0)) / (enlacesNav.length - 1);
  let x = tabX + 40;
  enlacesNav.forEach((e, i) => {
    ctx.fillStyle = i === 0 ? marca.texto : 'rgba(255, 255, 255, 0.72)';
    ctx.fillText(e.etiqueta, x, altoNav / 2 + 12);
    if (i === 0) {
      ctx.fillStyle = degradado(ctx, x, x + anchos[i]);
      rectRedondeado(ctx, x + anchos[i] / 2 - 11, altoNav - 6, 22, 4, [2, 2, 2, 2]);
      ctx.fill();
    }
    x += anchos[i] + hueco;
  });

  // Botón "Hablemos"
  const anchoCta = anchoPildora(ctx, ctaNav.etiqueta, 18, 46);
  pildora(ctx, ANCHO - 44 - anchoCta, altoNav / 2 - 22 + 4, anchoCta, 46, ctaNav.etiqueta, 18);

  // ---------- Tarjeta del hero
  const tarjeta = {
    x: margen,
    y: altoNav + 10,
    w: ANCHO - margen * 2,
    h: ALTO - altoNav - 10 - margen,
  };
  ctx.fillStyle = marca.fondoOscuro;
  rectRedondeado(ctx, tarjeta.x, tarjeta.y, tarjeta.w, tarjeta.h, [28, 28, 28, 28]);
  ctx.fill();

  ctx.save();
  ctx.clip();

  // Halo y anillos a la derecha
  const cx = tarjeta.x + tarjeta.w * 0.73;
  const cy = tarjeta.y + tarjeta.h * 0.55;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
  halo.addColorStop(0, 'rgba(61, 235, 138, 0.28)');
  halo.addColorStop(0.45, 'rgba(30, 200, 216, 0.14)');
  halo.addColorStop(1, 'rgba(30, 200, 216, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(tarjeta.x, tarjeta.y, tarjeta.w, tarjeta.h);
  ctx.strokeStyle = marca.bordeCristal;
  ctx.lineWidth = 1.5;
  for (const r of [290, 222, 160]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (nucleo) {
    const lado = 480;
    ctx.drawImage(nucleo, cx - lado / 2, cy - lado / 2, lado, lado);
  }

  // Titular (3 líneas, partes destacadas con el degradado)
  const tx = tarjeta.x + 64;
  let ty = tarjeta.y + 150;
  ctx.font = `700 70px ${T}`;
  hero.titular.forEach((partes) => {
    let px = tx;
    partes.forEach((parte) => {
      if (parte.destacado) {
        textoDegradado(ctx, parte.texto, px, ty);
      } else {
        ctx.fillStyle = marca.texto;
        ctx.fillText(parte.texto, px, ty);
      }
      px += ctx.measureText(parte.texto).width;
    });
    ty += 76;
  });

  // Subtítulo (2 líneas)
  ctx.font = `400 21px ${B}`;
  ctx.fillStyle = marca.textoTenue;
  lineas(ctx, hero.subtitulo, 430).forEach((linea, i) => ctx.fillText(linea, tx, ty + 14 + i * 32));

  // Botón principal
  pildora(
    ctx,
    tx,
    ty + 96,
    anchoPildora(ctx, hero.boton.etiqueta, 20, 58),
    58,
    hero.boton.etiqueta,
    20,
  );

  // Prueba social
  ctx.fillStyle = marca.bordeCristal;
  ctx.fillRect(tx, ty + 192, 430, 1.5);
  ctx.font = `400 17px ${B}`;
  ctx.fillStyle = marca.textoTenue;
  ctx.fillText(hero.prueba.texto, tx, ty + 226);

  ctx.restore();
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
  ctx.font = `500 ${tamano}px ${marca.fuenteTexto}`;
  ctx.fillStyle = marca.textoSobreAcento;
  ctx.fillText(texto, x + h * 0.45, y + h / 2 + 1);
}

/** Ancho de la píldora: texto + margen izquierdo + círculo de la flecha. */
function anchoPildora(ctx: CanvasRenderingContext2D, texto: string, tamano: number, alto: number) {
  ctx.font = `500 ${tamano}px ${marca.fuenteTexto}`;
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

/** Esquina invertida al pie de la pestaña: cuadrado oscuro menos un cuarto de círculo. */
function esquinaInvertida(
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  r: number,
  lado: 'izquierda' | 'derecha',
) {
  ctx.fillStyle = marca.fondoOscuro;
  ctx.beginPath();
  if (lado === 'izquierda') {
    ctx.moveTo(x, base - r);
    ctx.lineTo(x, base);
    ctx.lineTo(x - r, base);
    ctx.arc(x - r, base - r, r, Math.PI / 2, 0, true);
  } else {
    ctx.moveTo(x, base - r);
    ctx.lineTo(x, base);
    ctx.lineTo(x + r, base);
    ctx.arc(x + r, base - r, r, Math.PI / 2, Math.PI, false);
  }
  ctx.closePath();
  ctx.fill();
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
