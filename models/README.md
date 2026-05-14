WohlOpti model assets for the public viewer.

The viewer is configured for a single floor (`floor_0.glb`) in this brand.

Authoring sources (lokal halten):
- `WohlOpti_ohne_gruen_boden.obj` wird wegen der GitHub-Dateigrössenbegrenzung **nicht** ins Repo committed (siehe `.gitignore`).
- `WohlOpti_ohne_gruen_boden.mtl` / `WohlOpti_alles.mtl` (Material-Exports, im Repo)

Target runtime asset:
- `floor_0.glb` (optimized + simplified)

Current runtime result:
- `floor_0.glb` is generated and reduced to ~51 MB.

Typical pipeline (from repo root):

```bash
# 1) Put your SweetHome/OBJ export under model-pipeline/campus/03_export_obj/floor_0/latest/
# 2) Build optimized GLB:
./model-pipeline/campus/tools/convert_floor_obj_to_glb.sh floor_0
# 3) Copy into this brand:
BRAND=wohlopti ./model-pipeline/campus/tools/copy_glb_to_webapp.sh floor_0
```

Fallback for very large OBJ exports:
- Remove excessive `g` group lines before conversion (keeps geometry, lowers converter memory pressure),
  then run conversion and optimization.
