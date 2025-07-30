import { getCollection } from 'astro:content';
import { SITE } from 'astrowind:config';

// List only valid collection keys
const collections = ['books', 'projects', 'lab', 'life', 'pages'] as const;
const languages = ['en', 'de'];

export async function GET() {
  const urls: string[] = [];
  for (const collection of collections) {
    const entries = await getCollection(collection);
    for (const entry of entries) {
      for (const lang of languages) {
        // Use entry.id for URL
        urls.push(`${SITE.url}/${lang}/${collection}/${entry.id}`);
      }
    }
  }
  // Add homepage for each language
  for (const lang of languages) {
    urls.push(`${SITE.url}/${lang}/`);
  }
  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `<url><loc>${url}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
