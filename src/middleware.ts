import type { MiddlewareHandler } from 'astro';

const SUPPORTED_LANGUAGES = ['de', 'en'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, request, redirect, cookies } = context;

  // Skip for API routes and assets
  if (url.pathname.startsWith('/api/') || url.pathname.includes('.')) {
    return next();
  }

  // Root path language detection
  if (url.pathname === '/') {
    const preferredLang = determineLanguage(
      request.headers.get('accept-language'),
      cookies.get('preferred_lang')?.value
    );

    if (preferredLang) {
      cookies.set('preferred_lang', preferredLang, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        path: '/',
      });
      return redirect(`/${preferredLang}/`, 302);
    } else {
      // Show language selection page
      return next();
    }
  }

  return next();
};

function determineLanguage(acceptLanguage: string | null, cookiePreference?: string): string | null {
  // Cookie preference takes priority
  if (cookiePreference && SUPPORTED_LANGUAGES.includes(cookiePreference as SupportedLanguage)) {
    return cookiePreference;
  }

  // Parse Accept-Language header
  if (acceptLanguage) {
    const languages = parseAcceptLanguage(acceptLanguage);
    for (const lang of languages) {
      const base = lang.split('-')[0].toLowerCase();
      if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) {
        return base;
      }
    }
  }

  return null; // Show language selection page
}

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((lang) => lang.split(';')[0].trim())
    .sort((a, b) => {
      const qA = parseFloat(header.match(new RegExp(`${a};q=([0-9.]+)`))?.[1] || '1');
      const qB = parseFloat(header.match(new RegExp(`${b};q=([0-9.]+)`))?.[1] || '1');
      return qB - qA;
    });
}
