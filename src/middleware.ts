import type { MiddlewareHandler } from 'astro';

const SUPPORTED_LANGUAGES = ['de', 'en'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, request, redirect, cookies } = context;

  if (import.meta.env.DEV) {
    console.log('🔍 Middleware called for:', url.pathname);
  }

  // Skip for API routes and assets
  if (url.pathname.startsWith('/api/') || url.pathname.includes('.')) {
    if (import.meta.env.DEV) {
      console.log('⏭️ Skipping API/asset route:', url.pathname);
    }
    return next();
  }

  // Root path language detection
  if (url.pathname === '/') {
    if (import.meta.env.DEV) {
      console.log('🏠 Root path detected');
    }
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
      // Redirect to detected language homepage (no trailing slash)
      if (import.meta.env.DEV) {
        console.log('🔄 Redirecting to:', `/${preferredLang}`);
      }
      return redirect(`/${preferredLang}`, 302);
    } else {
      // Default to English for unclear cases to avoid interstitial
      cookies.set('preferred_lang', 'en', {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        path: '/',
      });
      if (import.meta.env.DEV) {
        console.log('🔄 Default redirect to: /en');
      }
      return redirect('/en', 302);
    }
  }

  // Handle language routes with trailing slashes (e.g., /en/, /de/)
  // Redirect to non-trailing slash versions to match trailingSlash: 'never' config
  const trailingSlashLangMatch = url.pathname.match(/^\/(en|de)\/$/);
  if (trailingSlashLangMatch) {
    const langCode = trailingSlashLangMatch[1];
    if (import.meta.env.DEV) {
      console.log('🔄 Trailing slash redirect:', `${url.pathname} -> /${langCode}`);
    }
    return redirect(`/${langCode}`, 302);
  }

  if (import.meta.env.DEV) {
    console.log('➡️ Continuing to next middleware/handler for:', url.pathname);
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
