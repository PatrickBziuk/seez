/**
 * SEO Alternates Utility
 * Builds hreflang alternate links for multilingual SEO
 * Part of Plan 10036 Phase 1 - T36-002
 */

export interface AlternateLink {
  hreflang: string;
  href: string;
}

/**
 * Build alternate language links for the current page
 * @param astroAPI - Astro API object containing URL and params
 * @param supportedLanguages - Array of supported language codes
 * @returns Array of alternate link objects for hreflang tags
 */
export function buildAlternates(
  astroAPI: { url: URL; params: Record<string, string | undefined>; site?: URL },
  supportedLanguages: string[]
): AlternateLink[] {
  // Extract pathname without language prefix
  const pathname = astroAPI.url.pathname;
  const stripped = pathname.replace(/^\/(en|de)\//, '');

  // Build alternates for all supported languages
  return supportedLanguages.map((lang) => ({
    hreflang: lang,
    href: new URL(`/${lang}/${stripped}`, astroAPI.site || 'https://seez.eu').toString(),
  }));
}

/**
 * Check if a page should have hreflang alternates
 * Excludes utility pages like 404, admin, etc.
 * @param pathname - The current page pathname
 * @returns Whether the page should have alternates
 */
export function shouldHaveAlternates(pathname: string): boolean {
  const excludePatterns = ['/admin', '/api', '/404', '/500', '/robots.txt', '/sitemap'];

  return !excludePatterns.some((pattern) => pathname.startsWith(pattern));
}
