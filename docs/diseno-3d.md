# Diseño 3D de ChcStudio: cómo está hecho y cómo seguir

Notas para retomar el trabajo 3D (intro de la laptop y estudio) y para
construir las **habitaciones del equipo** con la misma base. El README
explica cómo usar cada pieza; este documento explica **por qué está hecho
así**, qué problemas aparecieron y cuál es el plan para las habitaciones.

---

## 1. Mapa rápido

| Página | Entrada | Escena (import dinámico) | Config | Estado |
|---|---|---|---|---|
| Inicio (intro laptop) | `src/pages/inicio/Inicio.tsx` | `three/EscenaIntroLaptop.tsx` | `three/laptop.config.ts` | props + `estadoIntro.ts` |
| Estudio | `src/pages/estudio/Estudio.tsx` | `three/EscenaSalaProyectos.tsx` | `three/estudio/estudio.config.ts` | zustand `estadoEstudio.ts` |
| Habitaciones (4) | `src/pages/equipo/Integrante.tsx` | `three/EscenaHabitacionPersonal.tsx` | — (pendiente) | — (pendiente) |
| Inicio (Núcleo del hero) | `src/components/header/HeroVisual.tsx` | `three/hero/EscenaHeroNucleo.tsx` | `three/hero/hero.config.ts` | objeto mutable `senalHero.ts` |

**Núcleo del hero (patrón "escena pequeña con póster").** Canvas transparente
sobre HTML: se carga con `lazy` solo en escritorio con mouse, tras
`IntersectionObserver` + `requestIdleCallback`, y usa `frameloop="never"`
cuando sale de pantalla o se oculta la pestaña. Siempre hay un póster
(`public/hero/nucleo.webp`) renderizado desde la propia escena con el hook de
desarrollo `window.__heroPoster()` y `scripts/capturar-poster-hero.mjs`. La UI
le habla a la escena por un objeto mutable sin three (`senalHero`), así el
bundle principal no arrastra la librería. Sirve de plantilla para cualquier
objeto 3D decorativo de las habitaciones.

Stack: React 18 + TypeScript + Vite multipágina, three r169, React Three
Fiber 8, drei 9, Anime.js 4 (API con exports nombrados: `animate`,
`createTimeline`, `stagger`, `cubicBezier`), zustand 4, leva (solo en
desarrollo), `@react-three/postprocessing` (solo en la intro).

---

## 2. Reglas que siguen todas las escenas

1. **Colores solo desde el tema.** `src/theme/tokens.css` (CSS) y su espejo
   `src/theme/theme.ts` (para three). Nada de colores fijos en componentes ni
   shaders: llegan como props o **uniforms**. Grupos del tema usados en 3D:
   `estudio`/`laptop` (intro) y `ui`/`sala` (estudio). Si agregas un color,
   agrégalo en los dos archivos.
2. **Un objeto de configuración por escena**, mutable, que la escena relee en
   cada fotograma (`laptop.config.ts`, `estudio.config.ts`). Así el panel leva
   (`?debug`) lo edita en vivo y ajustar tiempos o posiciones no toca la lógica.
3. **Un shader por archivo** en `src/components/three/shaders/`, con una
   función `crearUniforms…()`, `vertex…` y `fragment…`, y comentarios breves
   en español por bloque.
4. **three.js siempre por import dinámico.** La interfaz HTML no importa
   nada que arrastre three (ver `puente.ts`), para que la pantalla de carga o
   la página aparezcan enseguida.
5. **Render bajo demanda** (`frameloop="demand"` + `invalidate()`), con
   render continuo solo cuando hay algo moviéndose. Pausa total con la
   pestaña oculta o la sección fuera de vista.
6. **Tres niveles de calidad** (alto/medio/bajo): estimación inicial por la
   GPU (`estimarCalidadInicial()` en `utils/rendimiento.ts`) y ajuste con
   `PerformanceMonitor` de drei **solo mientras hay render continuo**. Con
   render bajo demanda, los huecos entre fotogramas parecen FPS bajos y el
   monitor bajaría la calidad sin motivo.
7. **Limpieza explícita**: todo lo creado a mano (`new THREE.*`) se registra
   con `rastrear()` (`estudio/recursos.ts`) y se libera al desmontar y en
   `pagehide`. Los eventos usan `AbortController`.
8. **`prefers-reduced-motion`**: se mantiene lo esencial (la secuencia o la
   navegación), sin flotaciones, parpadeos, partículas ni distorsión, y con
   vuelos de cámara cortos.

---

## 3. Intro de la laptop (Inicio)

- **Secuencia**: el progreso de scroll (0 → 1) de una sección de
  `alturaScrollVh` con el canvas en `position: sticky`. Cada fase es un tramo
  `[inicio, fin]` en `laptopConfig.secuencia`. El progreso se **suaviza**
  (`amortiguar`) para que la rueda nunca produzca saltos.
- **Reposo** (antes de hacer scroll): flotación, giro, respiración de cámara y
  parallax. Todo se multiplica por un peso `reposo` que baja a 0 al empezar el
  scroll: así no hay salto entre reposo y scroll.
- **Piezas**: `LaptopModelo.tsx` (geometría y materiales), `Ciclorama.tsx`
  (fondo curvo piso→pared con sombra de contacto en el mismo shader),
  `EntornoEstudio.tsx` (softboxes prefiltrados con PMREM, en vez de
  `<Environment>` de drei, que pesa ~50 KB por sus cargadores HDR/EXR),
  `PostprocesoIntro.tsx` (chunk aparte, solo en calidad media y alta).
- **Shaders**: `ciclorama`, `pantalla` (encendido desde una línea,
  subpíxeles con `fwidth` contra el moiré), `brilloRanura`, `transicion`
  (barril + desfase cromático) y `aluminio` (anisotropía + vetas por
  `onBeforeCompile`).
- **Curva de tonos propia** (`shaders/tonos.ts`): lineal hasta 0.8 y hombro
  suave encima. ACES, AgX y Neutral alteran los oscuros (Neutral tiñe de azul
  un gris oscuro) y rompían el empalme con el color de la página.
- **Bloom "selectivo" por umbral HDR**: solo la pantalla y la ranura emiten
  valores > 1 y el bloom tiene umbral 1.0.

---

## 4. Estudio 3D

### Arquitectura

```
Estudio.tsx (página, sin three)
 ├─ CargaEstudio · Hud · PanelInfo · MenuPausa · VersionSimple · InundacionLuz
 │     └─ hablan con la escena por puente.ts y con el estado por zustand
 └─ lazy(EscenaSalaProyectos) ── Canvas
       ├─ RelojAmbiente (tiempo, día/noche, FPS)   ← useFrame prioridad −2
       ├─ Iluminacion (sol, hemisférica, rebote, RoomEnvironment)
       ├─ <group key={versionConfig}> objetos… </group>   ← el debug los remonta
       ├─ ControlesCamara (OrbitControls + límites) ─ camara.ts (vuelos)
       ├─ Seleccion (hover/clic) · EncuadrePanel (setViewOffset)
       └─ Posproceso (composer de three)            ← useFrame prioridad 1
```

- **Estado**: `estadoEstudio.ts` (zustand). Dentro de `useFrame` se lee con
  `useEstudio.getState()` para no provocar renders de React. Los valores que
  cambian en cada fotograma (tiempo, factor de noche) viven en un objeto
  mutable: `ambiente.ts`.
- **Registro de interactivos** (`useInteractivo.ts`): cada objeto se registra
  con `{ id, nombre, etiqueta, foco, info, acciones, preview?, ancho?,
  grupo?, orden? }`. Casi siempre se usa a través del envoltorio
  `ObjetoInteractivo`. El id se guarda en `userData` de las mallas y en la raíz;
  al resolver un impacto se sube por los padres, así un `.glb` que reemplace la
  geometría sigue funcionando.
- **Hover y clic** (`Seleccion.tsx`): como mucho un raycast por fotograma y
  solo si el ratón se movió; las paredes (`userData.bloquea`) tapan lo de
  detrás. Clic corto: < 8 px y < 450 ms. En táctil no hay hover: un solo rayo
  al soltar.
- **Vuelos de cámara** (`camara.ts`): Anime.js anima `t` de 0 a 1 con
  `inOutCubic` e interpola posición y objetivo; los controles se desactivan
  durante el vuelo.
- **Posprocesado** (`Posproceso.tsx`): passes de `three/examples` porque los
  parámetros pedidos (`edgeGlow`, `edgeThickness`, radio del bloom) son de
  `OutlinePass` y `UnrealBloomPass`. Orden: Render → Outline → Bloom →
  viñeta/tinte (`shaders/vinetaTinte.ts`) → Output (ACES + sRGB) → SMAA.
- **Texturas procedurales** (`texturas.ts`): madera, tela, alfombra, pizarra
  (fuente Caveat), lomos de libros, cuadros de proyecto (baja y alta
  resolución), placas y máscara del neón. Las fuentes deben estar cargadas
  (`document.fonts.load`) **antes** de montar la escena.
- **Materiales compartidos** (`materiales.ts`): una instancia por tipo. Si
  un objeto necesita cambiar un material (por ejemplo, el marco que se ilumina),
  lo **clona**.
- **Audio** (`audio.ts`): todo sintetizado con Web Audio. El AudioContext se
  crea solo con un gesto del usuario y se cierra al salir.

### Problemas que aparecieron (y cómo se resolvieron)

| Síntoma | Causa | Solución |
|---|---|---|
| El modo noche no oscurecía nada | En three r169, con `scene.environment`, el `envMapIntensity` de cada material se ignora y se usa `scene.environmentIntensity` | Intensidad general en `scene.environmentIntensity`; los metales llevan `envMap` propio para poder tener más |
| Fondo gris que salía azul | El tone mapping Neutral resta un "toe" a los oscuros | Curva de tonos propia (intro) |
| Contorno rectangular alrededor de halos y luces | El OutlinePass dibuja todas las mallas del objeto | Mallas decorativas con `userData={DECORATIVA}` y `raycast={sinRaycast}`; el outline usa `mallasContorno(id)` |
| El monitor se quedaba en 0 % | `useMemo` dependía de un objeto nuevo en cada render: se recreaba el lienzo | Depender de valores estables (`!!principal`) |
| Los vuelos se deshacían | `target={[x,y,z]}` nuevo en cada render: R3F lo vuelve a aplicar | Arrays estables (constantes o del config) |
| El registro "pisaba" un `userData` compartido | Un objeto `userData` compartido entre mallas | `DECORATIVA` congelado; el registro no escribe en objetos congelados |
| La "S" del neón deformada | `strokeText` con Space Grotesk | Caveat rellena |
| Un foco tapaba el neón | Estaban a la misma altura | Riel de galería más arriba y neón más abajo |
| El panel tapaba el objeto enfocado | — | `EncuadrePanel`: `setViewOffset` animado (a la izquierda en escritorio, hacia arriba en móvil) |

### Cómo lo probé

Con Playwright (instalado globalmente) y Chrome con GPU real (flags
`--enable-gpu --use-angle=d3d11`). En desarrollo, `Estudio.tsx` expone
`window.__estudio = { puente, estado, ambiente }` para las pruebas (no existe
en producción). Patrón básico:

```js
await page.goto('http://localhost:5173/estudio.html');
await page.waitForSelector('.eui-carga button:not([disabled])');
await page.click('.eui-carga button');
await page.waitForFunction(() => window.__estudio?.estado.getState().fase === 'explorando');
await page.evaluate(() => window.__estudio.puente.seleccionar('cuadro-proyecto-3'));
await page.screenshot({ path: 'captura.png' });
```

Para medir FPS: `?calidad=alto|medio|bajo` y el lanzador con
`--disable-gpu-vsync --disable-frame-rate-limit`. Para simular una GPU débil:
`--use-angle=swiftshader`.

---

## 5. Plan para las habitaciones del equipo

Hoy `EscenaHabitacionPersonal.tsx` es la versión básica (cajas de colores,
etiquetas `Html`, luces de marcador). La idea es rehacerla **reutilizando la
infraestructura del estudio**, sin copiarla.

### Pasos sugeridos

1. **Config por integrante.** Crear `three/habitacion/habitacion.config.ts`
   con la misma forma que `estudio.config.ts` (sala, cámara, luces
   día/noche, posprocesado, calidad), y que los objetos de cada persona sigan
   saliendo de `equipo.ts` (`objetosHabitacion`, colores). Si una persona
   necesita otra distribución, se añade un bloque por `slug`.
2. **Generalizar lo reutilizable del estudio** a una carpeta común (por
   ejemplo `three/sala3d/`) en vez de duplicarlo:
   - `estadoEstudio.ts` → estado de "sala 3D" genérico (seleccionado, hover,
     día/noche, sonido, pausa, calidad, fase). Lo específico del estudio
     (cafés, rack…) queda en un slice aparte.
   - `useInteractivo`, `Seleccion`, `camara`, `EncuadrePanel`,
     `RelojAmbiente`, `recursos`, `puente`, `audio` y `Posproceso` casi no
     dependen del estudio: solo leen el config. Pasarles el config por
     contexto o parámetro basta.
   - La interfaz (`ui/estudio/*`) se puede reutilizar tal cual cambiando
     textos: carga, HUD, panel, menú de pausa y versión simple.
3. **Objetos de gustos**: pasar `ObjetoGustoHabitacion` (hoy dentro de
   `EscenaHabitacionPersonal.tsx`) a `ObjetoInteractivo` con panel. Cada
   `ObjetoGusto` de `equipo.ts` se convierte en un interactivo con `info` =
   su descripción y una acción si aplica. Su `modeloUrl` se pasa como `modelo`
   para que cargue el `.glb` cuando exista.
4. **Puerta de salida**: la puerta de vuelta al estudio puede ser el mismo
   `Puerta.tsx` con el color de luz del estudio y `href="/estudio.html"`
   (hoy recibe un `Integrante`: habría que aceptar también `{ nombre, colorLuz,
   href, frase }`).
5. **Texto real**: el `PanelTexto` actual (bio, gustos, experiencia,
   habilidades, CV) pasa a ser la "Versión simple" de la habitación.
6. **Personalidad por integrante**: color de acento del panel = `colorLuz`,
   y 2 o 3 objetos firma con shader propio (por ejemplo, una pantalla, una
   lámpara o un póster con paralaje reutilizando `shaders/cuadro.ts`).
7. **Pruebas**: el mismo patrón de Playwright con `?calidad=` y la página de
   cada integrante.

### Lista de verificación al terminar cada habitación

- [ ] Colores solo desde el tema o `equipo.ts`; nada fijo en shaders.
- [ ] Posiciones en el config, no en los componentes.
- [ ] Cada objeto interactivo con foco, info y acciones; decorativos marcados.
- [ ] Tres niveles de calidad, render bajo demanda, pausa con pestaña oculta.
- [ ] `rastrear()` en todo lo creado a mano; limpieza en `pagehide`.
- [ ] Movimiento reducido y versión en texto.
- [ ] `npm run build` sin errores y peso de la página < 4 MB (presupuesto del README).
