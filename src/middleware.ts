import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = (context, next) => {
  const { url, redirect } = context;
  
  if (import.meta.env.DEV) {
    console.log('🌐 Middleware hit:', url.pathname);
  }

  // Skip for API routes and assets
  if (url.pathname.startsWith('/api/') || url.pathname.includes('.')) {
    if (import.meta.env.DEV) {
      console.log('⏭️ Skipping API/asset route:', url.pathname);
    }
    return next();
  }

  // Root path language detection - commented out to serve content directly
  // Users will see the root page content which includes navigation to language versions
  /*
  if (url.pathname === '/') {
    // Language detection logic disabled - page content will be served directly
  }
  */

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
