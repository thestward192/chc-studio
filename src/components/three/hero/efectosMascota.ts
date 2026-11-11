import * as THREE from 'three';
import { marca } from '../../../theme/theme';
import type { TipoEfecto } from './trucosMascota';

/**
 * Texturas de los efectos de los trucos (dibujadas en canvas, sin imágenes):
 * la "Z" de dormir, la estrella del mareo, la marca de enojo y la nota
 * musical del baile. Todas con un halo suave para que se lean sobre la sala
 * oscura.
 */
export function crearTexturasEfectos(): Record<TipoEfecto, THREE.CanvasTexture> {
  return {
    z: textura((ctx) => {
      ctx.font = `800 104px ${marca.fuenteApple}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      halo(ctx, 'rgba(30, 200, 216, 0.9)', 18);
      ctx.fillStyle = '#eafcff';
      ctx.fillText('Z', 64, 68);
    }),
    estrella: textura((ctx) => {
      halo(ctx, 'rgba(255, 214, 90, 0.95)', 16);
      ctx.fillStyle = '#ffe58a';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 22 : 50;
        ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      // Brillo blanco en el centro
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(64, 64, 9, 0, Math.PI * 2);
      ctx.fill();
    }),
    enojo: textura((ctx) => {
      // Marca de enojo: cuatro esquinas curvas que apuntan al centro
      ctx.lineCap = 'round';
      ctx.translate(64, 64);
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(14, 46);
        ctx.quadraticCurveTo(14, 14, 46, 14);
        halo(ctx, 'rgba(255, 60, 80, 0.9)', 12);
        ctx.strokeStyle = '#7a0f1c';
        ctx.lineWidth = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff4057';
        ctx.lineWidth = 12;
        ctx.stroke();
        ctx.restore();
      }
    }),
    nota: textura((ctx) => {
      const g = ctx.createLinearGradient(30, 110, 100, 20);
      g.addColorStop(0, marca.verde);
      g.addColorStop(1, marca.cian);
      halo(ctx, 'rgba(61, 235, 138, 0.8)', 16);
      ctx.fillStyle = g;
      // Cabeza de la nota
      ctx.save();
      ctx.translate(48, 94);
      ctx.rotate(-0.42);
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Plica y banderín
      ctx.fillRect(62, 22, 8, 74);
      ctx.beginPath();
      ctx.moveTo(70, 22);
      ctx.bezierCurveTo(92, 34, 104, 46, 92, 70);
      ctx.bezierCurveTo(96, 52, 86, 44, 70, 42);
      ctx.closePath();
      ctx.fill();
    }),
  };
}

function textura(dibujar: (ctx: CanvasRenderingContext2D) => void) {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 128;
  const ctx = lienzo.getContext('2d')!;
  dibujar(ctx);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function halo(ctx: CanvasRenderingContext2D, color: string, desenfoque: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = desenfoque;
}
