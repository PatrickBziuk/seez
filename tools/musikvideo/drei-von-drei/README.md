# DREI VON DREI · LUME · Musikvideo

Generator für das Musikvideo zu Lumes Song „Drei von Drei". Alles im Bild wird im Code gezeichnet
(Python, Pillow), jedes Bild folgt allein aus der Zeit. Grundlage ist das „Musikvideo Konzept" in Notion:
LUMEs Medium ist das Spiel, der Songtext ist Inhalt des Mediums, nie Untertitel.

## Idee

Das Bild wächst mit LUME auf: Jede Songpassage ist eine Spiel-Epoche, von vier Grünstufen bis zur
Würfelwelt. Ein kleiner Hinweis zählt das Alter mit („Alter 11 · neu: Farbe"). Die Hook ist dreimal
dieselbe Ansicht (drei Ecken ARBEIT, FREUNDE, ZEIT FÜR MICH, von denen immer nur zwei versorgt sind),
jedes Mal eine Epoche weiter. Erst am Ende darf eine Ecke ruhen, ohne unterzugehen.

| Zeit | Teil | Epoche (eigene Parodie) | Verbeugung vor |
| --- | --- | --- | --- |
| 0:00 | Intro | Taschenspiel in vier Grünstufen, dann Farbe | Pokémon |
| 0:20 | Strophe 1a | Browser-Imperium „Sternenamt" aus Tabellen | OGame |
| 0:32 | Strophe 1b | Transport in Schrägsicht, Fracht staut sich | OpenTTD |
| 0:43 | Pre-Hook 1 | Kolonie mit Arbeitsplan-Tabelle | RimWorld |
| 0:49 | Hook 1 | Fabrik mit Fließbändern | Factorio |
| 1:19 | Strophe 2a | Hof und Dorf, Kalenderbrett | Stardew Valley |
| 1:32 | Strophe 2b | Blockwelt, Spielrunde im Fackellicht, Chat | Terraria |
| 1:43 | Pre-Hook 2 | Festung aus Zeichen | Dwarf Fortress |
| 1:49 | Hook 2 | Hexkarte mit Rundenplanung | Civilization V |
| 2:11 | Strophe 3a | Spielebibliothek „SeezSpiele" und Listen | (keine Marke) |
| 2:31 | Strophe 3b | Papierwildnis, Anzeigen laufen leer | Don't Starve |
| 2:43 | Bridge | Schwarzer Bildschirm, weißer Kasten, Herz | Undertale |
| 2:54 | Final Hook | Würfelwelt, Sonnenuntergang | Minecraft |
| 3:25 | Outro | LUMEs eigenes Rollenspiel aus QUESTLOG, ein ruhiges Bild | – |

Nicht umgesetzt, weil im Code nicht glaubwürdig zu treffen: Supreme Commander, StarCraft II,
Cyberpunk 2077, Satisfactory, Crusader Kings III, The Binding of Isaac, Digimon.

## Leitplanke Markenrechte

Wie im Konzept festgelegt: Aufbau und Bedienlogik dürfen an die Vorbilder erinnern, Namen, Logos,
Figuren, Symbole und Originalgrafik nicht. Alle Kacheln, Figuren, Menüs und Namen sind eigene.

## Bauen

    pip install pillow numpy librosa faster-whisper
    cp <Song> song.mp3
    python align.py     # Wortzeiten (lädt das Whisper-Modell von Hugging Face) -> words_raw.json
    python prep.py      # ordnet die Zeiten dem Songtext in lyrics.txt zu, misst Schläge -> data.json
    python render.py    # -> DREI_VON_DREI_LUME_1080p.mp4 (1920x1080, 30 Bilder/s, ca. 3 Minuten Rechenzeit)

`data.json` und `words_raw.json` liegen bei, `align.py` und `prep.py` sind nur nach einer neuen
Songfassung nötig. Die Audiodatei und das fertige Video gehören nicht ins Repository.

Schriften: Unifont, Inter, DejaVu, Liberation Serif (Systempfade in `core.py`).
