import type { Icon } from '@phosphor-icons/react';
import { Monitor } from '@phosphor-icons/react/dist/csr/Monitor';
import { Stack } from '@phosphor-icons/react/dist/csr/Stack';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { Headset } from '@phosphor-icons/react/dist/csr/Headset';
import type { IconoServicio } from '../../content/cabecera';

/** Icono de cada servicio: lo comparten la fila de la cabecera y la sección Servicios. */
export const iconosServicio: Record<IconoServicio, Icon> = {
  web: Monitor,
  sistema: Stack,
  automatizacion: ArrowsClockwise,
  seo: MagnifyingGlass,
  soporte: Headset,
};
