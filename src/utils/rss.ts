import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { getLocalizedUrl, type SupportedLanguage } from '~/utils/i18n';
import { getSiteInfo, getRssConfig } from '~/config/seez.config';

type CollectionName = 'books' | 'projects' | 'lab' | 'life' | 'music';
type Entry = CollectionEntry<CollectionName>;

function toDate(value?: string | Date): Date | undefined {
  if (!value) return undefined;
  try {
    return value instanceof Date ? value : new Date(value);
  } catch {
    return undefined;
  }
}

export interface FeedItem {
  link: string;
  title: string;
  description?: string;
  pubDate: Date;
}

export interface BuildRssOptions {
  language?: SupportedLanguage;
  collection?: CollectionName;
}

export async function buildRssItems({ language, collection }: BuildRssOptions = {}): Promise<{
  items: FeedItem[];
  lastBuildDate: Date;
}> {
  const rssConfig = getRssConfig();

  const collections = (collection ? [collection] : rssConfig.collections) as CollectionName[];
  const allEntries: Entry[] = (
    await Promise.all(
      collections.map((c) =>
        getCollection(c)
          .then((arr) => arr as Entry[])
          .catch(() => {
            return [] as Entry[];
          })
      )
    )
  ).flat();

  const filtered = allEntries.filter((e) => {
    const status = (e?.data?.publicationStatus as string | undefined) || 'draft';
    const isDraftFlag = e?.data?.draft === true;
    const langOk = language ? e?.data?.language === language : true;
    return !isDraftFlag && status === 'published' && langOk;
  });

  const items: FeedItem[] = filtered
    .map((e) => {
      const idSlug = e.id.replace(/^[a-z]{2}\//, '').replace(/\.(md|mdx)$/i, '');
      const lang = e.data.language || 'en';
      const slugWithId = e.data.canonicalId ? `${idSlug}-${e.data.canonicalId}` : idSlug;
      const path = `/${e.collection}/${slugWithId}`;
      const link = getLocalizedUrl(path, lang);

      const title = e.data.title || idSlug;
      const description = e.data.description || undefined;
      const published = toDate(e.data.firstPublishedAt || e.data.publishDate);
      const updated = toDate(e.data.updatedAt || e.data.modifiedDate || e.data.lastChangeDate);
      const pubDate = updated || published || new Date();

      return { link, title, description, pubDate };
    })
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, rssConfig.limit);

  const lastBuildDate = items.length > 0 ? items[0].pubDate : new Date();

  return { items, lastBuildDate };
}

export function getRssChannelMeta(scope?: { language?: SupportedLanguage; collection?: CollectionName }) {
  const siteInfo = getSiteInfo();
  const baseTitle = siteInfo.name;
  let suffix = ' — Recent content';
  if (scope?.language && scope?.collection) {
    suffix = ` — ${scope.language.toUpperCase()} ${scope.collection} updates`;
  } else if (scope?.language) {
    suffix = ` — ${scope.language.toUpperCase()} updates`;
  } else if (scope?.collection) {
    suffix = ` — ${scope.collection} updates`;
  }
  return {
    title: `${baseTitle}${suffix}`,
    description: siteInfo.description,
    siteUrl: siteInfo.url,
  };
}
