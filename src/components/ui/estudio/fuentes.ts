import { ui } from '../../../theme/theme';

/**
 * Las texturas en canvas (pizarra, neón, placas, código, tableros de las
 * oficinas) necesitan las fuentes ya cargadas antes de dibujarse. Lo usan
 * el taller y las oficinas antes de montar su escena.
 */
export function cargarFuentes() {
  const familias = [
    `700 48px ${ui.fuenteUi}`,
    `600 44px ${ui.fuenteUi}`,
    `500 26px ${ui.fuenteCodigo}`,
    `600 14px ${ui.fuenteCodigo}`,
    `700 54px ${ui.fuenteManuscrita}`,
    `500 38px ${ui.fuenteManuscrita}`,
  ];
  return Promise.all(familias.map((f) => document.fonts.load(f))).catch(() => undefined);
}
