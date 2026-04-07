#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./unpack_floor_export_zip_to_latest.sh floor_0 [optional-zip-path]
#
# If zip path is omitted, the script picks the newest zip in:
#   02_export_obj_zip/ matching "${floor}_export_*.zip"
#
# Output:
#   03_export_obj/<floor>/latest/ (cleared and re-created)

FLOOR_INDEX="${1:-}"
ZIP_PATH="${2:-}"
if [[ -z "$FLOOR_INDEX" ]]; then
  echo "Missing floor index (e.g. floor_0)"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

EXPORT_DIR="$ROOT_DIR/02_export_obj_zip"
OBJ_DIR="$ROOT_DIR/03_export_obj/$FLOOR_INDEX/latest"

if [[ -z "$ZIP_PATH" ]]; then
  ZIP_PATH="$(ls -1 "$EXPORT_DIR"/"${FLOOR_INDEX}_export_"*.zip 2>/dev/null | sort | tail -n 1 || true)"
fi

if [[ -z "$ZIP_PATH" || ! -f "$ZIP_PATH" ]]; then
  echo "Zip not found for floor: $FLOOR_INDEX"
  echo "Expected in $EXPORT_DIR as ${FLOOR_INDEX}_export_*.zip"
  exit 1
fi

echo "Unpacking:"
echo "  ZIP: $ZIP_PATH"
echo "  OUT: $OBJ_DIR"

rm -rf "$OBJ_DIR"
mkdir -p "$OBJ_DIR"

unzip -q "$ZIP_PATH" -d "$OBJ_DIR"

echo "Done."

