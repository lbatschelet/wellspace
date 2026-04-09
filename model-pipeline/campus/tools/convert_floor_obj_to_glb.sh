#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./convert_floor_obj_to_glb.sh floor_0
#
# Expects:
# - 03_export_obj/floor_0/latest/ contains:
#     - an OBJ file (any *.obj, usually floor_0.obj)
#     - a corresponding MTL + texture images (if used)
#
# Writes:
# - 04_build_glb/floor_0.glb
#
# Notes:
# - This uses `obj2gltf` via npx. Version is pinned for reproducibility.

FLOOR_INDEX="${1:-}"
if [[ -z "$FLOOR_INDEX" ]]; then
  echo "Missing floor index (e.g. floor_0)"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

OBJ_DIR="$ROOT_DIR/03_export_obj/$FLOOR_INDEX/latest"
OUT_DIR="$ROOT_DIR/04_build_glb"
OUT_GLB="$OUT_DIR/${FLOOR_INDEX}.glb"

if [[ ! -d "$OBJ_DIR" ]]; then
  echo "OBJ dir not found: $OBJ_DIR"
  echo "Create it by unzipping the Sweet Home export zip into 03_export_obj/$FLOOR_INDEX/latest/"
  exit 1
fi

OBJ_FILE="$(ls -1 "$OBJ_DIR"/*.obj 2>/dev/null | head -n 1 || true)"
if [[ -z "$OBJ_FILE" ]]; then
  echo "No .obj found in $OBJ_DIR"
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Converting OBJ -> GLB"
echo "  OBJ: $OBJ_FILE"
echo "  OUT: $OUT_GLB"

# Pin obj2gltf version for reproducible output.
npx --yes obj2gltf@3.2.0 -i "$OBJ_FILE" -o "$OUT_GLB"

# Post-process: prune/dedup/weld (+ optional simplify) to reduce draw/vertex load.
# Simplify is controlled via env var:
#   SIMPLIFY_RATIO=0.65 ./tools/convert_floor_obj_to_glb.sh floor_0
# Ratio: 0..1 (e.g. 0.65 keeps ~65% triangles). Lower = faster, more loss.
TMP_GLB="${OUT_GLB%.glb}.opt.glb"
OPT_ARGS=(--weld 0.0001)
if [[ -n "${SIMPLIFY_RATIO:-}" ]]; then
  OPT_ARGS+=(--simplify "$SIMPLIFY_RATIO")
fi
node "$ROOT_DIR/tools/optimize_glb.mjs" "$OUT_GLB" "$TMP_GLB" "${OPT_ARGS[@]}"
if [[ -f "$TMP_GLB" ]]; then
  mv -f "$TMP_GLB" "$OUT_GLB"
fi

echo "Done: $OUT_GLB"

