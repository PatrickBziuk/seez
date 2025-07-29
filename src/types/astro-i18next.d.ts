declare module 'astro-i18next' {
  export function useTranslation(): { t: (key: string, ...args: unknown[]) => string };
  export default function astroI18next(config?: unknown): unknown;
}
