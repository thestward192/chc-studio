import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Estudio } from './Estudio';
// Fuentes del estudio (autoalojadas, solo el subconjunto latino y los pesos usados)
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/caveat/latin-500.css';
import '@fontsource/caveat/latin-700.css';
import '../../styles/global.css';

const contenedor = document.getElementById('app');
if (!contenedor) throw new Error('No se encontró el elemento #app');

createRoot(contenedor).render(
  <StrictMode>
    <Estudio />
  </StrictMode>,
);
