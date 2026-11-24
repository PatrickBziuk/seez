import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';
import typographyPlugin from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}'],
  safelist: [
    'dark',
    'hidden',
    'md:flex',
    'md:hidden',
    'active',
    'current',
    'aw-link-active',
    // Animation classes
    'fade',
    'animate-fade',
    // Mobile navigation classes
    'mobile-nav',
    'expanded',
    // Language switcher classes
    'language-switcher',
    'language-dropdown',
    // Social share classes
    'social-links',
    // Theme toggle classes
    'theme-toggle',
  ],
  theme: {
    extend: {
      colors: {
        // Seez frame tokens (src/assets/styles/seez.css)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: 'var(--text)',
        'ink-muted': 'var(--text-muted)',
        'ink-faint': 'var(--text-faint)',
        // Legacy grays used by AstroWind templates, lifted so small text stays >= 4.5:1 on --bg/--surface
        gray: { ...colors.gray, 400: '#B4B1C0', 500: '#A9A6B6', 600: '#8A8797' },
        slate: { ...colors.slate, 400: '#B4B1C0', 500: '#A9A6B6', 600: '#8A8797' },
        primary: 'var(--aw-color-primary)',
        secondary: 'var(--aw-color-secondary)',
        accent: 'var(--aw-color-accent)',
        default: 'var(--aw-color-text-default)',
        muted: 'var(--aw-color-text-muted)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
        sans: ['var(--aw-font-sans, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--aw-font-serif, ui-serif)', ...defaultTheme.fontFamily.serif],
        heading: ['var(--aw-font-heading, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
      },

      animation: {
        // Scroll-in animations are retired (KONZEPT B7): content is visible at once.
        fade: 'fadeInUp 1ms both',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(2rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    typographyPlugin,
    plugin(({ addVariant }) => {
      addVariant('intersect', '&:not([no-intersect])');
    }),
  ],
  darkMode: 'class',
};
