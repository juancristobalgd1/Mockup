# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### Mockup Studio (`artifacts/mockup-studio`)
A device mockup creator web app inspired by PostSpark.app. Built with React + Vite, Framer Motion, and html2canvas.

**Features:**
- 7 device frames: iPhone 15 Pro, Android Phone, iPad, MacBook, iMac, Browser (Chrome-style), Apple Watch
- iPhone 15 Pro color variants: Titanium, Black, White, Blue
- Browser frame Dark/Light mode toggle
- Portrait & landscape orientation for phones and tablets
- Background types: solid color, 12 gradient presets, 6 mesh gradients, 12 wallpapers, 3 patterns, custom image upload
- Auto background: extracts dominant colors from uploaded screenshot → mesh gradient
- Shuffle button: randomizes background from current type
- Background overlay: color tint + opacity over any background
- Canvas transform: scale, rotation, 3D tilt (X/Y axes), canvas padding
- Canvas aspect ratio guide: Free / 1:1 / 4:5 / 16:9 / 9:16 (dashed overlay)
- Advanced shadow: None / Spread / Hug styles + Intensity + Direction (angle slider)
- Animations: float, pulse, spin, slide-in
- Draggable text overlays with font size, color, bold, italic controls
- 8 preset templates
- PNG export: Download + Copy to Clipboard, 4 size options

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
