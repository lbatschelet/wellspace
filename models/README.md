WohlOpti model assets for the public viewer.

The viewer loads **`floor_0.glb`** only. Materials, textures, and transparency (`d` / alphaMode BLEND) are baked in at conversion time.

## Files in this folder

| File | Role |
|------|------|
| `floor_0.glb` | Runtime 3D model (~50 MB, pushable) |
| `Strassennamen.mtl` | Material catalog for the OBJ export (reference / re-build) |
| `.gitignore` | `*.obj` excluded (>100 MB GitHub limit) |

## Source export (local, not in git)

- `Strassennamen.obj` + `.mtl` + texture folder (meters, street names update)
- Semi-transparent materials via MTL `d` (e.g. `_auto_69` 0.2, `basket` 0.56, `Metal_Cladding_01_1K` 0.5)
- 11 embedded textures in the GLB (PNG/JPG from export zip)

## Rebuild pipeline (from repo root)

```bash
# 1) Unzip into:
#    model-pipeline/campus/03_export_obj/floor_0/latest/
# 2) Strip `g` lines (obj2gltf):
#    awk '!/^g /' Strassennamen.obj > Strassennamen_nogroups.obj
#    mv nogroups over .obj (keep only one .obj in latest/)
# 3) Fix MTL line endings if needed: sed -i '' $'s/\r$//' *.mtl
# 4) Build + copy:
SIMPLIFY_RATIO=0.25 ./model-pipeline/campus/tools/convert_floor_obj_to_glb.sh floor_0
BRAND=wohlopti ./model-pipeline/campus/tools/copy_glb_to_webapp.sh floor_0
```

Latest build: **2026-06-08** — `Strassennamen`, simplify 0.25, 5 BLEND materials.
