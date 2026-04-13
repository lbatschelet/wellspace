## Campus 3D Modell-Pipeline (Sweet Home 3D -> OBJ -> glTF/GLB -> Webapp)

Ziel:
- Reproduzierbarer Workflow mit klaren Ordnern für Eingaben/Outputs
- Trackbarkeit pro Export-Iteration (Zeitstempel + Manifest)
- Einfaches Einbinden in die Webapp unter `feelvonroll-webapp/public/models/`

Aktuell:
- Die Webapp lädt **pro Stockwerk** eine GLB-Datei unter `feelvonroll-webapp/public/models/` (z. B. `floor_-2.glb` … `floor_3.glb`); siehe `floorIndex`→URL-Mapping in `feelvonroll-webapp/src/main.js`.
- Mindestens `floor_0.glb` sollte als Basis vorhanden sein; fehlende Stockwerke werden übersprungen bzw. es gibt einen Procedural-Fallback.
- Quelldateien im Repo: z. B. **`floor_0.sh3d`** pro Stockwerk **oder** ein kombiniertes **`vonRoll.sh3d`** (je nach Arbeitsweise); die nummerierte Namenskonvention `floor_<index>.sh3d` bleibt die Referenz für die Skripte.

Wichtiger Hinweis zur Ausrichtung (Pin-Platzierung):
- In eurem Code wird beim Raycast/Pin-Platzieren aktuell als Ebene `Y = building.getFloorSlabTopY(floorIndex)` verwendet.
- Für den glTF-Provider ist der Slab-Top aktuell standardmäßig `0`, **wenn** im glTF kein Node/Objekt `slabTop` gefunden wird.
- Deshalb: Export so ausrichten, dass die “Slab top”-Ebene für dein erstes Stockwerk bei **Y=0** liegt.

Ordnerstruktur (alles in diesem Repo):
- `01_sweethome_src/`      -> Sweet Home 3D Projektdateien (pro Stockwerk)
- `02_export_obj_zip/`     -> Export-Zips (OBJ + MTL + ggf. Texturen)
- `03_export_obj/`         -> Unzipte OBJ-Ausgaben pro Floor
- `04_build_glb/`          -> Generierte GLB-Dateien pro Floor
- `tools/`                 -> kleine Hilfsskripte für Konvertierung
- `05_notes/`             -> laufende Notizen/Checks

## 1) Sweet Home 3D: Stockwerk anlegen
Lege pro Stockwerk eine eigene SH3D-Quelldatei ab:
- `model-pipeline/campus/01_sweethome_src/floor_0.sh3d`
- `model-pipeline/campus/01_sweethome_src/floor_-1.sh3d`
- usw.

Naming-Regel:
- Exakt `floor_<index>.sh3d` (Index = wie im Webapp `floorButtons`, also z.B. `-2`, `-1`, `0`, ...)

## 2) Export aus Sweet Home 3D: OBJ (+ MTL)
Sweet Home 3D exportiert 3D-Designs als **OBJ** (inkl. passender `.mtl`).

Workflow:
1. Öffne `floor_0.sh3d`
2. Export als OBJ (erzeugt i.d.R. `*.obj` + `*.mtl` + ggf. Texturen)
3. Lege danach die Export-Dateien in einen Export-Ordner und zippe sie:

Beispiel-Ziel:
- `model-pipeline/campus/02_export_obj_zip/floor_0_export_YYYYMMDD_HHMM.zip`

Wichtig:
- Zip sollte **alles zusammen** enthalten, was `floor_0.obj` braucht (inkl. `floor_0.mtl` und Texturbilder falls vorhanden).

## 3) Unzipten
Optional automatisiert (empfohlen):

```bash
./model-pipeline/campus/tools/unpack_floor_export_zip_to_latest.sh floor_0
```

Das schreibt nach:
- `model-pipeline/campus/03_export_obj/floor_0/latest/`

## 4) OBJ -> GLB Konvertierung
Verwende das Script:

```bash
./model-pipeline/campus/tools/convert_floor_obj_to_glb.sh floor_0
```

Voraussetzungen:
- Node.js installiert
- `npx obj2gltf` verfügbar (wird via npx nachgeladen; Version im Script gepinnt)

Das Script:
1. ruft `obj2gltf` auf und schreibt nach `04_build_glb/<floor>.glb`
2. führt optional **Mesh-Optimierung** aus (`tools/optimize_glb.mjs`: weld/dedup; optional Vereinfachung mit `SIMPLIFY_RATIO=0.65 ./tools/convert_floor_obj_to_glb.sh floor_0`)

Output:
- `model-pipeline/campus/04_build_glb/floor_0.glb`

## 5) Einbinden in die Webapp
Optional automatisiert:

```bash
./model-pipeline/campus/tools/copy_glb_to_webapp.sh floor_0
```

Manuell (entspricht exakt dem Script):
- `model-pipeline/campus/04_build_glb/floor_0.glb`
  nach `feelvonroll-webapp/public/models/floor_0.glb`

Danach:
- Webapp neu laden

## 6) Trackbarkeit (Manifest)
Dieses Repo enthält ein einfaches Manifest:
- `model-pipeline/campus/05_notes/manifest.md`

Bitte nach jedem erfolgreichen Export einmal notieren:
- Datum/Uhrzeit
- Quelldatei (SHA optional, falls gewünscht)
- Zip-Name
- GLB-Dateiname
- Besonderheiten (z.B. “SlabTop Y=0 bestätigt”)

Beispiel-Eintrag:
```
2026-02-xx 14:30
floor_0.sh3d -> floor_0_export_2026...zip -> floor_0.glb
Check: Pins platziert auf korrekter Ebene (Y=0)
```

## Optional: Später “full vs low walls”
Wenn wir später den glTF Provider erweitern, brauchen wir ein Layer/Tagging im Modell.
Vorschlag:
- Objekt/Material-Namen enthalten `walls_full` vs `walls_low`
- ggf. zusätzlich `floor_<index>` Gruppen

