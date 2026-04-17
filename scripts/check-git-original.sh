#!/usr/bin/env bash
set -e
cd /vercel/share/v0-project
echo "=== HEAD~5 useScreenTexture ==="
git log --oneline -- artifacts/mockup-studio/src/components/devices3d/useScreenTexture.ts | head -20
echo ""
echo "=== Original (before my changes) ==="
FIRST_COMMIT=$(git log --oneline -- artifacts/mockup-studio/src/components/devices3d/useScreenTexture.ts | tail -1 | awk '{print $1}')
git show "$FIRST_COMMIT":artifacts/mockup-studio/src/components/devices3d/useScreenTexture.ts || true
