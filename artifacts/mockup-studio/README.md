# Mockup Studio Pro

> Plataforma de creación de **mockups 3D de alta fidelidad** directamente en el navegador. PBR, HDRI, post-processing y una timeline cinematográfica para producir imágenes y videos listos para marketing — sin salir de la web.

![status](https://img.shields.io/badge/status-active-success)
![stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Three.js-blue)
![license](https://img.shields.io/badge/license-MIT-green)

---

## 📌 ¿Qué es?

**Mockup Studio Pro** es una aplicación web (PWA-ready) que permite:

- Colocar capturas de pantalla reales sobre modelos 3D de dispositivos (iPhone, iPad, Mac, Watch).
- Ajustar materiales PBR (roughness, metalness), entornos HDRI y sombras de contacto (SSAO/Bloom/DoF).
- Animar cámara y dispositivo con una *timeline* cinemática (curvas Bézier, easings, *camera actions*).
- Exportar PNG/JPG de alta resolución y previsualizar video con un *HUD* flotante.
- Girar el dispositivo en escena, pintar anotaciones sobre el *canvas*, y alternar vista ortogonal/perspectiva.

Su objetivo es democratizar el diseño 3D profesional, llevando la potencia de herramientas como **Rotato** al navegador y al móvil.

---

## 🗂️ Estructura del repositorio

Monorepo pnpm con un único paquete de aplicación (`@workspace/mockup-studio`) ubicado en `artifacts/mockup-studio/`:

```bash
.
├── README.md                  ← este archivo
├── package.json               ← scripts del workspace raíz
├── pnpm-workspace.yaml        ← catálogo de versiones y paquete único
├── tsconfig.base.json
└── artifacts/
    └── mockup-studio/         ← la aplicación web (Vite + React 19)
        ├── README.md          ← descripción de producto y roadmap
        ├── PERFORMANCE_OPTIMIZATION.md  ← guía de optimización 3D
        ├── index.html
        ├── vite.config.ts
        ├── components.json
        └── src/
            ├── App.tsx             ← composición principal (canvas + paneles + timeline)
            ├── main.tsx            ← entrypoint
            ├── store.tsx           ← estado global (Context + Reducer)
            ├── types.ts            ← tipos compartidos
            ├── index.css           ← tokens Tailwind 4
            ├── test/setup.ts       ← setup global de Vitest
            │
            ├── components/
            │   ├── canvas/         ← capa R3F
            │   │   ├── Canvas.tsx
            │   │   └── AnnotateCanvas.tsx
            │   ├── devices3d/      ← modelos PBR de dispositivos
            │   │   ├── Device3DViewer.tsx
            │   │   ├── GLBDeviceModel.tsx
            │   │   ├── IPhone13ProGLBModel.tsx
            │   │   ├── Phone3DModel.tsx
            │   │   ├── Tablet3DModel.tsx
            │   │   ├── MacBook3DModel.tsx
            │   │   ├── Watch3DModel.tsx
            │   │   ├── DeviceLabels.tsx
            │   │   ├── WebGLFallback.tsx
            │   │   ├── useScreenTexture.ts
            │   │   ├── textureGlobal.ts
            │   │   └── viewer/     ← PostFX + performance adapter
            │   ├── layout/         ← chrome de la app
            │   │   ├── TopHeader.tsx
            │   │   ├── MobileNavigation.tsx
            │   │   └── ExportSheet.tsx
            │   ├── panels/         ← inspector y propiedades
            │   │   ├── LeftPanel.tsx
            │   │   ├── RightPanel.tsx
            │   │   ├── left/       ← tabs del panel izquierdo
            │   │   ├── right/      ← tabs del panel derecho
            │   │   └── tabs.ts
            │   ├── timeline/       ← editor de keyframes
            │   │   └── MovieTimeline.tsx
            │   └── ui/             ← primitives (Radix + tailwind)
            │       ├── FloatingToolbar.tsx
            │       ├── GridOverlay.tsx
            │       ├── DeviceThumbnails.tsx
            │       ├── PanelUI.tsx
            │       ├── PropertyTooltip.tsx
            │       └── …           ← primitives de shadcn/ui
            │
            ├── hooks/              ← hooks reutilizables
            │   ├── use-mobile.tsx
            │   ├── use-toast.ts
            │   ├── useGlobalShortcuts.ts
            │   ├── useNavigation.ts
            │   ├── usePropertyEditor.ts
            │   └── useWindowListeners.ts
            ├── data/               ← datos estáticos / catálogos
            │   ├── devices.ts
            │   ├── backgrounds.ts
            │   ├── backgroundAssets.ts
            │   ├── lightOverlays.ts
            │   ├── envIcons.tsx
            │   └── panelConstants.ts
            ├── lib/
            │   └── utils.ts        ← Helpers compartidos (cn, etc.)
            ├── utils/
            │   ├── performance.ts  ← device profile + adaptative config
            │   └── panelUtils.ts
            └── pages/
                └── not-found.tsx
```

Los directorios `__tests__/` contienen tests unitarios co-localizados con cada módulo (`vitest` + `@testing-library/react`).

---

## 🚀 Cómo empezar

### 1. Requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm i -g pnpm`)

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Levantar el servidor de desarrollo

```bash
pnpm dev
# → http://localhost:5173
```

`pnpm dev` se delega al paquete `@workspace/mockup-studio` y abre Vite en `localhost:5173` con HMR.

### 4. Compilar para producción

```bash
pnpm build        # build optimizado a artifacts/mockup-studio/dist/public
pnpm serve        # sirve el build localmente para validar
```

### 5. Verificar tipos

```bash
pnpm typecheck
```

### 6. Correr los tests

Los tests viven dentro del paquete `mockup-studio` (Vitest + jsdom):

```bash
cd artifacts/mockup-studio
pnpm test         # una sola corrida
pnpm test:watch   # modo watch (TDD)
```

Cobertura actual de tests (ver `__tests__/`):

- `useGlobalShortcuts` (atajos globales de teclado)
- `snapTimelineTime` y `MovieTimeline` (timeline cinemática)
- `time formatters`
- `panelConstants.integrity` (catálogo de paneles)
- `store.test.tsx` (estado global)

---

## 🎬 Características

### Renderizado 3D

- **Modelos PBR** para iPhone 13 Pro (GLB), iPhone, iPad, MacBook y Watch.
- **Materiales editables**: roughness, metalness, color, etc.
- **Iluminación HDRI** con presets (Softbox, Outdoor, Minimalist).
- **Sombras de contacto (SSAO)** + Bloom + Depth of Field.
- **Adaptación automática** al dispositivo (ver `PERFORMANCE_OPTIMIZATION.md`).
- **Detección robusta de WebGL** con fallback a `WebGLFallback`.

### Timeline cinemática

- Curvas Bézier y easings (Expo, Back, Custom).
- *Camera Actions* predefinidos (Macro Detail, Cenital Orbit, Whip Pan, …).
- Snap temporal y *HUD* flotante con controles de reproducción.
- Integración con `useGlobalShortcuts` (Space, ⌘Z, G, …).

### Capturas y anotaciones

- Drag & drop de PNG/JPG directamente al *canvas*.
- `AnnotateCanvas` permite dibujar anotaciones sobre la escena.
- Conversión a `blob:` URL para evitar *CORS* al re-exportar.
- Captura vía `thum.io` con selección de viewport.

### UI

- Inspector a la derecha (Device, Lighting, Camera, Export, …).
- Panel a la izquierda con tabs contextuales.
- Top header responsive + MobileNavigation en pantallas pequeñas.
- Theming: Tailwind 4 con tokens CSS y *glassmorphism*.
- Toasts, dialogs, sheets y primitives `shadcn/ui` (Radix).

---

## 🧰 Stack técnico

| Capa            | Tecnología                                                         |
| --------------- | ------------------------------------------------------------------ |
| UI              | React 19 + TypeScript, Radix UI, Tailwind 4 (`@tailwindcss/vite`) |
| 3D              | Three.js · `@react-three/fiber` · `@react-three/drei`             |
| Post-processing | `@react-three/postprocessing` (SSAO, Bloom, DoF, ToneMap)          |
| Animación       | Framer Motion + timeline propia con curvas Bézier                  |
| Estado / datos  | Context + Reducer, `@tanstack/react-query`                         |
| Validación      | `zod` · `react-hook-form`                                          |
| Tooling         | Vite 7, pnpm workspaces, Vitest, jsdom                             |
| Iconos          | `lucide-react`, `react-icons`                                      |

Versiones exactas en [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) (catálogo).

---

## 🛣️ Roadmap

- ✅ Materiales PBR y biblioteca HDRI
- ✅ Curvas Bézier y *Camera Actions* profesionales
- ✅ Sombras de contacto (SSAO)
- ✅ *HUD* flotante de reproducción de video
- ✅ Detección y *fallback* de WebGL en mobile
- ⏳ Live Figma / Prototyping Sync
- ⏳ IA Scene Architect (generación por prompt)
- ⏳ Exportación de video con canal alfa
- ⏳ Captura 4K y orquestación multi-dispositivo

> Detalle completo del producto en [`PERFORMANCE_OPTIMIZATION.md`](./PERFORMANCE_OPTIMIZATION.md) y en el [`README`](../../README.md) raíz.

---

## 🤝 Contribución

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/mi-cambio
   ```
2. Antes de pedir review asegúrate de pasar:
   ```bash
   pnpm typecheck
   cd artifacts/mockup-studio && pnpm test
   ```
3. Abre un PR describiendo **qué** cambia y **por qué**. Incluye capturas si tocas UI o el render 3D.
4. No commitees `dist/`, `node_modules/` ni archivos temporales.

---

## 📄 Licencia

MIT © Mockup Studio Pro contributors.
