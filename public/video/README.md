# public/video/

Videos en bucle, cortos y ligeros (idealmente < 2 MB, sin audio, formato **.mp4** con
codec H.264, 5-8 segundos, resolución baja ya que se muestran en miniatura).

- `preview-estudio.mp4`: video de fondo del botón "Explorar el estudio" en el header de
  la página informativa (ver `src/components/ui/Header.tsx` y `BotonPreview.tsx`). Debe
  mostrar un recorrido corto por la sala de proyectos — NO es una escena 3D en vivo,
  es un video pregrabado, para que el botón sea barato de renderizar.

Formato recomendado de exportación: MP4 (H.264), sin sonido, `muted loop playsinline`.

TODO(video): grabar/exportar el video real cuando la sala de proyectos esté definida.
