# Mockup Studio Pro

> Plataforma de creación de **mockups 3D de alta fidelidad** directamente en el navegador. PBR, HDRI, post-processing y una timeline cinematográfica para producir imágenes y videos listos para marketing — sin salir de la web.

![status](https://img.shields.io/badge/status-active-success)
![stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Three.js-blue)
![license](https://img.shields.io/badge/license-MIT-green)

---

## 📌 ¿Qué es?

**Mockup Studio Pro** es una aplicación web (PWA-ready) que permite:

- Colocar capturas de pantalla reales sobre modelos 3D de dispositivos (iPhone, iPad, Mac, Watch).
- Ajustar materiales PBR (roughness, metalness), entornos HDRI y sombras de contacto (SSAO).
- Animar cámara y dispositivo con una *timeline* cinemática (curvas Bézier, easings, *camera actions*).
- Exportar PNG/JPG de alta resolución y secuencias para video.

Su objetivo: democratizar el diseño 3D profesional, llevando la potencia de herramientas como **Rotato** al navegador y al móvil.

---

## 🗂️ Estructura del repositorio

Este repo es un **monorepo pnpm** con un solo paquete de aplicación:

```bash
.
├── README.md                  ← este archivo
├── package.json               ← scripts del workspace
├── pnpm-workspace.yaml        ← catálogo y paquetes
├── tsconfig.base.json
└── artifacts/
    └── mockup-studio/         ← la aplicación web
        ├── README.md          ← detalle de producto y roadmap
        ├── index.html
        ├── vite.config.ts
        └── src/
            ├── App.tsx
            ├── main.tsx
            ├── store.tsx
            ├── components/
            │   ├── canvas/        ← Three.js / R3F
            │   ├── devices3d/     ← modelos y materiales
            │   ├── layout/        ← header, sheets, navegación
            │   ├── panels/        ← inspector de propiedades
            │   ├── timeline/      ← editor dekeyframes
            │   └── ui/            ← primitives (Radix + tailwind)
            ├── hooks/
            ├── data/
            ├── lib/
            ├── utils/
            └── pages/
```

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

El script `pnpm dev` se delega al paquete `@workspace/mockup-studio` y abre Vite con HMR sobre `0.0.0.0` (útil para probarlo en tu teléfono en la misma red).

### 4. Compilar para producción

```bash
pnpm build        # build optimizado a artifacts/mockup-studio/dist
pnpm serve        # sirve el build localmente para validar
```

### 5. Verificar tipos

```bash
pnpm typecheck
```

---

## 💡 Ejemplo de uso: crear un mockup cinematográfico en 5 pasos

> *Escenario: lanzar una landing page y necesitas un mockup hero del iPhone mostrando la app.*

1. **Carga la captura** — Arrastra `landing-hero.png` al canvas. La app la proyecta automáticamente sobre la pantalla del dispositivo activo.
2. **Elige el dispositivo** — En el panel *Inspector*, abre *Device* y selecciona **iPhone 16** (incluye PBR con roughness + metalness ajustables).
3. **Cambia el entorno** — En *Lighting*, prueba `Softbox HDRI` para un look limpio o `Outdoor` para algo más orgánico. Verás los reflejos actualizarse en tiempo real.
4. **Anima la cámara** — En la *Timeline*, añade un *Camera Action* `Cenital Orbit` y ajusta la duración a 4 s con easing `Expo.out`. Pulsa **Play** para previsualizar.
5. **Exporta** — Click en el botón **Export** → elige `PNG @2x`. Obtendrás una imagen lista para hero, redes o App Store.

> Tip: `⌘ Z` / `Ctrl Z` deshacen cambios; `G` alterna la cuadrícula; mantén `Space` para orbitar manualmente la cámara.

---

## 🧰 Stack técnico

| Capa            | Tecnología                                              |
| --------------- | ------------------------------------------------------- |
| UI              | React 19 + TypeScript, Radix UI, Tailwind 4             |
| 3D              | Three.js · `@react-three/fiber` · `@react-three/drei`  |
| Post-processing | `@react-three/postprocessing` (SSAO, Bloom, ToneMap)   |
| Animación       | Framer Motion + timeline propia con curvas Bézier       |
| Estado / datos  | Context + Reducer, `@tanstack/react-query`              |
| Tooling         | Vite 7, pnpm workspaces, `tsx`, `zod`                   |

---

## 🛣️ Roadmap (resumen)

- ✅ Materiales PBR y biblioteca HDRI
- ✅ Curvas Bézier y *Camera Actions* profesionales
- ✅ Sombras de contacto (SSAO)
- ⏳ Live Figma / Prototyping Sync
- ⏳ IA Scene Architect (generación por prompt)
- ⏳ Exportación de video con canal alfa
- ⏳ Captura 4K y orquestación multi-dispositivo

> Detalle completo en [`artifacts/mockup-studio/README.md`](./artifacts/mockup-studio/README.md).

---

## 🤝 Contribución

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/mi-cambio
   ```
2. Asegúrate de pasar `pnpm typecheck` antes de pedir review.
3. Abre un PR describiendo **qué** cambia y **por qué**. Incluye capturas si tocas UI o el render 3D.
4. No commitees `dist/`, `node_modules/` ni archivos temporales.

---

## 📄 Licencia

MIT © Mockup Studio Pro contributors.
