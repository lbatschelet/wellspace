WohlOpti model assets for the public viewer.

The viewer loads **`floor_0.glb`** only. Materials are baked in at conversion time.

## Files in this folder

| File | Role |
|------|------|
| `floor_0.glb` | Runtime 3D model (~40 MB, pushable) |
| `WohlOpti_Viktoriaplatz_sliced.mtl` | Material catalog for the OBJ export (reference / re-build) |
| `.gitignore` | `*.obj` excluded (>100 MB GitHub limit) |

## Source export (local, not in git)

- `WohlOpti_Viktoriaplatz_sliced.obj` + `WohlOpti_Viktoriaplatz_sliced.mtl` (same folder, meters)
- Y clipped at ~14.7 m, shifted to Y=0
- Texture images (`grille1.png`, …) optional; GLB uses **Kd colors** if images are missing

## Rebuild pipeline (from repo root)

```bash
# 1) Copy OBJ+MTL into:
#    model-pipeline/campus/03_export_obj/floor_0/latest/
# 2) Strip `g` lines if obj2gltf fails (see convert script / awk)
# 3) Build + copy:
SIMPLIFY_RATIO=0.25 ./model-pipeline/campus/tools/convert_floor_obj_to_glb.sh floor_0
BRAND=wohlopti ./model-pipeline/campus/tools/copy_glb_to_webapp.sh floor_0
```

Latest build: **2026-05-21** — `WohlOpti_Viktoriaplatz_sliced` + matching MTL, simplify 0.25.
