# Videothek und Freigabe

seez.eu zeigt nur, was ausdrücklich freigegeben ist. Im Quellcode auf GitHub ist alles sichtbar, auf der Website nur das Freigegebene.

## Texte und Seiten (Content Collections)

- Öffentlich ist ein Eintrag nur mit `publicationStatus: published` und ohne `draft: true`. Alles andere ist ein Entwurf, auch ein Eintrag ganz ohne Status.
- Alle Seiten lesen Inhalte über `getPublicCollection()` aus `src/utils/publication.ts`. Neue Seiten sollen das auch tun, nicht `getCollection()`.

## Videothek

| Datei | Zweck |
|---|---|
| `src/data/videothek/catalog.json` | Texte, Bewertungen und Songs aller Filme. Diese Datei macht nichts öffentlich. Neu einlesen mit `pnpm videothek:import`. |
| `src/data/videothek/releases.json` | Die Freigabeliste. Nur Filme, die hier stehen, erscheinen auf der Website, und zwar mit genau den hier festgehaltenen Dateien (sha256). |
| GitHub-Release `videothek-media` | Ablage der freigegebenen Mediendateien. Der Build holt sie von dort nach `dist/videothek/media/`. |

Die Seite `/de/videothek` und der Menüpunkt entstehen erst, wenn mindestens ein Film freigegeben ist.

### Einen Film freigeben

```bash
pnpm videothek:release <id>            # aktuelle lokale Dateien festhalten (noch nichts öffentlich)
pnpm videothek:release <id> --upload   # Dateien ins GitHub-Release laden
# releases.json committen und deployen, dann ist der Film online
```

Eine Freigabe hält eine bestimmte Fassung fest. Wird das Video danach lokal weiter verbessert, bleibt online die freigegebene Fassung, bis der Film erneut freigegeben wird.

Zurückziehen: `pnpm videothek:release --withdraw <id>`. Was freigegeben ist, zeigt `pnpm videothek:release --list`.

## Lokale Vorschau mit Entwürfen

```bash
pnpm dev:drafts
```

Die Vorschau zeigt alle Entwürfe mit Hinweis „Entwurf“, auch alle Filme mit den aktuellen lokalen Dateien aus `~/Movies/seez/_videothek` (anderer Ort: `SEEZ_VIDEOTHEK_DIR`). Das geht nur im Dev-Server. Ein Build zeigt nie Entwürfe.

## Prüfung vor dem Deploy

`pnpm build` führt am Ende `scripts/ci/publish-guard.mjs` aus. Der Build bricht ab, wenn in `dist/` eines davon auftaucht:

- eine Seite oder ein Titel eines Entwurfs,
- eine Mediendatei, die nicht freigegeben ist oder von der freigegebenen Fassung abweicht,
- eine Spur eines nicht freigegebenen Films,
- ein lokaler Pfad oder der Hinweis der Entwurfsvorschau.

Einzeln ausführen mit `pnpm guard`.

Der Codeberg-Spiegel bekommt keine Videodateien, die liegen nur auf seez.eu.
