import { useState } from 'react';
import { logo } from '../../content/cabecera';
import estilos from './Logo.module.css';

/**
 * Logo sobre fondo claro: /logo-light.png. Si la imagen no existe, se
 * dibuja en texto: "CHC" oscuro + "STUDIO" con el degradado de marca.
 */
export function Logo() {
  const [sinImagen, setSinImagen] = useState(false);

  return (
    <a href="/" className={estilos.logo} aria-label={`${logo.alt}, inicio`}>
      {sinImagen ? (
        <span className={estilos.texto} aria-hidden="true">
          <span className={estilos.chc}>CHC</span>
          <span className={estilos.studio}>STUDIO</span>
        </span>
      ) : (
        <img
          className={estilos.imagen}
          src={logo.imagen}
          alt=""
          onError={() => setSinImagen(true)}
        />
      )}
    </a>
  );
}
