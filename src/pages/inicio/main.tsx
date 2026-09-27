import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Inicio } from './Inicio';
import '../../styles/global.css';

const contenedor = document.getElementById('app');
if (!contenedor) throw new Error('No se encontró el elemento #app');

createRoot(contenedor).render(
  <StrictMode>
    <Inicio />
  </StrictMode>,
);
