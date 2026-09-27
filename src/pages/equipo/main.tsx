import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Integrante } from './Integrante';
import { obtenerIntegrantePorSlug } from '../../content/equipo';
import '../../styles/global.css';

const contenedor = document.getElementById('app');
if (!contenedor) throw new Error('No se encontró el elemento #app');

const slug = contenedor.dataset.miembro;
const integrante = slug ? obtenerIntegrantePorSlug(slug) : undefined;

if (!integrante) {
  throw new Error(
    `No se encontró al integrante "${slug}". Revisa el atributo data-miembro en el HTML y src/content/equipo.ts.`,
  );
}

createRoot(contenedor).render(
  <StrictMode>
    <Integrante integrante={integrante} />
  </StrictMode>,
);
