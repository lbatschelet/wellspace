## Releases (automatisiert via GitHub Actions)

### Ziel
Ein **Git-Tag** `vX.Y.Z` ist die einzige Release-Quelle. GitHub Actions:
- baut die Frontends (brand-aware),
- aktualisiert die Deploy-Branches (`deploy/wohlopti`, `deploy/feelvonroll`),
- erstellt einen **GitHub Release** mit automatisch generierten Release Notes,
- und die UIs zeigen unten **`Version: vX.Y.Z`** an (über `VITE_APP_VERSION`).

### So erstellst du einen Release

1) Sicherstellen, dass `main` den gewünschten Stand hat.

2) Tag erstellen & pushen:

```bash
git checkout main
git pull
git tag v1.2.3
git push origin v1.2.3
```

3) Fertig. Der Workflow `Release (tag → build + deploy + GitHub Release)` läuft automatisch los.

### Versionsanzeige in der App
- **Admin**: Footer zeigt `Version: ...`
- **Viewer**: About/Info-Overlay zeigt `Version: ...`

### Hinweise
- Für Pre-Releases könnt ihr Tags wie `v1.2.3-rc.1` verwenden (Workflow triggert ebenfalls auf `v*`).
- Wenn ihr später den Versions-Bump inkl. Tag komplett automatisch wollt, können wir z.B. **release-please** oder **changesets** einführen (optional).

