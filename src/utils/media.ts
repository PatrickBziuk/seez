/**
 * Playable media for songs: EP track audio and music videos.
 *
 * Both come only from src/data/videothek/releases.json (sha256-pinned, copied into
 * dist by the videothek integration). Nothing is loaded from other hosts, so playing
 * music on seez.eu sets no cookies and contacts no third party.
 */
import releases from '~/data/videothek/releases.json';
import { EP_TRACKS, type EpTrack } from '~/data/songs';
import { filmsForSong, type Film } from './videothek';

const PREFIX = '/videothek/media/';

type Pinned = { asset: string; sha256: string; bytes: number };
const TRACKS = ((releases as { tracks?: Record<string, { audio: Pinned }> }).tracks || {}) as Record<
  string,
  { audio: Pinned }
>;

/** URL of a released EP track's audio, or undefined if none is released. */
export function trackAudio(slug: string | undefined): string | undefined {
  const t = slug ? TRACKS[slug] : undefined;
  return t ? PREFIX + t.audio.asset : undefined;
}

/** The music video of a song (best released film for the catalog song key). */
export function songFilm(filmKey: string | undefined): Film | undefined {
  // Several versions of a song can be released. The main film is the finished one that was
  // released first, so releasing older versions later never swaps the film on a song page.
  const list = filmsForSong(filmKey);
  const finals = list
    .filter((f) => f.released && f.workStatus === 'final')
    .sort((a, b) => (a.release?.approvedAt || '').localeCompare(b.release?.approvedAt || ''));
  return finals[0] || list[0];
}

export interface PlayableTrack {
  track: EpTrack;
  audio: string;
  film?: Film;
}

/** EP tracks in Spotify order that have released audio. */
export function playableEp(): PlayableTrack[] {
  return EP_TRACKS.flatMap((track) => {
    const audio = trackAudio(track.slug);
    return audio ? [{ track, audio, film: songFilm(track.filmKey) }] : [];
  });
}
