import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Inicio } from './Inicio';
// Fuentes de marca empaquetadas con el sitio (subconjunto latin: cubre á, é, í, ñ, ü…)
import '@fontsource/sora/latin-600.css';
import '@fontsource/sora/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '../../styles/global.css';

const contenedor = document.getElementById('app');
if (!contenedor) throw new Error('No se encontró el elemento #app');

createRoot(contenedor).render(
  <StrictMode>
    <Inicio />
  </StrictMode>,
);
