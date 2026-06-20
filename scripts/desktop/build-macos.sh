#!/usr/bin/env bash
# macOS Universal Binary — output: download/mac/AI-Commerce.dmg
# Must run on macOS (GitHub Actions: macos-latest)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/apps/desktop"

run_pkg() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm run "$1"
  else
    npm run "$1"
  fi
}

echo "Building AI Commerce Desktop (macOS Universal)..."
run_pkg build
pnpm exec tauri build --target universal-apple-darwin 2>/dev/null || \
  npx tauri build --target universal-apple-darwin

OUT_DIR="$ROOT/download/mac"
mkdir -p "$OUT_DIR"

DMG="$(find "$ROOT/apps/desktop/src-tauri/target" -name 'AI-Commerce*.dmg' -print -quit)"
if [[ -z "$DMG" ]]; then
  DMG="$(find "$ROOT/apps/desktop/src-tauri/target" -name '*.dmg' -print -quit)"
fi

if [[ -n "$DMG" ]]; then
  cp "$DMG" "$OUT_DIR/AI-Commerce.dmg"
  echo "Output: download/mac/AI-Commerce.dmg"
else
  echo "No DMG artifact found" >&2
  exit 1
fi
