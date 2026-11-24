/**
 * Old URLs that must keep working after the relaunch (KONZEPT B11-5).
 * GitHub Pages cannot send real 301s, so Astro writes a small HTML page per
 * entry (meta refresh + canonical + noindex). Sitemap skips redirect routes.
 * Rule: every URL that existed in the previous build either still exists or is listed here.
 */
const MUSIC_DE = [
  'als-sie-kamen',
  'aufstiegstraum',
  'fck-suno',
  'genaeht',
  'glueck-am-ende',
  'herz-klopft-kopf-platzt',
  'kiffen-kippen-alk',
  'meine-musik',
  'questlog',
  'scherbenprotokoll',
  'schmetterlingsmoment',
  'spiegelkrise',
];
const FIGURE_SLUGS = { drift: 'drift', gl1tch: 'gl1tch', lume: 'lume', shift: 'shift', splinter: 'splinter', 'sz-006-unknown': 'unknown' };

const r = {};

// Music: one overview per language, songs below it (/de/musik/<slug>, /en/music/<slug>)
r['/de/music'] = '/de/musik';
r['/en/musik'] = '/en/music';
// Renamed songs (old slug -> new slug); old URLs point straight to the new page, no chains.
const RENAMED = { 'als-sie-kamen': 'als-sie' };
const current = (s) => RENAMED[s] || s;
for (const s of MUSIC_DE) {
  r[`/de/music/${s}`] = `/de/musik/${current(s)}`;
  if (s !== 'meine-musik' && s !== 'kiffen-kippen-alk') r[`/de/music/de/${s}`] = `/de/musik/${current(s)}`;
}
for (const [old, now] of Object.entries(RENAMED)) {
  r[`/de/musik/${old}`] = `/de/musik/${now}`;
  r[`/en/music/${old}`] = `/en/music/${now}`;
}
r['/de/music/de/meine-musik'] = '/de/musik/meine-musik';
r['/de/music/meine-musik-slug-20250805-bf655b06'] = '/de/musik/meine-musik';
r['/en/music/en/my-music'] = '/en/music/my-music';
r['/en/music/en/time-to-leave'] = '/en/music/time-to-leave';
r['/en/music/my-music-slug-20250805-bf655b06'] = '/en/music/my-music';

// Figures: the section stays "Fragmente" (/de/fragmente, /en/fragments)
r['/de/figuren'] = '/de/fragmente';
r['/en/figuren'] = '/en/fragments';
r['/en/fragmente'] = '/en/fragments';
for (const [old, slug] of Object.entries(FIGURE_SLUGS)) {
  r[`/de/figuren/${old}`] = `/de/fragmente/${slug}`;
  r[`/en/figuren/${old}`] = `/en/fragments/${slug}`;
  r[`/en/fragmente/${old}`] = `/en/fragments/${slug}`;
}
r['/de/fragmente/sz-006-unknown'] = '/de/fragmente/unknown';

// Workshop replaces System Logs, Creative Core and Tech Stack
r['/de/system-logs'] = '/de/werkstatt';
r['/en/system-logs'] = '/en/workshop';
r['/de/kreatives'] = '/de/werkstatt#prozess';
r['/en/kreatives'] = '/en/workshop#process';
r['/de/tech-stack'] = '/de/werkstatt#werkzeuge';
r['/en/tech-stack'] = '/en/workshop#tools';

// Locked placeholder areas (no content) – removed
for (const l of ['de', 'en']) {
  const home = `/${l}`;
  const shop = l === 'de' ? '/de/werkstatt' : '/en/workshop';
  r[`/${l}/books`] = home;
  r[`/${l}/life`] = home;
  r[`/${l}/lab`] = shop;
  r[`/${l}/projects`] = shop;
}
for (const s of ['circles', 'cosensai', 'portique', 'seelenstrip']) {
  r[`/de/projects/${s}`] = '/de/werkstatt';
  r[`/projects/de/${s}`] = '/de/werkstatt';
}
r['/projects'] = '/de/werkstatt';

// Performer license moves into the site
r['/perform'] = '/en/license';

// Former root shortcuts and AstroWind demo pages
r['/about'] = '/de/about';
r['/contact'] = '/de/contact';
r['/privacy'] = '/de/legal/privacy';
r['/terms'] = '/de/lizenz';
r['/pricing'] = '/de/inventory';
r['/services'] = '/de/werkstatt';
r['/tech-stack'] = '/de/werkstatt#werkzeuge';
for (const s of ['mobile-app', 'personal', 'saas', 'startup']) r[`/homes/${s}`] = '/de';
r['/landing/click-through'] = '/de';
r['/landing/lead-generation'] = '/de/contact';
r['/landing/pre-launch'] = '/de/werkstatt';
r['/landing/product'] = '/de/inventory';
r['/landing/sales'] = '/de/inventory';
r['/landing/subscription'] = '/de/contact';

// Second, unused CMS front end (AstroWind demo config); /admin is the configured one
r['/decapcms'] = '/admin';

export const REDIRECTS = r;
