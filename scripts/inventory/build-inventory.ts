#!/usr/bin/env tsx
/**
 * Inventory of seez.eu – what exists in the repo, what is public, what is work in progress.
 *
 *   pnpm inventory          write data/inventory.json and INVENTORY.md
 *   pnpm inventory:check    fail if the files are stale or a rule below is broken
 *
 * Run by .husky/pre-commit (generate + git add + check). Generated files are never
 * edited by hand. The output has no timestamps, so it only changes when the repo does.
 *
 * Rules (errors block the commit, warnings are printed and listed in INVENTORY.md):
 *   E1  a music entry claims the EP (tag ep1/generierung-laeuft or "EP: GENERIERUNG LÄUFT")
 *       but is not in EP_TRACKS (src/data/songs.ts, Spotify order)
 *   E2  an image or sound referenced in src/ does not exist in public/
 *   E3  a redirect points to another redirect (chain)
 *   E4  a film in releases.json is missing from catalog.json
 *   W1  figure of a song differs between songs.ts and the entry's figureRef
 *   W2  a public sound file belongs to a song that is not released (only the EP is)
 *   W3  a file in public/images is not referenced anywhere in src/
 *   W4  an EP track has no song page yet
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { EP, EP_TRACKS, SONG_EXTRAS, SINGLES, LYRICS } from '../../src/data/songs';
import { phaseForLyrics } from '../../src/data/songbook';
import figuresJson from '../../src/data/figures.json';
import catalog from '../../src/data/videothek/catalog.json';
import releases from '../../src/data/videothek/releases.json';
import { REDIRECTS } from '../../src/data/redirects.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join('/');
const CHECK = process.argv.includes('--check');

function walk(dir: string, filter: (f: string) => boolean = () => true): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((d) => {
      const p = path.join(dir, d.name);
      return d.isDirectory() ? walk(p, filter) : filter(p) ? [p] : [];
    });
}
const isPublished = (fm: Record<string, unknown>) => fm.publicationStatus === 'published' && fm.draft !== true;
const slugOf = (file: string) => path.basename(file).replace(/\.mdx?$/, '');
const kb = (file: string) => Math.round(fs.statSync(file).size / 1024);

// ---------- source text of src/ (for reference checks) ----------
const srcFiles = walk(path.join(ROOT, 'src'), (f) => /\.(astro|ts|mjs|md|mdx|json|css)$/.test(f));
const srcText = srcFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const errors: string[] = [];
const warnings: string[] = [];

// ---------- songs ----------
const musicFiles = walk(path.join(ROOT, 'src/content/music'), (f) => /\.mdx?$/.test(f));
const music = musicFiles.map((file) => {
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  return { file: rel(file), slug: slugOf(file), data, content };
});
const epSlugs = new Set(EP_TRACKS.map((t) => t.slug));
const lyricsIds = new Set(LYRICS.map((l) => l.id));

const ep = EP_TRACKS.map((t) => {
  const entries = music.filter((m) => m.slug === t.slug);
  if (entries.length === 0)
    warnings.push(`W4 EP-Track ${t.no} ${t.title} hat noch keine Songseite (src/content/music/de/${t.slug}.md)`);
  for (const m of entries) {
    const ref = String(m.data.figureRef || '')
      .replace(/^fragments\//, '')
      .replace(/^sz-006-/, '');
    if (ref && !t.figures.includes(ref as never))
      warnings.push(`W1 ${m.file}: figureRef ${m.data.figureRef}, songs.ts sagt ${t.figures.join(', ')}`);
  }
  return {
    no: t.no,
    title: t.title,
    length: t.length,
    explicit: !!t.explicit,
    figures: t.figures,
    spotify: t.spotify,
    page: entries.map((m) => m.file),
    lyrics: t.lyricsId && lyricsIds.has(t.lyricsId) ? t.lyricsId : null,
    film: t.filmKey || null,
  };
});

const wip = music
  .filter((m) => !epSlugs.has(m.slug) && Array.isArray(m.data.tags) && (m.data.tags as string[]).includes('song'))
  .map((m) => {
    const tags = (m.data.tags as string[]) || [];
    if (
      tags.includes('ep1') ||
      tags.includes('generierung-laeuft') ||
      /\*\*EP:\*\*\s*GENERIERUNG LÄUFT/.test(m.content)
    )
      errors.push(`E1 ${m.file} gibt sich als EP-Track aus, steht aber nicht in EP_TRACKS (Spotify)`);
    const extra = SONG_EXTRAS[m.slug];
    const ref = String(m.data.figureRef || '')
      .replace(/^fragments\//, '')
      .replace(/^sz-006-/, '');
    if (extra?.figures && ref && !extra.figures.includes(ref as never))
      warnings.push(`W1 ${m.file}: figureRef ${m.data.figureRef}, songs.ts sagt ${extra.figures.join(', ')}`);
    return {
      slug: m.slug,
      title: String(m.data.title),
      language: m.data.language || null,
      onSite: isPublished(m.data),
      status: 'in Arbeit',
      figures: extra?.figures || (ref ? [ref] : []),
      audio: (m.data.audioUrl as string) || null,
      file: m.file,
    };
  });

const songPagesAndWip = new Set([
  ...EP_TRACKS.map((t) => t.lyricsId),
  ...Object.values(SONG_EXTRAS).map((x) => x.lyricsId),
]);
const lyricsOnly = LYRICS.filter((l) => !songPagesAndWip.has(l.id)).map((l) => ({
  id: l.id,
  title: l.title,
  figure: l.figure,
  phase: phaseForLyrics(l.id),
}));

// ---------- figures ----------
const fragmentFiles = walk(path.join(ROOT, 'src/content/fragments'), (f) => /\.mdx?$/.test(f));
const figures = figuresJson.figures.map((f) => {
  const dossiers = fragmentFiles
    .map((file) => ({ file, data: matter(fs.readFileSync(file, 'utf8')).data }))
    .filter((d) => slugOf(d.file).replace(/^sz-006-/, '') === f.id);
  const portrait = path.join(ROOT, 'public', f.portrait.src);
  if (!fs.existsSync(portrait)) errors.push(`E2 Figurenbild fehlt: public${f.portrait.src}`);
  return {
    sz: f.sz,
    id: f.id,
    name: f.name,
    accent: f.accent.dark,
    portrait: f.portrait.src,
    dossiers: dossiers.map((d) => ({
      file: rel(d.file),
      language: d.data.language || null,
      onSite: isPublished(d.data),
    })),
    songs: EP_TRACKS.filter((t) => t.figures.includes(f.id as never)).map((t) => `${t.no} ${t.title}`),
  };
});

// ---------- videos ----------
const released = releases.films as Record<string, unknown>;
for (const id of Object.keys(released))
  if (!catalog.films.some((f) => f.id === id)) errors.push(`E4 releases.json nennt ${id}, das fehlt in catalog.json`);
const videos = catalog.films.map((f) => ({
  id: f.id,
  title: f.title,
  song: (f.song as { key?: string } | undefined)?.key || null,
  length: f.length,
  workStatus: f.workStatus,
  released: Object.prototype.hasOwnProperty.call(released, f.id),
}));

// ---------- texts ----------
const textFiles = walk(path.join(ROOT, 'src/content/texts'), (f) => /\.mdx?$/.test(f));
const texts = textFiles.map((file) => {
  const { data } = matter(fs.readFileSync(file, 'utf8'));
  return { file: rel(file), title: String(data.title), language: data.language || null, onSite: isPublished(data) };
});

// ---------- assets ----------
const publicDir = path.join(ROOT, 'public');
const images = walk(path.join(publicDir, 'images')).map((file) => {
  const url = '/' + rel(file).replace(/^public\//, '');
  const used = srcText.includes(url);
  if (!used) warnings.push(`W3 ${url} (${kb(file)} KB) wird in src/ nicht verwendet`);
  return { url, kb: kb(file), used };
});
const sounds = walk(path.join(publicDir, 'sounds')).map((file) => {
  const url = '/' + rel(file).replace(/^public\//, '');
  const song = music.find((m) => m.data.audioUrl === url);
  const onEp = song ? epSlugs.has(song.slug) : false;
  if (song && !onEp)
    warnings.push(`W2 ${url} ist öffentlich, gehört aber zu „${song.data.title}“ (nicht veröffentlicht)`);
  return { url, kb: kb(file), song: song ? String(song.data.title) : null, released: onEp };
});
for (const m of srcText.matchAll(/["'(](\/(?:images|sounds)\/[^"')\s]+)/g)) {
  const url = m[1];
  if (!fs.existsSync(path.join(publicDir, url)) && !errors.some((e) => e.includes(url)))
    errors.push(`E2 ${url} wird verwendet, fehlt aber in public/`);
}

// ---------- redirects ----------
const strip = (p: string) => p.split('#')[0].replace(/\/+$/, '') || '/';
const redirects = Object.entries(REDIRECTS as Record<string, string>).map(([from, to]) => {
  if ((REDIRECTS as Record<string, string>)[strip(to)]) errors.push(`E3 Weiterleitungskette: ${from} -> ${to} -> …`);
  return { from, to };
});

// ---------- pages ----------
const pages = walk(path.join(ROOT, 'src/pages'), (f) => /\.(astro|ts|md|mdx|html)$/.test(f)).map(
  (f) =>
    rel(f)
      .replace(/^src\/pages/, '')
      .replace(/\/index\.(astro|ts)$/, '') || '/'
);

// ---------- output ----------
const inventory = {
  $comment: 'Generated by scripts/inventory/build-inventory.ts (pnpm inventory). Do not edit by hand.',
  ep: { title: EP.title, released: EP.released, length: EP.length, spotify: EP.spotify, tracks: ep },
  singles: SINGLES,
  songsInProgress: wip,
  lyricsWithoutPage: lyricsOnly,
  figures,
  videos,
  texts,
  assets: { images, sounds },
  redirects,
  pages,
  findings: { errors, warnings },
};
const json = JSON.stringify(inventory, null, 2) + '\n';

const yes = (b: boolean) => (b ? 'ja' : 'nein');
const md = [
  '# Inventar seez.eu',
  '',
  '> Erzeugt von `scripts/inventory/build-inventory.ts` (`pnpm inventory`, läuft im pre-commit). Nicht von Hand bearbeiten.',
  '> Maschinenlesbar: `data/inventory.json`. Öffentlich ist nur, was freigegeben ist (`docs/videothek-und-freigabe.md`).',
  '',
  `## EP ${EP.title} (veröffentlicht ${EP.released}, ${EP.length}) – Quelle: Spotify`,
  '',
  '| Nr. | Titel | Länge | Figur | Songseite | Lyrics | Video-Key |',
  '|---|---|---|---|---|---|---|',
  ...ep.map(
    (t) =>
      `| ${t.no} | ${t.title}${t.explicit ? ' (E)' : ''} | ${t.length} | ${t.figures.join(', ')} | ${t.page.join('<br>') || '–'} | ${t.lyrics || '–'} | ${t.film || '–'} |`
  ),
  '',
  `Singles: ${SINGLES.map((s) => `${s.title} (${s.released}, ${s.length})`).join('; ')}`,
  '',
  '## Songs in Arbeit (mit Seite auf der Website)',
  '',
  '| Titel | Figur | auf der Website | Hörprobe | Datei |',
  '|---|---|---|---|---|',
  ...wip.map(
    (s) => `| ${s.title} | ${s.figures.join(', ') || '–'} | ${yes(s.onSite)} | ${s.audio || '–'} | ${s.file} |`
  ),
  '',
  '## Songtexte ohne Songseite (lyrics.json, alle in Arbeit)',
  '',
  lyricsOnly.map((l) => `${l.title} (${l.figure ?? '–'}, ${l.phase ? `Phase ${l.phase}` : 'Phase offen'})`).join(' · '),
  '',
  '## Figuren',
  '',
  '| SZ | Name | Akzent | Bild | Dossiers | EP-Songs |',
  '|---|---|---|---|---|---|',
  ...figures.map(
    (f) =>
      `| ${f.sz} | ${f.name} | \`${f.accent}\` | ${f.portrait} | ${f.dossiers.map((d) => `${d.language}${d.onSite ? '' : ' (Entwurf)'}`).join(', ')} | ${f.songs.join(', ') || '–'} |`
  ),
  '',
  `## Videos (${videos.length} im Katalog, ${videos.filter((v) => v.released).length} freigegeben)`,
  '',
  '| ID | Titel | Song | Länge | Arbeitsstand | freigegeben |',
  '|---|---|---|---|---|---|',
  ...videos.map(
    (v) => `| ${v.id} | ${v.title} | ${v.song || '–'} | ${v.length} | ${v.workStatus} | ${yes(v.released)} |`
  ),
  '',
  '## Texte',
  '',
  ...texts.map((t) => `- ${t.title} (${t.language}, ${t.onSite ? 'online' : 'Entwurf'}) – ${t.file}`),
  '',
  '## Bilder und Töne in public/',
  '',
  `Bilder: ${images.length} Dateien, ${images.reduce((a, b) => a + b.kb, 0)} KB, davon ${images.filter((i) => !i.used).length} ohne Verwendung.`,
  '',
  '| Ton | KB | Song | veröffentlicht |',
  '|---|---|---|---|',
  ...sounds.map((s) => `| ${s.url} | ${s.kb} | ${s.song || '–'} | ${yes(s.released)} |`),
  '',
  `## Weiterleitungen (${redirects.length})`,
  '',
  'Tabelle: `src/data/redirects.mjs`. Jede alte URL führt in einem Sprung zum Ziel (`pnpm check:redirects` nach dem Build).',
  '',
  `## Seiten-Routen (${pages.length})`,
  '',
  pages.map((p) => `\`${p}\``).join(' · '),
  '',
  '## Befunde',
  '',
  ...(errors.length ? errors.map((e) => `- **Fehler** ${e}`) : ['- keine Fehler']),
  ...warnings.map((w) => `- Hinweis ${w}`),
  '',
].join('\n');

const jsonPath = path.join(ROOT, 'data/inventory.json');
const mdPath = path.join(ROOT, 'INVENTORY.md');

if (CHECK) {
  const stale = [jsonPath, mdPath].filter(
    (p) => !fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== (p === jsonPath ? json : md)
  );
  if (stale.length) errors.push(`Inventar veraltet: ${stale.map(rel).join(', ')} – pnpm inventory ausführen`);
} else {
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(mdPath, md);
}

for (const w of warnings) console.log(`[inventory] Hinweis ${w}`);
for (const e of errors) console.error(`[inventory] FEHLER ${e}`);
console.log(
  `[inventory] EP ${ep.length} Tracks · ${wip.length} Songs in Arbeit · ${figures.length} Figuren · ${videos.length} Videos (${videos.filter((v) => v.released).length} frei) · ${texts.length} Texte · ${redirects.length} Weiterleitungen`
);
if (errors.length) process.exit(1);
