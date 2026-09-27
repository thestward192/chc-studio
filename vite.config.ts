import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite en modo "multi-página": cada sala/página es una entrada HTML
// independiente para que el navegador libere toda la memoria de Three.js
// al navegar de una a otra (recarga completa, no ruta de SPA).
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    // El bundle de three.js + @react-three/fiber + drei es grande incluso
    // minificado, pero solo se descarga con import dinámico cuando el
    // usuario entra a una sala 3D (ver EscenaIntroLaptop.tsx, etc.), así
    // que este límite es solo para no ensuciar la salida del build.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        inicio: resolve(__dirname, 'index.html'),
        estudio: resolve(__dirname, 'estudio.html'),
        integrante1: resolve(__dirname, 'equipo/integrante-1.html'),
        integrante2: resolve(__dirname, 'equipo/integrante-2.html'),
        integrante3: resolve(__dirname, 'equipo/integrante-3.html'),
        integrante4: resolve(__dirname, 'equipo/integrante-4.html'),
      },
    },
  },
});
