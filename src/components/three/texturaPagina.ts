import * as THREE from 'three';
import { colores, tipografia } from '../../theme/theme';
import { empresa } from '../../content/empresa';

/**
 * Dibuja en un <canvas> una miniatura de la página de inicio (cabecera,
 * título, tarjetas) con los colores del tema. Es lo que muestra la pantalla
 * de la laptop al encenderse; su centro es el color de fondo de la página,
 * de modo que al terminar el zoom el paso al HTML real no se nota.
 */
export function crearTexturaPagina(): THREE.CanvasTexture {
  const ancho = 1280;
  const alto = 800;
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d')!;

  ctx.fillStyle = colores.fondo;
  ctx.fillRect(0, 0, ancho, alto);

  // Cabecera
  ctx.fillStyle = colores.fondoAlterno;
  ctx.fillRect(0, 0, ancho, 76);
  ctx.fillStyle = colores.borde;
  ctx.fillRect(0, 76, ancho, 2);
  ctx.fillStyle = colores.texto;
  ctx.font = `700 30px ${tipografia.fuenteTitulos}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(empresa.nombre, 56, 39);
  ctx.fillStyle = colores.textoTenue;
  ctx.font = `500 20px ${tipografia.fuenteBase}`;
  ['Servicios', 'Proyectos', 'Equipo', 'Contacto'].forEach((texto, i) => {
    ctx.fillText(texto, 620 + i * 132, 39);
  });

  // Título principal
  ctx.fillStyle = colores.texto;
  ctx.font = `700 76px ${tipografia.fuenteTitulos}`;
  ctx.fillText(empresa.nombre, 56, 230);
  ctx.fillStyle = colores.textoTenue;
  ctx.font = `400 28px ${tipografia.fuenteBase}`;
  ctx.fillText(empresa.eslogan, 58, 300);

  // Botón
  redondeado(ctx, 56, 350, 250, 60, 30);
  ctx.fillStyle = colores.acento;
  ctx.fill();
  ctx.fillStyle = colores.textoInverso;
  ctx.font = `600 22px ${tipografia.fuenteBase}`;
  ctx.fillText('Explorar el estudio', 84, 381);

  // Tarjetas de servicios
  for (let i = 0; i < 3; i++) {
    const x = 56 + i * 400;
    redondeado(ctx, x, 480, 368, 250, 20);
    ctx.fillStyle = colores.superficie;
    ctx.fill();
    ctx.strokeStyle = colores.borde;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = colores.marca;
    ctx.fillRect(x + 32, 520, 48, 48);
    ctx.fillStyle = colores.texto;
    ctx.fillRect(x + 32, 600, 220, 18);
    ctx.fillStyle = colores.borde;
    ctx.fillRect(x + 32, 636, 290, 12);
    ctx.fillRect(x + 32, 660, 250, 12);
  }

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

function redondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
