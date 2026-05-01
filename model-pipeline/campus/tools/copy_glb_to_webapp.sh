#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./copy_glb_to_webapp.sh floor_0

FLOOR_INDEX="${1:-}"
if [[ -z "$FLOOR_INDEX" ]]; then
  echo "Missing floor index (e.g. floor_0)"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_GLB="$ROOT_DIR/04_build_glb/${FLOOR_INDEX}.glb"
DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)/brands/feelvonroll/viewer/public/models"
DEST_GLB="$DEST_DIR/${FLOOR_INDEX}.glb"

if [[ ! -f "$SRC_GLB" ]]; then
  echo "GLB not found: $SRC_GLB"
  exit 1
fi

mkdir -p "$DEST_DIR"
cp -f "$SRC_GLB" "$DEST_GLB"
echo "Copied:"
echo "  $SRC_GLB"
echo "  -> $DEST_GLB"

