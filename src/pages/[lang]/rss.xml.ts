import { getRssString } from '@astrojs/rss';
import { buildRssItems, getRssChannelMeta } from '~/utils/rss';
import type { SupportedLanguage } from '~/utils/i18n';

export async function getStaticPaths() {
  return [
    { params: { lang: 'en' } },
    { params: { lang: 'de' } },
  ];
}

export const GET = async ({ params }: { params: { lang: SupportedLanguage } }) => {
  const lang = params.lang;
  const { items, lastBuildDate } = await buildRssItems({ language: lang });
  const meta = getRssChannelMeta({ language: lang });

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
