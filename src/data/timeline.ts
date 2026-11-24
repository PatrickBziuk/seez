/**
 * Zeitstrahl / Timeline: facts only. Dates come from the YouTube channel pages (creation
 * date as shown there), songs.ts (single, EP) and the Videothek releases (24.11.2026).
 * Undated groups (the torn profile photo, the digital art) carry a label instead of a year;
 * the drawings are dated "2011–2013" as a group only.
 */
import type { ImageMetadata } from 'astro';
import { EP, EP_TRACKS, SINGLES } from './songs';
import { INK, type Ink } from './sketches';
import wiese from '~/assets/art/speedart-wiese.jpg';
import winterplanet from '~/assets/art/abstract-winterplanet.jpg';
import planeten from '~/assets/art/planeten-blau.webp';
import kompass from '~/assets/art/kompass-einfluesse.jpg';

type L = { de: string; en: string };

export interface TimelineThumb {
  image: ImageMetadata;
  alt: L;
}
export interface TimelineMark {
  ink: Ink;
  alt: L;
}
export interface TimelineEntry {
  id: string;
  /** ISO date when known, otherwise undefined (then `when` is a label) */
  date?: string;
  when: L;
  title: L;
  text: L;
  /** internal path per language or an external URL */
  link?: { href: L | string; text: L; external?: boolean };
  thumbs?: TimelineThumb[];
  marks?: TimelineMark[];
}

const fmt = (iso: string, lang: 'de' | 'en') =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  });
const day = (iso: string): L => ({ de: fmt(iso, 'de'), en: fmt(iso, 'en') });

const single = SINGLES[0];

export const TIMELINE: TimelineEntry[] = [
  {
    id: 'ursprung',
    when: { de: 'Ursprung', en: 'Origin' },
    title: { de: 'Das zerrissene Profilbild', en: 'The torn profile picture' },
    text: {
      de: 'Ein Selbstporträt, ausgedruckt, das Gesicht herausgerissen, neu gescannt. Bis heute das Profilbild auf Tumblr.',
      en: 'A self-portrait, printed, the face torn out, scanned again. Still the profile picture on Tumblr.',
    },
    link: { href: { de: '/de/about#ursprung', en: '/en/about#ursprung' }, text: { de: 'Über Seez', en: 'About Seez' } },
  },
  {
    id: 'patiscentral',
    date: '2011-06-05',
    when: day('2011-06-05'),
    title: { de: 'YouTube-Kanal @PatisCentral', en: 'YouTube channel @PatisCentral' },
    text: {
      de: 'Der erste Kanal entsteht: Speedarts und digitale Kunst. Heute heißt er „Old“ und hat 12 Videos.',
      en: 'The first channel starts: speedarts and digital art. Today it is called “Old” and holds 12 videos.',
    },
    link: {
      href: 'https://www.youtube.com/@PatisCentral',
      text: { de: '@PatisCentral auf YouTube', en: '@PatisCentral on YouTube' },
      external: true,
    },
  },
  {
    id: 'digitale-kunst',
    when: { de: 'Speedart-Zeit · ohne Datum', en: 'Speedart era · undated' },
    title: { de: 'Digitale Kunst', en: 'Digital art' },
    text: {
      de: 'Speedarts und Fotomontagen, Typo-Arbeiten wie „KINDISCH“ und „ZEILEN LIEBE“, ein Aufkleber mit Pixel-Cursor. Einzelne Jahre sind nicht überliefert.',
      en: 'Speedarts and photo montages, type pieces such as “KINDISCH” and “ZEILEN LIEBE”, a sticker with a pixel cursor. Single years are not on record.',
    },
    thumbs: [
      {
        image: wiese,
        alt: {
          de: 'Speedart: grüne Wiese, Bäume, Lichtkreise vor hellem Himmel',
          en: 'Speedart: green meadow, trees, light circles against a bright sky',
        },
      },
      {
        image: winterplanet,
        alt: {
          de: 'Fotomontage „ABSTRACT“: verschneite Tannen unter einem großen blauen Planeten',
          en: 'Photo montage “ABSTRACT”: snowy fir trees under a large blue planet',
        },
      },
      {
        image: planeten,
        alt: {
          de: 'Wallpaper: blaue Planeten im Sternennebel',
          en: 'Wallpaper: blue planets in a star nebula',
        },
      },
    ],
    marks: [
      {
        ink: INK.kindisch,
        alt: { de: 'Schriftzug KINDISCH', en: 'Lettering KINDISCH' },
      },
      {
        ink: INK.zeilenLiebe,
        alt: { de: 'Schriftzug ZEILEN LIEBE, darunter www.seez.eu', en: 'Lettering ZEILEN LIEBE, www.seez.eu below' },
      },
      {
        ink: INK.cursorHand,
        alt: {
          de: 'Pixel-Mauszeiger als Hand mit ausgestrecktem Mittelfinger, darunter WWW.SEEZ.EU',
          en: 'Pixel mouse cursor as a hand showing the middle finger, WWW.SEEZ.EU below',
        },
      },
    ],
  },
  {
    id: 'skizzenbuch',
    when: { de: '2011–2013', en: '2011–2013' },
    title: { de: 'Skizzenbuch', en: 'Sketchbook' },
    text: {
      de: 'Zeichnungen mit Bleistift und Kugelschreiber, Graffiti mit Marker, SEEZ als Sprühschablone.',
      en: 'Drawings in pencil and ballpoint, graffiti in marker, SEEZ as a spray stencil.',
    },
    link: {
      href: { de: '/de/about#skizzenbuch', en: '/en/about#skizzenbuch' },
      text: { de: 'Skizzenbuch 2011–2013', en: 'Sketchbook 2011–2013' },
    },
    marks: [
      { ink: INK.graffiti, alt: { de: 'Graffiti-Schriftzug SEEZ', en: 'Graffiti lettering SEEZ' } },
      { ink: INK.schablone, alt: { de: 'Schablonen-Logo SEEZ', en: 'Stencil logo SEEZ' } },
      {
        ink: INK.herzDolch,
        alt: { de: 'Gebrochenes Herz an Schläuchen mit Dolch', en: 'Broken heart on hoses with a dagger' },
      },
    ],
  },
  {
    id: 'seezerino',
    date: '2012-11-05',
    when: day('2012-11-05'),
    title: { de: 'YouTube-Kanal @seezerino', en: 'YouTube channel @seezerino' },
    text: {
      de: 'Der Kanal „Seez“ entsteht. Künftig sollen hier die Musikvideos laufen.',
      en: 'The channel “Seez” starts. It is meant to become the home of the music videos.',
    },
    link: {
      href: 'https://www.youtube.com/@seezerino',
      text: { de: '@seezerino auf YouTube', en: '@seezerino on YouTube' },
      external: true,
    },
  },
  {
    id: 'single-kka',
    date: single.released,
    when: day(single.released),
    title: { de: `Single ${single.title}`, en: `Single ${single.title}` },
    text: {
      de: `Die erste Single erscheint auf Spotify (${single.length}).`,
      en: `The first single comes out on Spotify (${single.length}).`,
    },
    link: { href: single.spotify, text: { de: 'Auf Spotify', en: 'On Spotify' }, external: true },
  },
  {
    id: 'ep',
    date: EP.released,
    when: day(EP.released),
    title: { de: `EP ${EP.title}`, en: `EP ${EP.title}` },
    text: {
      de: `${EP_TRACKS.length} Tracks, sechs Figuren, ${EP.length} Minuten.`,
      en: `${EP_TRACKS.length} tracks, six figures, ${EP.length} minutes.`,
    },
    link: { href: { de: '/de/musik', en: '/en/music' }, text: { de: 'Musik', en: 'Music' } },
  },
  {
    id: 'videos',
    date: '2026-11-24',
    when: day('2026-11-24'),
    title: { de: 'Die Musikvideos der Figuren-Reihe', en: 'The music videos of the figure series' },
    text: {
      de: 'Die sechs Musikvideos der Figuren-Reihe laufen auf seez.eu.',
      en: 'The six music videos of the figure series play on seez.eu.',
    },
    link: { href: { de: '/de/videothek', en: '/en/videothek' }, text: { de: 'Videothek', en: 'Videothek' } },
  },
];

/** The compass drawing: its ring lists music influences (read off the drawing, as written). */
export const INFLUENCES = {
  image: kompass,
  alt: {
    de: 'Bleistiftzeichnung eines Kompasses mit Uhrzeigern, auf dem Ring stehen Namen von Musikerinnen, Musikern und Bands, signiert Seez',
    en: 'Pencil drawing of a compass with clock hands, the ring lists names of musicians and bands, signed Seez',
  },
  names: [
    'Selfmade',
    'Sido',
    'Cro',
    'D-Bo',
    'Samy Deluxe',
    'Rockstah',
    'Daft Punk',
    'Maeckes',
    'Papa Roach',
    'Peter Fox',
    'Casper',
    'Nirvana',
    'Prinz Porno',
    'Kraftklub',
    'Genetikk',
    'Trailerpark',
    'Of Mice & Men',
    'Eminem',
    'Bullet for My Valentine',
  ],
};
