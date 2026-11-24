/**
 * /sitemap.xml kept for old links and crawlers. It used to list hand-picked routes with a
 * broken base URL ("undefined/en/musik"); now it simply points to the generated sitemap.
 */
export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://seez.eu/sitemap-0.xml</loc></sitemap>
</sitemapindex>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
