import { getRssString } from '@astrojs/rss';
import { buildRssItems, getRssChannelMeta } from '~/utils/rss';
import type { SupportedLanguage } from '~/utils/i18n';

type CollectionName = 'books' | 'projects' | 'lab' | 'life' | 'music';

export const GET = async ({ params }: { params: { lang: SupportedLanguage; collection: CollectionName } }) => {
  const lang = params.lang;
  const collection = params.collection;
  const { items, lastBuildDate } = await buildRssItems({ language: lang, collection });
  const meta = getRssChannelMeta({ language: lang, collection });

  const rss = await getRssString({
    title: meta.title,
    description: meta.description,
    site: import.meta.env.SITE || meta.siteUrl,
    items,
    trailingSlash: false,
    customData: `<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`,
  });

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
