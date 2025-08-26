import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';

import astrowind from './vendor/integration';
import pagefind from 'astro-pagefind';
// import astroI18next from 'astro-i18next';

import {
  readingTimeRemarkPlugin,
  remarkModifiedTime,
  responsiveTablesRehypePlugin,
  lazyImagesRehypePlugin,
} from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',
  trailingSlash: 'never', // Enforce no trailing slashes for consistency
  site: 'https://seez.eu',

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      // T36-003: Locale-aware sitemap with xhtml:link alternates
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          de: 'de',
        },
      },
    }),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    partytown({
      config: { forward: ['dataLayer.push'] },
    }),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: {
        // Enable image compression for Plan 10030
        sharp: {
          jpeg: { quality: 85, progressive: true },
          png: { quality: 85, progressive: true },
          webp: { quality: 85 },
          avif: { quality: 80 },
        },
      },
      JavaScript: true,
      SVG: true,
      Logger: 1,
    }),

    astrowind({
      config: './src/config.yaml',
    }),

    // Pagefind must be last integration for proper indexing
    pagefind(),

    // astroI18next({
    //   defaultLanguage: 'en',
    //   supportedLanguages: ['en', 'de'],
    //   fallbackLng: 'en',
    //   localesDir: './src/locales',
    // }) as AstroIntegration,
    ...whenExternalScripts(),
  ],

  image: {
    domains: ['cdn.pixabay.com'],
    // Add service configuration for optimized image processing
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689, // ~16K x 16K pixels
      },
    },
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin, remarkModifiedTime],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    // T30-013: JavaScript bundle optimization
    build: {
      rollupOptions: {
        output: {
          // Code splitting for better caching
          manualChunks: {
            vendor: ['astro/transitions', 'astro/client'],
            ui: ['astro-icon/components'],
          },
        },
      },
      // Enable minification
      minify: 'esbuild',
      // Source maps for debugging
      sourcemap: false, // Disable in production for smaller bundles
    },
    // Tree shaking optimization
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  },
});
