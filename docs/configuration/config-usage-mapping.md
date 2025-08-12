# Configuration Usage Analysis and Mapping

This document provides a comprehensive analysis of how `src/config.yaml` values are used throughout the Seez application, ensuring proper integration and helping developers understand the configuration system's impact.

## 🔄 Configuration Loading Flow

```
src/config.yaml
    ↓
vendor/integration/utils/loadConfig.ts (YAML parsing)
    ↓
vendor/integration/utils/configBuilder.ts (Type mapping)
    ↓
vendor/integration/index.ts (Virtual module creation)
    ↓
astrowind:config (Virtual module available to components)
```

## 📊 Configuration Usage Mapping

### 1. Site Configuration (`site.*`)

**Used by:**
- `src/components/core/meta/SiteVerification.astro`
  ```astro
  import { SITE } from 'astrowind:config';
  {SITE.googleSiteVerificationId && (
    <meta name="google-site-verification" content={SITE.googleSiteVerificationId} />
  )}
  ```

- `src/pages/sitemap.xml.ts`
  ```typescript
  import { SITE } from 'astrowind:config';
  // Uses SITE.site for canonical URLs in sitemap
  ```

- `src/pages/rss.xml.ts`
  ```typescript
  import { SITE, METADATA } from 'astrowind:config';
  // Uses SITE.site and SITE.title for RSS feed generation
  ```

- `src/utils/permalinks.ts`
  ```typescript
  import { SITE } from 'astrowind:config';
  // Uses SITE.base for URL path construction
  ```

**Astro Config Impact:**
```typescript
// In vendor/integration/index.ts
updateConfig({
  site: SITE.site,           // Sets Astro.site
  base: SITE.base,           // Sets Astro.base
  trailingSlash: SITE.trailingSlash ? 'always' : 'never'
});
```

### 2. Theme Configuration (`theme.*`)

**CSS Custom Properties Generated:**
- Theme colors are applied globally via CSS custom properties
- Processed in build step and available to all components
- Handled by `src/utils/config.ts` ThemeUtils

**Usage Pattern:**
```typescript
import { ThemeUtils } from '~/utils/config';
ThemeUtils.applyThemeColors(config.theme.colors);
```

**Affected Components:**
- All components inherit theme colors through CSS custom properties
- Dark/light mode switching via theme variants

### 3. Metadata Configuration (`metadata.*`)

**Used by:**
- `src/pages/rss.xml.ts`
- Components in `src/components/core/meta/` directory
- SEO components for Open Graph and Twitter Card generation

### 4. I18n Configuration (`i18n.*`)

**Used by:**
- `src/utils/utils.ts`
  ```typescript
  import { I18N } from 'astrowind:config';
  // Uses I18N.language for date formatting and locale handling
  ```

- `src/components/content/blog/ToBlogLink.astro`
  ```typescript
  import { I18N } from 'astrowind:config';
  // Uses I18N settings for internationalized links
  ```

**Runtime Effects:**
- Language routing in `src/middleware.ts`
- Translation pipeline configuration
- Locale-aware date formatting

### 5. Blog Configuration (`apps.blog.*`)

**Used by:**
- `src/utils/blog.ts`
  ```typescript
  import { APP_BLOG } from 'astrowind:config';
  // Uses APP_BLOG for pagination, permalinks, and blog settings
  ```

- `src/utils/permalinks.ts`
  ```typescript
  import { APP_BLOG } from 'astrowind:config';
  // Uses APP_BLOG.post.permalink and APP_BLOG.list.pathname
  ```

- Blog-related components:
  - `src/components/marketing/content/BlogLatestPosts.astro`
  - `src/components/marketing/content/BlogHighlightedPosts.astro`
  - `src/components/content/blog/*.astro` (all blog components)

### 6. UI Configuration (`ui.*`)

**Used by:**
- `src/components/core/layout/ToggleTheme.astro`
  ```typescript
  import { UI } from 'astrowind:config';
  // Uses UI.theme for default theme preference
  ```

- `src/components/core/meta/BasicScripts.astro`
- `src/components/core/meta/ApplyColorMode.astro`

### 7. Analytics Configuration (`analytics.*`)

**Used by:**
- `src/components/core/meta/Analytics.astro`
  ```typescript
  import { ANALYTICS } from 'astrowind:config';
  // Uses ANALYTICS.vendors.googleAnalytics for GA setup
  ```

## 🚧 Configuration Migration Status

### ✅ Fully Migrated Components

1. **Layout System**
   - `src/layouts/Layout.astro` - Uses seez.config
   - `src/components/core/layout/Footer.astro` - Uses seez.config

2. **Meta Components**
   - `src/components/core/meta/Metadata.astro` - Uses seez.config

3. **Main Configuration**
   - `src/config/seez.config.ts` - New centralized config system

### 🔄 Partially Migrated Components

1. **Mixed Usage** (some astrowind:config, some seez.config)
   - Various components still reference both systems

### ❌ Still Using Legacy astrowind:config

1. **Core Utilities**
   - `src/utils/utils.ts`
   - `src/utils/permalinks.ts`
   - `src/utils/blog.ts`

2. **Pages**
   - `src/pages/sitemap.xml.ts`
   - `src/pages/rss.xml.ts`

3. **Meta Components**
   - `src/components/core/meta/SiteVerification.astro`
   - `src/components/core/meta/BasicScripts.astro`
   - `src/components/core/meta/ApplyColorMode.astro`
   - `src/components/core/meta/Analytics.astro`

4. **UI Components**
   - `src/components/core/layout/ToggleTheme.astro`

5. **Blog Components** (all of them)
   - `src/components/marketing/content/BlogLatestPosts.astro`
   - `src/components/marketing/content/BlogHighlightedPosts.astro`
   - All components in `src/components/content/blog/`

## 🎯 Configuration Features by Section

### Environment Variables Integration

```typescript
// From src/utils/config.ts
class ConfigUtils {
  static getOpenAIKey(): string | null           // OPENAI_API_KEY
  static getTranslationQualityThreshold(): number // TRANSLATION_QUALITY_THRESHOLD  
  static getFormspreeEndpoint(): string | null   // FORMSPREE_ENDPOINT
  static getGoogleAnalyticsId(): string | null   // GOOGLE_ANALYTICS_ID
}
```

**Priority:** Environment variables override config.yaml values when available.

### Feature Flags System

```typescript
// From src/utils/config.ts
class FeatureFlags {
  static isEnabled(feature: string, config?: object): boolean
  
  // Available flags:
  static readonly DEFAULTS = {
    enableSearch: true,
    enableComments: false,
    enableShare: true,
    enablePrint: true,
    enableTags: true,
    enableAutoTranslation: true,
    enableTranslationHooks: true,
    showTranslationMetadata: true,
    enableImageOptimization: true,
    enableMinification: true,
    enableCompression: true,
  }
}
```

### Theme Management

```typescript
// From src/utils/config.ts  
class ThemeUtils {
  static readonly CSS_VARS = {
    PRIMARY: '--color-primary',
    SECONDARY: '--color-secondary',
    // ... all theme CSS variables
  }
  
  static getCSSVar(name: string): string
  static setCSSVar(name: string, value: string): void
  static applyThemeColors(colors: Record<string, string>): void
}
```

### Navigation Utilities

```typescript
// From src/utils/config.ts
class NavigationUtils {
  static buildUrl(path: string, lang: string = 'en'): string
  static getCurrentLanguage(url: string = ''): string
  static getCleanPath(path: string): string
}
```

### Content Utilities

```typescript
// From src/utils/config.ts
class ContentUtils {
  static readonly COLLECTION_ICONS = {
    books: '📚',
    projects: '🚀', 
    lab: '🧪',
    life: '🌱',
  }
  
  static getCollectionIcon(collection: string): string
  static getCollectionTitle(collection: string): string
}
```

## 🔗 Build-Time vs Runtime Usage

### Build-Time Configuration

**Processed during build:**
- Site URL and base path (affects route generation)
- Feature flags (affects bundle size via tree-shaking)
- Theme colors (generates CSS custom properties)
- Content collections (affects static route generation)

**Files involved:**
- `astro.config.ts` - Core Astro configuration
- `vendor/integration/index.ts` - Configuration loading
- `src/pages/sitemap.xml.ts` - Sitemap generation
- `src/pages/rss.xml.ts` - RSS feed generation

### Runtime Configuration

**Used at runtime:**
- Theme switching
- Language routing
- Feature flag checking
- API integrations
- Content display

**Files involved:**
- `src/middleware.ts` - Language routing
- `src/utils/config.ts` - Runtime utilities
- All component files - Feature flags and display

## 🐛 Common Configuration Issues

### 1. Missing Virtual Module Imports

**Problem:** Components import from `astrowind:config` but module not available
**Solution:** Ensure `vendor/integration` is properly configured in `astro.config.ts`

### 2. Type Mismatches

**Problem:** TypeScript errors when accessing config properties
**Solution:** Update `src/types/config.ts` to match actual config structure

### 3. Environment Variables Not Loading

**Problem:** API keys or overrides not working
**Solution:** Check `.env.local` exists and restart dev server

### 4. Configuration Changes Not Applying

**Problem:** Config changes don't appear in application
**Solution:** Restart dev server (config is loaded at build time)

## 📈 Configuration Performance Impact

### Bundle Size

**Factors affecting bundle size:**
- Feature flags (tree-shaking eliminates disabled features)
- Theme configuration (CSS custom properties generation)
- Blog configuration (affects blog-related component inclusion)

### Build Time

**Factors affecting build time:**
- Content collection configuration (affects route generation)
- Image optimization settings
- Minification and compression settings

### Runtime Performance

**Factors affecting runtime:**
- Language detection and routing
- Theme switching
- Search functionality
- Analytics tracking

## 🔧 Recommended Migration Path

### Phase 1: Update Legacy Components

1. Replace `astrowind:config` imports with direct config.yaml imports
2. Update TypeScript interfaces to match current config structure
3. Test all components work with new configuration system

### Phase 2: Enhance Configuration System

1. Add missing configuration sections
2. Implement proper validation
3. Add development-time configuration warnings

### Phase 3: Optimize Performance

1. Implement better tree-shaking for feature flags
2. Optimize theme CSS generation
3. Add configuration caching for better performance

## 📝 Configuration Validation

### Required for Proper Function

```yaml
# Minimum required configuration
site:
  name: "Site Name"        # Required
  site: "https://..."      # Required for sitemap
  
i18n:
  locales: ["en", "de"]    # Required for routing

content:
  collections:             # At least one collection required
    projects:
      enabled: true
```

### Optional But Recommended

```yaml
theme:
  colors:                  # Recommended for consistent theming
    primary: "#..."
    
metadata:
  title:                   # Recommended for SEO
    default: "..."
    template: "%s | ..."
    
integrations:
  search:                  # Recommended for user experience
    enabled: true
```

This mapping ensures that all configuration changes in `src/config.yaml` are properly reflected throughout the application and helps identify components that need updates when configuration changes.
