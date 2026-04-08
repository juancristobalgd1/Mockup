# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### Mockup Studio (`artifacts/mockup-studio`)
A professional 3D device mockup creator styled after Rotato (rotato.app). Built with React + Vite + React Three Fiber / Three.js.

**Features:**
- 3D GLB device models: iPhone 17 Pro, iPhone 16, MacBook Pro, Samsung S25 Ultra, OnePlus 12, iPad Pro, iPad Mini, Apple Watch
- Rotato dark theme: full dark UI with macOS traffic light dots, pill-mode selector, collapsible sections
- Device frame colors: Titanium, Black, White, Blue, Natural Light, Desert, Sierra, Clay
- Portrait & landscape orientation for phones and tablets
- Background types: solid color, gradients, mesh gradients, wallpapers, patterns, custom image upload
- Auto background: extracts dominant colors from screenshot → mesh gradient
- Color overlay: tint + opacity over any background
- Canvas aspect ratio guide: Free / 1:1 / 4:5 / 16:9 / 9:16
- **Canvas corner radius** — rounded canvas shape for exports
- **Device scale** — scale device 40–160%
- **Floor Reflection** — Rotato-style MeshReflectorMaterial mirror floor with strength control
- **Film Grain** — SVG fractalNoise overlay with intensity control
- **Bloom control** — adjust screen glow bloom intensity
- Lighting controls: Brightness, Ambient, Warmth, Reflections (IBL), Exposure
- Environment presets: Studio, Warehouse, Sunset, City, Forest, Night (HDR)
- Camera presets: Hero, Front, Side, Top
- Contact shadow intensity
- Auto Rotate + Float animation
- **Movie mode**: timeline editor for camera animation with keyframes, WebM export
- Draggable text overlays with font size, color, bold, italic
- 8 preset templates
- PNG export, Copy to Clipboard, 6 export size options

**3D Device Screen Rendering — DO NOT MODIFY:**
- iPhone 17 Pro: `skipOverlay: true` + `screenMeshName: 'Object_55'` — screen is the "Display" mesh (GLB node Object_55). Uses `markScreenByName` for direct lookup. Material name detection + geometric fallback are bypassed intentionally.
- iPhone 16: uses the default ScreenOverlay plane (no `skipOverlay`, no `screenMeshName`). Do not add these flags.
- These configs are confirmed working. Any future device work must not alter the iPhone 17 Pro or iPhone 16 screen logic in `GLBDeviceModel.tsx` or `devices.ts`.

**Stack:** React 18, Vite, Framer Motion, html2canvas, Tailwind CSS v4, shadcn/ui
**State:** React Context (no backend/persistence needed)
**Key files:**
- `src/store.tsx` — global state (AppProvider + useApp hook)
- `src/components/devices/` — CSS-only device frames
- `src/components/canvas/Canvas.tsx` — main canvas with background + device rendering
- `src/components/panels/LeftPanel.tsx` — control sidebar
- `src/components/panels/RightPanel.tsx` — export panel
- `src/data/backgrounds.ts` — gradient/mesh/pattern/preset data

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
