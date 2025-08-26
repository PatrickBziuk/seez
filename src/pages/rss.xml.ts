import { getRssString } from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { getSiteInfo } from '~/config/seez.config';
import { getLocalizedUrl } from '~/utils/i18n';

type CollectionName = 'books' | 'projects' | 'lab' | 'life' | 'music';

function toDate(value?: string | Date): Date {
  if (!value) return new Date();
  try {
    return value instanceof Date ? value : new Date(value);
  } catch {
    return new Date();
  }
}

export const GET = async () => {
  const siteInfo = getSiteInfo();
  const collections: CollectionName[] = ['books', 'projects', 'lab', 'life', 'music'];

  // Load entries from all active collections
  const allEntries = (
    await Promise.all(
      collections.map((c) =>
        getCollection(c).catch(() => {
          return [];
        })
      )
    )
  ).flat();

  // Normalize and filter to published entries only
  const items = allEntries
    .filter((e) => e?.data && e.data.publicationStatus !== 'draft' && e.data.draft !== true)
    .map((e) => {
      // Build localized path: prefer canonicalId URLs if available
      const idSlug = e.id.replace(/^[a-z]{2}\//, '').replace(/\.(md|mdx)$/i, '');
      const lang = e.data.language || 'en';
      const slugWithId = e.data.canonicalId ? `${idSlug}-${e.data.canonicalId}` : idSlug;
      const path = `/${e.collection}/${slugWithId}`;
      const link = getLocalizedUrl(path, lang);

      const title = e.data.title || idSlug;
      const description = e.data.description || undefined;
      const pubDate = toDate(e.data.firstPublishedAt || e.data.publishDate);
      const updateDate = toDate(e.data.updatedAt || e.data.modifiedDate || e.data.lastChangeDate);
      const finalDate = updateDate || pubDate || new Date();

      return {
        link,
        title,
        description,
        pubDate: finalDate,
      };
    })
    // Sort by date desc
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    // Limit to latest 50
    .slice(0, 50);

  const rss = await getRssString({
    title: `${siteInfo.name} — Recent content`,
    description: siteInfo.description || 'Latest content updates',
    site: import.meta.env.SITE || siteInfo.url,
    items,
    trailingSlash: false,
  });

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
