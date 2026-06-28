import { getCollection } from 'astro:content';
import { SITE } from 'astrowind:config';

const languages = ['en', 'de'];
const staticRoutes = [
  '',
  'musik',
  'lyrics',
  'fragmente',
  'kreatives',
  'system-logs',
  'inventory',
  'press',
  'about',
  'contact',
];

export async function GET() {
  const urls: string[] = [];

  for (const lang of languages) {
    for (const route of staticRoutes) {
      urls.push(`${SITE.url}/${lang}/${route}`.replace(/\/$/, '/'));
    }
  }

  const musicEntries = await getCollection('music');
  for (const entry of musicEntries) {
    if (entry.data.draft || entry.data.publicationStatus === 'draft') continue;
    const lang = entry.data.language || 'en';
    const slug = entry.id.replace(/^[a-z]{2}\//, '').replace(/\.mdx?$/, '');
    urls.push(`${SITE.url}/${lang}/music/${slug}`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
