# models-entrada/

Carpeta de **entrada** para el script `npm run optimizar-modelos`.

Pon aquí tus modelos `.glb`/`.gltf` originales (sin comprimir, tal como salen de
Blender). El script los comprime (Draco + KTX2) y deja el resultado en
`public/models/`, listo para cargar con `<ModeloGLTF />`.

Esta carpeta no se publica: es solo un lugar de trabajo local.
