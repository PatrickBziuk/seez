# CLAUDE.md – seez.eu

**Zuerst `AGENTS.md` lesen.** Dort stehen die verbindlichen Regeln für Freigabe, Texte, Bilder und Commits.

Die wichtigsten Fakten:

- Kein CMS. Claude pflegt Inhalte direkt im Repo; der pre-commit-Hook erzeugt `INVENTORY.md` und prüft die Regeln.
- Veröffentlicht ist nur die EP GENERIERUNG LÄUFT (6 Tracks, Spotify). Alles andere ist „in Arbeit“.
- Nichts auf `published` setzen, `releases.json` nicht anfassen, nichts pushen ohne ausdrückliches Ja.
- Vor jeder Änderung an Songs oder Figuren `INVENTORY.md` ansehen, danach `pnpm inventory:check`.
