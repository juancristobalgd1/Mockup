# Mockup Creators Pro — Workspace

Monorepo pnpm que contiene el proyecto **Mockup Studio Pro**: una plataforma web para crear mockups 3D de alta fidelidad con materiales PBR, HDRI, post-processing y una timeline cinematográfica.

![status](https://img.shields.io/badge/status-active-success)
![stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Three.js-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![pnpm](https://img.shields.io/badge/package_manager-pnpm-orange)

---

## 📦 Paquetes

Este workspace define un único paquete (`pnpm-workspace.yaml` → `packages: [artifacts/mockup-studio]`):

| Paquete                  | Path                       | Descripción                                                      |
| ------------------------ | -------------------------- | ---------------------------------------------------------------- |
| `@workspace/mockup-studio` | `artifacts/mockup-studio/` | App Vite + React 19 + Three.js con timeline, paneles y export. Detalle en su propio [README](./artifacts/mockup-studio/README.md). |

El catálogo de versiones (`pnpm-workspace.yaml`) fija React 19, Three.js, Tailwind 4, Vite 7, Vitest y el resto de dependencias compartidas.

---

## 🚀 Scripts del workspace

Ejecuta desde la raíz (`/Users/jc/.qaap/workspaces/juancristobalgd1/Mockup`):

| Script               | Qué hace                                                                   |
| -------------------- | -------------------------------------------------------------------------- |
| `pnpm install`       | Instala todo el workspace.                                                 |
| `pnpm dev` / `pnpm start` | Levanta Vite en `http://localhost:5173` con HMR.                      |
| `pnpm build`         | Compila `artifacts/mockup-studio` a `dist/public`.                         |
| `pnpm typecheck`     | Corre `tsc --noEmit` (excluyendo `vite.config.ts`).                        |

> Los comandos live con PID (`pnpm dev`, etc.) los gestiona Qaap en su terminal dedicada con *hot reload*. Las shells efímeras solo deben correr comandos de una pasada (install, build, typecheck, test).

Dentro de `artifacts/mockup-studio/` también hay scripts específicos:

| Script              | Qué hace                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`          | Vite dev server (`http://localhost:5173`).                                |
| `pnpm build`        | Build de producción a `dist/public`.                                      |
| `pnpm serve`        | Sirve el build localmente para validación.                                |
| `pnpm typecheck`    | `tsc -p tsconfig.json --noEmit`.                                          |
| `pnpm test`         | Corre Vitest (jsdom) una sola vez.                                        |
| `pnpm test:watch`   | Vitest en modo watch.                                                     |

---

## 📁 Estructura

```
.
├── README.md                       ← este archivo (overview del monorepo)
├── package.json                    ← scripts delegan al paquete mockup-studio
├── pnpm-workspace.yaml             ← catálogo y paquetes
├── tsconfig.base.json
├── attached_assets/                ← assets globales (imágenes HDRI, modelos)
└── artifacts/
    └── mockup-studio/              ← la app
        ├── README.md               ← descripción + roadmap
        ├── PERFORMANCE_OPTIMIZATION.md ← guía de render adaptativo
        ├── index.html
        ├── vite.config.ts
        ├── components.json
        ├── public/
        └── src/                    ← código fuente
            ├── App.tsx
            ├── main.tsx
            ├── store.tsx
            ├── types.ts
            ├── components/         ← canvas, devices3d, layout, panels, timeline, ui
            ├── hooks/              ← useGlobalShortcuts, useNavigation, etc.
            ├── data/               ← catálogos (devices, backgrounds, …)
            ├── utils/              ← performance + panelUtils
            ├── lib/                ← helpers compartidos
            ├── test/               ← setup global de tests
            └── pages/
```

---

## 🎬 ¿Qué se puede hacer?

Mockup Studio Pro permite:

- Colocar capturas reales sobre modelos 3D (iPhone, iPad, MacBook, Watch).
- Editar materiales PBR (roughness, metalness, color) y entornos HDRI.
- Animar cámara y dispositivo con curvas Bézier y *camera actions*.
- Controlar la reproducción con un *HUD* flotante y atajos globales.
- Pintar anotaciones sobre el *canvas* y exportar a PNG/JPG.
- Girar el dispositivo en escena, activar vista ortogonal, etc.

Ver el detalle completo en [`artifacts/mockup-studio/README.md`](./artifacts/mockup-studio/README.md).

---

## 🧰 Stack técnico

| Capa            | Tecnología                                                         |
| --------------- | ------------------------------------------------------------------ |
| UI              | React 19 + TypeScript, Radix UI, Tailwind 4 (`@tailwindcss/vite`) |
| 3D              | Three.js · `@react-three/fiber` · `@react-three/drei`             |
| Post-processing | `@react-three/postprocessing` (SSAO, Bloom, DoF, ToneMap)          |
| Animación       | Framer Motion + timeline propia con curvas Bézier                  |
| Estado          | Context + Reducer, `@tanstack/react-query`                         |
| Validación      | `zod` · `react-hook-form`                                          |
| Tooling         | Vite 7, pnpm workspaces, Vitest, jsdom                             |
| Iconos          | `lucide-react`                                                     |

Versiones exactas en [`pnpm-workspace.yaml`](./pnpm-workspace.yaml).

---

## 🛣️ Roadmap resumido

Resumen ejecutivo (detalle en el README del paquete):

- ✅ Materiales PBR y biblioteca HDRI
- ✅ Sombras de contacto (SSAO) + Bloom + DoF adaptativo
- ✅ Curvas Bézier y *Camera Actions* profesionales
- ✅ *HUD* flotante de reproducción de video
- ✅ Detección robusta de WebGL en mobile con fallback
- ⏳ Live Figma / Prototyping sync
- ⏳ IA Scene Architect (generación por prompt)
- ⏳ Exportación de video con canal alfa

---

## 🤝 Contribución

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/mi-cambio
   ```
2. Antes del PR, verifica:
   ```bash
   pnpm typecheck
   cd artifacts/mockup-studio && pnpm test
   ```
3. Abre PR con descripción clara de **qué** cambia y **por qué**. Adjunta capturas si la UI o el render 3D cambiaron.

---

## 📄 Licencia

MIT.
