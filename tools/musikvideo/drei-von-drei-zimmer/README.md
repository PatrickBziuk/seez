# DREI VON DREI · LUME · „Ein Zimmer, drei Lampen"

Zweite Fassung des Musikvideos, als Three.js-Szene. Ein Raum, eine Woche, ein Licht:
Lumes Zimmer hat drei Ecken (Schreibtisch = Arbeit, Tisch an der Tür = Freunde, Bett und Regal = Ich),
und das Licht reicht immer nur für zwei. Die erste Fassung (Spiel-Epochen, Pillow) liegt in
`../drei-von-drei/`.

## Ablauf

| Teil | Bild |
| --- | --- |
| Intro | Das Zimmer am Nachmittag, Lume ist klein und wächst bei „Heute bin ich groß". |
| Strophe 1 | Schreibtisch, das Fensterlicht rast durch die Wochentage, der Stapel verschweißter Spiele wächst. |
| Hook | Totale: drei Lampen, zwei brennen, die Namen der Ecken liegen als Licht auf dem Boden. |
| Strophe 2 | Freunde als Papierfiguren am Tisch, der Kalender blättert ein halbes Jahr, einer nach dem anderen geht. |
| Strophe 3 | Sonntag am Bett, Zettel an der Wand, die Lampen flackern. |
| Bridge | Alle drei Lampen zugleich, die Sicherung fliegt, nur das Amulett leuchtet. |
| Final Hook | Zwei Lampen, in der dritten Ecke ein Nachtlicht: Sie ruht, sie ist nicht verloren. |
| Outro | Abend am Bett, das oberste Spiel wandert vom Stapel aufs Bett. |

Der Songtext steht als Lichtschrift auf der Wand, Wort für Wort zur gemessenen Zeit (`data.json`).

## Figur und Requisiten

Lume, ihr Amulett, die Handkonsole und das Notizbuch sind Ausschnitte aus den Figurenblättern in Notion
(Seite „Lume", Tab „Bilder / Aesthetics", fünf Referenzbilder). Sie liegen bewusst nicht im Repository.
Ablegen als `assets/lume-01.png` bis `assets/lume-05.png`, dann `python prep_assets.py` (schneidet nach `tex/`).
Raum, Möbel, Licht, Freunde, Kalender, Zettel und Schrift entstehen im Code.

## Bauen

    npm install                 # three; Playwright mit Chromium muss vorhanden sein
    python prep_assets.py       # Figurenblätter zuschneiden
    cp <Song> song.mp3
    ./render_all.sh             # vier Browser parallel -> DREI_VON_DREI_LUME_Zimmer_1080p.mp4

Ohne Grafikkarte rechnet Chromium per Software (SwiftShader): bei 1280×720 etwa 90 Minuten für 3:49.
Das Skript rendert deshalb in 720p und skaliert auf 1080p hoch. Mit Grafikkarte: `W=1920 H=1080 ./render_all.sh`.
Einzelbilder zur Kontrolle: `node shot.js 960 540 25 95 167` (Zeiten in Sekunden, lokaler Server auf Port 8765).
