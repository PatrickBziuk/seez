/**
 * Skizzenbuch 2011–2013: the artist's own early drawings and the torn profile photo.
 *
 * - Originals (scans and photos) live in src/assets/sketches/originals/ and go through
 *   Astro's image pipeline (WebP). Only the profile photo and the drawings listed here are used.
 * - The ink versions in public/sketches/*.svg are traced from those originals by
 *   scripts/sketches/trace-sketches.mjs (fill="currentColor", tinted on the page).
 * - All drawings date from 2011–2013 as a group; no single drawing has its own year.
 * - Words inside the drawings are the artist's own and kept as drawn (e.g. "Never loose").
 * - Figure notes describe shared motifs only, never an intent.
 */
import type { ImageMetadata } from 'astro';
import type { FigureId } from './figures';
import profil from '~/assets/sketches/originals/profil-zerrissen.jpg';
import graffiti from '~/assets/sketches/originals/graffiti-seez.jpg';
import schablonen from '~/assets/sketches/originals/schablonen-seez.jpg';
import herzDolch from '~/assets/sketches/originals/herz-dolch.jpg';
import auge from '~/assets/sketches/originals/auge-absperrband.jpg';
import kapuze from '~/assets/sketches/originals/kapuze-tusche.jpg';
import elysium from '~/assets/sketches/originals/elysium.jpg';
import forgive from '~/assets/sketches/originals/forgive.jpg';
import hurtTime from '~/assets/sketches/originals/hurt-time.jpg';
import rissGesicht from '~/assets/sketches/originals/riss-gesicht.jpg';
import schlossLove from '~/assets/sketches/originals/schloss-love.jpg';

type L = { de: string; en: string };

export interface Ink {
  /** public path of the traced SVG */
  src: string;
  width: number;
  height: number;
}

export interface Sketch {
  id: string;
  title: L;
  /** what the original is made with */
  medium: L;
  alt: L;
  scan: ImageMetadata;
  /** alt for the scan/photo of the original (falls back to alt) */
  scanAlt?: L;
  ink: Ink;
}

const ink = (id: string, width: number, height: number): Ink => ({ src: `/sketches/${id}.svg`, width, height });

export const SKETCH_YEARS = '2011–2013';

export const PROFILE = {
  image: profil,
  alt: {
    de: 'Ausgedrucktes Selbstporträt: junger Mann im Kapuzenpulli zeigt mit beiden Händen das Peace-Zeichen, die Mitte des Gesichts ist aus dem Papier gerissen, dort bleibt weißes Papier',
    en: 'Printed self-portrait: a young man in a hoodie makes peace signs with both hands, the middle of the face is torn out of the paper, leaving blank paper',
  },
  caption: {
    de: 'Ein Selbstporträt mit der Spiegelreflexkamera, ausgedruckt. Mein Gesicht fand ich zu hässlich, also habe ich es herausgerissen und das Blatt noch einmal eingescannt. Bis heute ist das mein Profilbild auf Tumblr. Der Ursprung von Seez.',
    en: 'A self-portrait taken with a DSLR, printed out. I found my face too ugly, so I tore it out and scanned the sheet again. It is still my profile picture on Tumblr. The origin of Seez.',
  },
} as const;

export const SKETCHES: Sketch[] = [
  {
    id: 'graffiti-seez',
    title: { de: 'SEEZ', en: 'SEEZ' },
    medium: { de: 'Marker auf Papier', en: 'Marker on paper' },
    alt: {
      de: 'Schriftzug SEEZ im Graffiti-Stil, kantige Buchstaben mit Pfeilspitzen, als Linienzeichnung',
      en: 'The word SEEZ in graffiti style, angular letters with arrow tips, as line drawing',
    },
    scanAlt: {
      de: 'Graffiti-Schriftzug SEEZ in Orange und Rot mit schwarzer Kontur und gelben Lichtkanten',
      en: 'Graffiti lettering SEEZ in orange and red with black outline and yellow highlights',
    },
    scan: graffiti,
    ink: ink('graffiti-seez', 1300, 696),
  },
  {
    id: 'schablone-seez',
    title: { de: 'SEEZ als Schablone', en: 'SEEZ as a stencil' },
    medium: { de: 'Sprühfarbe an der Wand, Foto', en: 'Spray paint on a wall, photo' },
    alt: {
      de: 'Schablonen-Logo SEEZ: Buchstaben in einem Dreieck mit Pfeil nach oben und Spitze nach unten rechts',
      en: 'Stencil logo SEEZ: letters inside a triangle with an arrow pointing up and a spike pointing down right',
    },
    scanAlt: {
      de: 'Zwei gesprühte SEEZ-Schablonen nebeneinander an einer Wand, eine rot und blau, eine rot und schwarz',
      en: 'Two sprayed SEEZ stencils side by side on a wall, one red and blue, one red and black',
    },
    scan: schablonen,
    ink: ink('schablone-seez', 700, 553),
  },
  {
    id: 'herz-dolch',
    title: { de: 'Herz an Schläuchen', en: 'Heart on hoses' },
    medium: { de: 'Bleistift, Foto', en: 'Pencil, photo' },
    alt: {
      de: 'Ein gebrochenes Herz hängt an gerippten Schläuchen, oben links ein Dolch mit der Gravur SEEZ, dunkle Tropfen',
      en: 'A broken heart hangs from ribbed hoses, a dagger engraved SEEZ at the top left, dark drops',
    },
    scan: herzDolch,
    ink: ink('herz-dolch', 1400, 1041),
  },
  {
    id: 'hurt-time',
    title: { de: 'HURT / TIME', en: 'HURT / TIME' },
    medium: { de: 'Bleistift, Scan', en: 'Pencil, scan' },
    alt: {
      de: 'Geflügelte Figur aus runden Formen mit gebrochenem Herz, eine Raute mit gebrochenem Herz, ein Band mit SEEZ, Kabel, links das Wort HURT, rechts TIME',
      en: 'Winged figure of round shapes with a broken heart, a diamond with a broken heart, a band reading SEEZ, cables, the word HURT on the left, TIME on the right',
    },
    scan: hurtTime,
    ink: ink('hurt-time', 1400, 1000),
  },
  {
    id: 'forgive',
    title: { de: 'Forgive … Forever', en: 'Forgive … Forever' },
    medium: { de: 'Bleistift, Scan', en: 'Pencil, scan' },
    alt: {
      de: 'Dichte Komposition aus Spitzen, Zähnen und Bändern mit den Wörtern Forgive…, Trust me…, Never loose, Forever, Work, Dreams come true, AKA, Fuck Hope und Terroristen am Apparat',
      en: 'Dense composition of spikes, teeth and ribbons with the words Forgive…, Trust me…, Never loose, Forever, Work, Dreams come true, AKA, Fuck Hope and Terroristen am Apparat',
    },
    scan: forgive,
    ink: ink('forgive', 1200, 842),
  },
  {
    id: 'riss-gesicht',
    title: { de: 'Gesicht mit Rissen', en: 'Cracked face' },
    medium: { de: 'Bleistift, Scan', en: 'Pencil, scan' },
    alt: {
      de: 'Gesicht unter einer Mütze, von tiefen Rissen durchzogen, Nase und Kinn mit Stichen genäht, signiert Seez',
      en: 'A face under a beanie, split by deep cracks, nose and chin stitched, signed Seez',
    },
    scan: rissGesicht,
    ink: ink('riss-gesicht', 1100, 1480),
  },
  {
    id: 'kapuze-tusche',
    title: { de: 'Kapuze und Brille', en: 'Hood and goggles' },
    medium: { de: 'Kugelschreiber, Foto', en: 'Ballpoint pen, photo' },
    alt: {
      de: 'Porträt eines Mannes mit Kapuze, Schutzbrille auf der Kapuze, runder Sonnenbrille und Ketten, unten tropfende Linien, kariertes Muster im Hintergrund, signiert SEEZ',
      en: 'Portrait of a man in a hood, goggles on the hood, round sunglasses and chains, dripping lines at the bottom, checkered background, signed SEEZ',
    },
    scan: kapuze,
    ink: ink('kapuze-tusche', 1000, 1404),
  },
  {
    id: 'elysium',
    title: { de: 'Elysium', en: 'Elysium' },
    medium: { de: 'Bleistift, Scan', en: 'Pencil, scan' },
    alt: {
      de: 'Große Komposition mit den Wörtern Prinz, Elysium, Unperfekt City, Feelings und SEEZ, einem Sechseckrahmen mit Fuchsgesicht, einer Maske mit Rautenaugen und einem Fischdrachen mit Zähnen',
      en: 'Large composition with the words Prinz, Elysium, Unperfekt City, Feelings and SEEZ, a hexagon frame with a fox face, a mask with diamond eyes and a fish-dragon with teeth',
    },
    scan: elysium,
    ink: ink('elysium', 1300, 905),
  },
  {
    id: 'schloss-love',
    title: { de: 'LOVE als Schloss', en: 'LOVE as a padlock' },
    medium: { de: 'Bleistift, Scan', en: 'Pencil, scan' },
    alt: {
      de: 'Vorhängeschloss mit der Aufschrift LOVE in einem Stern, ringsum PAIN, FOREVER, CHEATING, NOT REAL und JEALOUS, darüber eine gebogene Klinge',
      en: 'A padlock reading LOVE inside a star, around it PAIN, FOREVER, CHEATING, NOT REAL and JEALOUS, a curved blade above',
    },
    scan: schlossLove,
    ink: ink('schloss-love', 1100, 1367),
  },
  {
    id: 'auge-absperrband',
    title: { de: 'Auge hinter Absperrband', en: 'Eye behind barrier tape' },
    medium: { de: 'Buntstift, Foto', en: 'Coloured pencil, photo' },
    alt: {
      de: 'Spitze Augen- oder Maskenform, durchkreuzt von Absperrband-Streifen, darin ein Planet mit Ring',
      en: 'A pointed eye or mask shape crossed by barrier-tape stripes, with a ringed planet inside',
    },
    scanAlt: {
      de: 'Buntstiftzeichnung: spitze Augenform, rot-weiße Absperrbänder, blauer Planet mit Ring, blauer Himmel',
      en: 'Coloured pencil drawing: pointed eye shape, red and white barrier tape, blue ringed planet, blue sky',
    },
    scan: auge,
    ink: ink('auge-absperrband', 1200, 944),
  },
];

/** Details and marks that are not gallery entries of their own. */
export const INK = {
  fischdrache: ink('fischdrache', 800, 872),
  schablone: ink('schablone-seez', 700, 553),
  herzDolch: ink('herz-dolch', 1400, 1041),
  graffiti: ink('graffiti-seez', 1300, 696),
  // early digital pieces (src/assets/art/), traced from the files, undated
  anker: ink('anker', 500, 710),
  cursorHand: ink('cursor-hand', 650, 800),
  kindisch: ink('kindisch', 900, 300),
  zeilenLiebe: ink('zeilen-liebe', 1000, 720),
};

/** Early digital marks that appear on figure pages (no scan pair, no year). */
export const MARKS: Record<string, { ink: Ink; alt: L }> = {
  anker: {
    ink: INK.anker,
    alt: { de: 'Schwarzer Anker, frühe digitale Grafik', en: 'Black anchor, early digital graphic' },
  },
  'cursor-hand': {
    ink: INK.cursorHand,
    alt: {
      de: 'Pixel-Mauszeiger als Hand mit ausgestrecktem Mittelfinger, darunter WWW.SEEZ.EU',
      en: 'Pixel mouse cursor as a hand showing the middle finger, WWW.SEEZ.EU below',
    },
  },
};

export const getSketch = (id: string): Sketch | undefined => SKETCHES.find((s) => s.id === id);

/** Shared motifs between a figure sheet and the early drawings (observations, not intent). */
export const FIGURE_SKETCHES: Partial<Record<FigureId, { sketch?: string; mark?: string; note: L }[]>> = {
  drift: [
    {
      mark: 'anker',
      note: {
        de: 'Ein Anker als frühes Zeichen. Drift heißt „Der Ankerlose“; im Video zu KIFFEN KIPPEN ALK bloggt er als „keinanker“.',
        en: 'An anchor as an early sign. Drift is called “The Anchorless”; in the KIFFEN KIPPEN ALK video he blogs as “keinanker”.',
      },
    },
  ],
  gl1tch: [
    {
      sketch: 'herz-dolch',
      note: {
        de: 'Gebrochenes Herz, Dolch, Kabel: dieselben Zeichen trägt Gl1tch auf der Jacke.',
        en: 'Broken heart, dagger, cables: Gl1tch wears the same signs on the jacket.',
      },
    },
    {
      sketch: 'forgive',
      note: {
        de: '„Work“, „Trust me…“, „Never loose“: ähnliche Worte stehen auf Gl1tchs Jacke (WORK, TRUST ME, NEVER LOST).',
        en: '“Work”, “Trust me…”, “Never loose”: similar words are on Gl1tch’s jacket (WORK, TRUST ME, NEVER LOST).',
      },
    },
    {
      sketch: 'hurt-time',
      note: {
        de: 'Die Raute mit dem gebrochenen Herz und die Kabel kehren auf Gl1tchs Figurenblatt wieder.',
        en: 'The diamond with the broken heart and the cables recur on Gl1tch’s character sheet.',
      },
    },
    {
      mark: 'cursor-hand',
      note: {
        de: 'Ein Pixel-Mauszeiger mit Mittelfinger, frühe digitale Grafik. Gl1tchs Medium ist SZ OS.',
        en: 'A pixel mouse cursor showing the middle finger, an early digital graphic. Gl1tch’s medium is SZ OS.',
      },
    },
  ],
  splinter: [
    {
      sketch: 'riss-gesicht',
      note: {
        de: 'Ein Gesicht voller Risse, mit Stichen genäht. Splinter trägt eine gesplitterte Spiegelmaske.',
        en: 'A face full of cracks, stitched together. Splinter wears a shattered mirror mask.',
      },
    },
  ],
  unknown: [
    {
      sketch: 'kapuze-tusche',
      note: {
        de: 'Kapuze und runde Sonnenbrille, wie Unknown auf dem Figurenblatt.',
        en: 'Hood and round sunglasses, like Unknown on the character sheet.',
      },
    },
    {
      sketch: 'graffiti-seez',
      note: {
        de: 'Marker und Sprühdose: Unknowns Medium ist die Straße.',
        en: 'Marker and spray can: Unknown’s medium is the street.',
      },
    },
  ],
  lume: [
    {
      sketch: 'elysium',
      note: {
        de: 'Verwandtes Motiv: Orte mit Namen wie „Elysium“ und „Unperfekt City“, eine eigene Welt auf einem Blatt. Lumes Medium ist das Rollenspiel.',
        en: 'A related motif: places named “Elysium” and “Unperfekt City”, a world of its own on one sheet. Lume’s medium is the role-playing game.',
      },
    },
  ],
};

/** Splinter also gets the torn profile photo (a missing face). */
export const PROFILE_NOTE: L = {
  de: 'Das zerrissene Profilfoto: wo das Gesicht war, bleibt weißes Papier.',
  en: 'The torn profile photo: where the face was, blank paper remains.',
};
