# AGENTS.md – seez.eu

Verbindliche Regeln für Agenten (Claude, Codex, Copilot) und Menschen, die im Repo arbeiten.
seez.eu hat **kein CMS**. Inhalte werden hier im Repo gepflegt; Skripte im pre-commit halten
Inventar und Prüfungen aktuell. Kurz: Der Agent ist das CMS, die Skripte sind die Redaktion.

## Erst lesen

| Frage | Quelle |
|---|---|
| Was gibt es, was ist öffentlich, was ist in Arbeit? | `INVENTORY.md` (erzeugt, `pnpm inventory`) |
| Was ist veröffentlicht? | nur die EP GENERIERUNG LÄUFT (27.06.2026), Quelle **Spotify** |
| Wie wird freigegeben? | `docs/videothek-und-freigabe.md` |
| Wie soll es aussehen? | `docs/visual-konzept/KONZEPT.md` (Teil B) |

## Wahrheitsquellen

| Was | Datei | Regel |
|---|---|---|
| EP-Tracklist (Nummer, Titel, Schreibweise, Laufzeit) | `src/data/songs.ts` → `EP_TRACKS` | folgt Spotify, Album `47aAj0XEtEJnmJqFDswAp0`; nie davon abweichen |
| Songs in Arbeit | `src/data/songs.ts` → `SONG_EXTRAS`, `src/content/music/**` | immer als „in Arbeit“ kennzeichnen, nie „EP“, kein Veröffentlichungsdatum erfinden |
| Songtexte | `src/data/lyrics.json` | Texte außerhalb der EP sind Entwürfe |
| Figuren (Name, SZ-Nummer, Farbe, Bild) | `src/data/figures.json` | Schreibweise wie dort; Farben nicht frei wählen |
| Figuren-Dossiers | `src/content/fragments/**` | |
| Videos | `src/data/videothek/catalog.json` | macht nichts öffentlich |
| Freigabe von Videos | `src/data/videothek/releases.json` | **nur nach ausdrücklichem Ja**, nur über `pnpm videothek:release` |
| Weiterleitungen | `src/data/redirects.mjs` | jede alte URL bleibt erreichbar, ein Sprung, keine Ketten |
| Inventar | `INVENTORY.md`, `data/inventory.json` | erzeugt, nie von Hand bearbeiten |

## Freigabe

- Öffentlich ist ein Eintrag nur mit `publicationStatus: published` und ohne `draft: true`.
  Seiten lesen Inhalte über `getPublicCollection()` (`src/utils/publication.ts`), nie über `getCollection()`.
- Ein Agent setzt **nie** selbst `publicationStatus: published`, ändert nie `releases.json` und lädt keine
  Medien hoch, ohne dass der Mensch im Chat genau das freigegeben hat.
- `pnpm build` endet mit `scripts/ci/publish-guard.mjs`. Diese Prüfung wird nicht abgeschwächt.

## Texte

- Deutsch mit echten Umlauten, kurze Sätze, keine internen Arbeitsbegriffe nach außen.
- Fakten nicht erfinden. Was nicht aus Spotify, Notion (nur lesen) oder dem Repo belegt ist, kommt als
  Vorschlag in den Bericht, nicht auf die Website.
- Nur die EP ist veröffentlicht. Alles andere heißt „in Arbeit“. Keine Termine, solange keine feststehen.
- Englisch: eigene Fassung oder ehrlicher Hinweis „German only“, keine halben Übersetzungen.
- Songtitel in der Schreibweise von Spotify (z. B. FUCK SUNO, ALS SIE).

## Bilder und Assets

- Figurenbilder: Tusche-Stil laut Konzept, WebP, höchstens 1080 px hoch, Pfad in `figures.json`.
- Keine Dateien über 1 MB in `public/` ohne Grund; ungenutzte Dateien meldet das Inventar (W3).
- Töne in `public/sounds` sind öffentlich abrufbar. Hörproben unveröffentlichter Songs nur mit Ja (W2).
- Keine Schriften oder Skripte von fremden CDNs; Schriften liegen über `@fontsource` im Build.

## Commits

- Kleine Schritte, eine Sache pro Commit, Nachricht auf Deutsch: was und warum.
- Der pre-commit-Hook läuft immer; **nie `--no-verify`**. Er erzeugt das Inventar und bricht bei
  Regelverstößen ab (Fehler E1–E4 in `scripts/inventory/build-inventory.ts`).
- Vor dem Push: `pnpm build` grün (inklusive Weiterleitungs- und Freigabeprüfung).
- Agenten pushen, mergen und deployen nur nach ausdrücklicher Anweisung.

## Befehle

```bash
pnpm dev:drafts        # Vorschau mit Entwürfen (nur lokal)
pnpm inventory         # Inventar neu erzeugen
pnpm inventory:check   # Inventar und Regeln prüfen
pnpm build             # Build + check-redirects + publish-guard
pnpm check:redirects   # Weiterleitungsseiten in dist/ prüfen
```
