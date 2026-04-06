# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### Mockup Studio (`artifacts/mockup-studio`)
A device mockup creator web app inspired by PostSpark.app. Built with React + Vite, Framer Motion, and html2canvas.

**Features:**
- 6 device frames: iPhone 15 Pro, Android Phone, iPad, MacBook, Browser (Chrome-style), Apple Watch
- Portrait & landscape orientation for phones and tablets
- Background types: solid color, 12 gradient presets, 6 mesh gradients, 3 patterns, custom image upload
- Canvas transform: scale, rotation, shadow intensity
- 3D perspective tilt (X/Y axes)
- Animations: float, pulse, spin, slide-in
- Draggable text overlays with styling
- 6 preset templates (App Store, Twitter Banner, Product Hunt, LinkedIn, Instagram, Dark Mode)
- PNG export with 4 size options (1:1, 4:5, 16:9, 9:16)

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
