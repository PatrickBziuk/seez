# Complete Configuration Guide: config.yaml

This document provides comprehensive documentation for the centralized configuration system in `src/config.yaml`. This file is the **single source of truth** for all site settings, allowing you to clone the repository and customize everything by editing just this one file.

## 🎯 Quick Start for New Sites

To set up a new site based on this repository:

1. **Clone the repository**
2. **Edit `src/config.yaml`** with your site details (all sections below)
3. **Set up environment variables** (`.env.local`)
4. **Run `pnpm install && pnpm run dev`**

Everything else should work automatically based on your configuration!

---

## 📋 Configuration Sections

### 1. Site Identity & Branding

```yaml
site:
  name: 'Seez'                    # Site name (appears in title, header, metadata)
  site: 'https://seez.eu'         # Full site URL (used for canonical URLs, sitemaps)
  base: '/'                       # Base path (for subdirectory deployments)
  trailingSlash: false           # Whether URLs should have trailing slashes
  title: 'Seez - Personal Portfolio & Digital Sanctuary'
  description: 'A multilingual platform for sharing projects, thoughts, and creative endeavors.'
  author: 'Patrick Bziuk'        # Site author (used in metadata)
  lang: 'en'                     # Default language
  
  # Logo configuration
  logo:
    src: '~/assets/images/logo.svg'  # Path to logo file
    alt: 'Seez Logo'                 # Alt text for accessibility
    width: 132                       # Logo width in pixels
    height: 32                       # Logo height in pixels
  
  # SEO verification
  googleSiteVerificationId: xxxxxxxxxxxxxxxxxx  # Google Search Console ID
```

**Effects on Application:**
- `name`: Used in `<title>` tags, header logo text, metadata
- `site`: Base URL for canonical links, Open Graph URLs, sitemaps
- `title`: Default page title template
- `description`: Default meta description
- `logo`: Rendered in header component, used in metadata
- Maps to: `SITE` config in `astrowind:config` module

**Used in Components:**
- `src/layouts/Layout.astro` - Title and metadata
- `src/components/core/layout/Header.astro` - Logo and site name
- `src/pages/sitemap.xml.ts` - Sitemap generation
- `src/components/core/meta/SEO.astro` - Meta tags

---

### 2. Theme & Design System

```yaml
theme:
  colors:
    # Brand colors - used throughout the application
    primary: '#2563eb'        # Primary brand color (buttons, links)
    primaryDark: '#1d4ed8'    # Primary color dark variant
    secondary: '#7c3aed'      # Secondary accent color
    accent: '#f59e0b'         # Accent color (highlights, CTAs)
    
    # Semantic colors - used for UI states
    success: '#10b981'        # Success states (form validation, alerts)
    warning: '#f59e0b'        # Warning states
    error: '#ef4444'          # Error states
    info: '#3b82f6'           # Informational states
    
    # Light mode colors
    light:
      background: '#ffffff'   # Page background
      surface: '#f8fafc'      # Card/panel backgrounds
      border: '#e2e8f0'       # Border colors
      text:
        primary: '#0f172a'    # Main text color
        secondary: '#475569'  # Secondary text (captions, labels)
        muted: '#64748b'      # Muted text (metadata)
    
    # Dark mode colors
    dark:
      background: '#0f172a'   # Dark page background
      surface: '#1e293b'      # Dark card backgrounds
      border: '#334155'       # Dark border colors
      text:
        primary: '#f8fafc'    # Dark mode main text
        secondary: '#cbd5e1'  # Dark mode secondary text
        muted: '#94a3b8'      # Dark mode muted text
  
  # Typography settings
  typography:
    fontFamily:
      sans: ['Inter', 'system-ui', 'sans-serif']
      serif: ['Georgia', 'serif']
      mono: ['JetBrains Mono', 'Consolas', 'monospace']
```

**Effects on Application:**
- Colors are converted to CSS custom properties (CSS variables)
- Applied globally via Tailwind CSS configuration
- Used for consistent theming across light/dark modes
- Typography fonts loaded and applied site-wide

**Used in Components:**
- Applied globally via `src/assets/styles/tailwind.css`
- `src/utils/config.ts` - ThemeUtils for CSS variable manipulation
- All components inherit these color values
- Automatically switches between light/dark variants

---

### 3. SEO & Metadata

```yaml
metadata:
  title:
    default: 'Seez'           # Default title (fallback)
    template: '%s | Seez'     # Title template (%s = page title)
  description: 'A multilingual platform for sharing projects, thoughts, and creative endeavors.'
  robots:
    index: true              # Allow search engine indexing
    follow: true             # Allow following links
  openGraph:
    site_name: 'Seez'
    images:
      - url: '~/assets/images/default.png'
        width: 1200
        height: 628
    type: website
  twitter:
    handle: '@seez_eu'       # Twitter handle for Twitter Cards
    site: '@seez_eu'
    cardType: summary_large_image
```

**Effects on Application:**
- Generates proper `<meta>` tags for SEO
- Creates Open Graph tags for social media sharing
- Configures Twitter Card metadata
- Sets up robots.txt directives

**Used in Components:**
- `src/components/core/meta/SEO.astro` - Main SEO component
- `src/layouts/Layout.astro` - Page-level metadata
- `src/pages/robots.txt.ts` - Robots.txt generation

---

### 4. Multilingual Configuration

```yaml
i18n:
  language: 'en'              # Default language
  textDirection: 'ltr'        # Text direction (ltr/rtl)
  locales: ['en', 'de']       # Supported languages
  
  # Translation settings
  translations:
    autoGenerate: true        # Enable automatic AI translation
    qualityThreshold: 70      # Minimum quality score (0-100)
    provider: 'openai'        # Translation provider
    model: 'gpt-4o'          # AI model to use
    
    # Environmental impact tracking
    tracking:
      enabled: true           # Track CO₂ emissions
      co2PerToken: 0.0000043  # Grams CO₂ per token
```

**Effects on Application:**
- Sets up language routing (`/en/`, `/de/`)
- Configures automatic translation pipeline
- Enables environmental impact tracking
- Controls translation quality thresholds

**Used in Components:**
- `src/middleware.ts` - Language detection and routing
- `src/components/core/layout/LanguageSwitcher.astro` - Language selection
- `scripts/translations/` - All translation scripts
- `src/utils/i18n.ts` - Internationalization utilities

---

### 5. API Keys & Integrations

```yaml
integrations:
  # OpenAI for translations and AI features
  openai:
    enabled: true
    model: 'gpt-4o'          # AI model for translations
    maxTokens: 2000          # Maximum tokens per request
    temperature: 0.3         # Creativity level (0.0-1.0)
  
  # Contact form integration
  contact:
    enabled: true
    provider: 'formspree'
    endpoint: 'https://formspree.io/f/mwkgbkkp'
  
  # Search functionality
  search:
    enabled: true
    provider: 'pagefind'     # Search provider
    hotkeys: ['/', '.']      # Keyboard shortcuts to open search
```

**Effects on Application:**
- Enables/disables major features
- Configures third-party service integration
- Controls AI translation behavior
- Sets up contact form processing

**Environment Variables Required:**
- `OPENAI_API_KEY` - For AI translations
- `FORMSPREE_ENDPOINT` - For contact forms (optional override)

**Used in Components:**
- `src/components/Search.astro` - Search functionality
- `src/pages/[lang]/contact.astro` - Contact form
- `scripts/translations/` - AI translation scripts
- `src/utils/config.ts` - ConfigUtils for environment variables

---

### 6. Content Configuration

```yaml
content:
  collections:
    books:
      enabled: true           # Enable books collection
      title: 'Books'         # Display title
      description: 'Literary works and creative writing'
      icon: '📚'             # Emoji icon for navigation
    
    projects:
      enabled: true
      title: 'Projects'
      description: 'Software projects and technical endeavors'
      icon: '🚀'
    
    lab:
      enabled: true
      title: 'Lab'
      description: 'Experiments and technical explorations'
      icon: '🧪'
    
    life:
      enabled: true
      title: 'Life'
      description: 'Personal reflections and experiences'
      icon: '🌱'
```

**Effects on Application:**
- Controls which content collections are active
- Sets navigation labels and descriptions
- Defines collection icons for UI
- Enables/disables entire content sections

**Used in Components:**
- `src/navigation.ts` - Main navigation generation
- `src/components/core/layout/Header.astro` - Navigation menu
- `src/pages/[lang]/[collection]/index.astro` - Collection listing pages
- `src/utils/config.ts` - ContentUtils for icons and titles

---

### 7. Homepage Configuration

```yaml
homepage:
  # Hero section
  hero:
    enabled: true
    title: 'Welcome to Seez'
    subtitle: 'A multilingual platform for sharing projects, thoughts, and creative endeavors.'
    showImage: true
    
    # Call-to-action buttons
    cta:
      primary:
        text: 'Explore Projects'
        url: '/en/projects'
        style: 'primary'
      secondary:
        text: 'Read About Me'
        url: '/en/about'
        style: 'secondary'
  
  # Featured content sections
  featured:
    enabled: true
    sections:
      - type: 'projects'      # Which collection to feature
        title: 'Latest Projects'
        limit: 3              # How many items to show
        showMore: true        # Show "View All" link
      
      - type: 'books'
        title: 'Recent Writing'
        limit: 2
        showMore: true
```

**Effects on Application:**
- Controls homepage layout and content
- Sets hero section text and CTAs
- Configures featured content sections
- Determines how many items to show

**Used in Components:**
- `src/pages/index.astro` - Homepage layout
- `src/components/marketing/content/Hero.astro` - Hero section
- `src/components/marketing/content/FeaturedContent.astro` - Featured sections

---

### 8. Navigation Configuration

```yaml
navigation:
  # Header navigation
  header:
    showLogo: true           # Display site logo
    showThemeToggle: true    # Show dark/light mode toggle
    showLanguageSwitch: true # Show language switcher
    showSearch: true         # Show search button
    
    # Main navigation items
    items:
      - text: 'Projects'     # Navigation label
        href: '/projects'    # URL (language prefix added automatically)
        icon: '🚀'          # Optional icon
      - text: 'Books'
        href: '/books'
        icon: '📚'
      # ... more items
  
  # Footer navigation
  footer:
    enabled: true
    
    # Social media links
    social:
      - platform: 'github'
        url: 'https://github.com/PatrickBziuk'
        icon: 'github'
      - platform: 'email'
        url: 'mailto:hello@seez.eu'
        icon: 'mail'
    
    # Legal pages
    legal:
      - text: 'Privacy Policy'
        href: '/legal/privacy'
      - text: 'Impressum'
        href: '/legal/impressum'
```

**Effects on Application:**
- Controls header/footer content and behavior
- Sets navigation menu items
- Configures social media links
- Enables/disables navigation features

**Used in Components:**
- `src/components/core/layout/Header.astro` - Main navigation
- `src/components/core/layout/Footer.astro` - Footer links
- `src/navigation.ts` - Navigation utilities
- `src/utils/permalinks.ts` - URL generation

---

### 9. Feature Flags

```yaml
features:
  # Content features
  enableComments: false       # Show comment sections
  enableShare: true          # Show social sharing buttons
  enablePrint: true          # Show print buttons
  enableSearch: true         # Enable site search
  enableTags: true           # Show tag navigation
  
  # Translation features
  enableAutoTranslation: true     # AI translation pipeline
  enableTranslationHooks: true    # Git hooks for translations
  showTranslationMetadata: true   # Show translation info
  
  # Performance features
  enableImageOptimization: true   # Optimize images
  enableMinification: true        # Minify output
  enableCompression: true         # Compress assets
```

**Effects on Application:**
- Enables/disables entire features
- Controls performance optimizations
- Manages translation pipeline
- Fine-tunes user experience

**Used in Components:**
- `src/utils/config.ts` - FeatureFlags utilities
- `src/components/content/SocialShare.astro` - Sharing features
- `src/components/Search.astro` - Search functionality
- `astro.config.ts` - Build optimizations

---

### 10. Legacy Configuration

```yaml
# Legacy blog configuration (kept for compatibility)
apps:
  blog:
    isEnabled: false         # Disable blog functionality
    # ... other blog settings

analytics:
  vendors:
    googleAnalytics:
      id: null              # Google Analytics ID (or "G-XXXXXXXXXX")

ui:
  theme: 'system'           # Theme preference: system/light/dark
```

**Effects on Application:**
- Maintains backward compatibility
- Controls analytics integration
- Sets default theme preference

---

## 🔧 Configuration Loading & Usage

### How Configuration is Loaded

1. **Build Time**: `vendor/integration/index.ts` loads `src/config.yaml`
2. **Parsing**: YAML is parsed and converted to TypeScript interfaces
3. **Virtual Module**: Configuration is made available as `astrowind:config`
4. **Components**: Import configuration using `import { SITE } from 'astrowind:config'`

### TypeScript Integration

```typescript
// Configuration types are defined in:
src/types/config.ts                    // Complete type definitions
vendor/integration/utils/configBuilder.ts  // Build-time processing

// Usage in components:
import { SITE, METADATA, I18N } from 'astrowind:config';
```

### Environment Variables

Some configuration values can be overridden by environment variables:

```bash
# Required for AI features
OPENAI_API_KEY=sk-proj-...

# Optional overrides
TRANSLATION_QUALITY_THRESHOLD=80
FORMSPREE_ENDPOINT=https://formspree.io/f/...
GOOGLE_ANALYTICS_ID=G-...
```

### Configuration Utilities

```typescript
// Utility functions for common configuration tasks
import { ConfigUtils, FeatureFlags, ThemeUtils } from '~/utils/config';

// Check if features are enabled
const isSearchEnabled = FeatureFlags.isEnabled('enableSearch', config);

// Get environment-aware values
const apiKey = ConfigUtils.getOpenAIKey();

// Theme management
ThemeUtils.applyThemeColors(config.theme.colors);
```

---

## 🚀 Setting Up a New Site

### Step-by-Step Process

1. **Clone Repository**
   ```bash
   git clone https://github.com/PatrickBziuk/seez.git my-new-site
   cd my-new-site
   ```

2. **Edit Configuration**
   ```bash
   # Edit src/config.yaml with your site details
   code src/config.yaml
   ```

3. **Key Changes to Make**
   - `site.name` - Your site name
   - `site.site` - Your domain
   - `site.title` - Your site title
   - `site.description` - Your description
   - `site.author` - Your name
   - `site.logo` - Your logo path
   - `theme.colors` - Your brand colors
   - `metadata.twitter.handle` - Your Twitter
   - `navigation.footer.social` - Your social links
   - `integrations.contact.endpoint` - Your contact form

4. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

5. **Install and Run**
   ```bash
   pnpm install
   pnpm run dev
   ```

Your site should now be running with your configuration!

---

## 📊 Configuration Impact Map

| Configuration Section | Affects Components | Build Process | Runtime Behavior |
|----------------------|-------------------|---------------|------------------|
| `site.*` | Header, Footer, SEO | Sitemap, robots.txt | URL generation |
| `theme.colors` | All components | CSS generation | Theme switching |
| `i18n.*` | All pages | Route generation | Language routing |
| `integrations.*` | Search, Contact | Feature bundling | API connections |
| `content.collections` | Navigation, Pages | Route creation | Content loading |
| `navigation.*` | Header, Footer | Menu generation | Link behavior |
| `features.*` | Conditional features | Bundle optimization | Feature availability |

---

## 🔍 Troubleshooting

### Common Issues

1. **Configuration not loading**
   - Check YAML syntax with `pnpm run check`
   - Ensure file is at `src/config.yaml`
   - Restart dev server after changes

2. **Environment variables not working**
   - Check `.env.local` exists and has correct format
   - Restart dev server after env changes
   - Verify variable names match exactly

3. **Theme colors not applying**
   - Check color format is valid hex code
   - Ensure no YAML syntax errors in theme section
   - Check browser dev tools for CSS custom properties

4. **Features not enabling/disabling**
   - Verify feature flag names match exactly
   - Check component imports FeatureFlags utility
   - Restart dev server for build-time features

### Validation

Run these commands to validate your configuration:

```bash
pnpm run check        # Full validation
pnpm run check:astro  # Astro-specific checks
pnpm run dev          # Test in development
```

---

This configuration system allows you to completely customize your site by editing just one file. All components, pages, and build processes respect these settings, making it easy to create new sites or dramatically change existing ones.
