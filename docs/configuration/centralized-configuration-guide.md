/**
 * Centralized Configuration System Documentation
 * 
 * This document explains the new centralized configuration system for Seez,
 * which consolidates all site settings, secrets, theme configuration, and
 * feature flags into a single, manageable structure.
 */

# Centralized Configuration System

## Overview

The Seez project now uses a centralized configuration system that allows you to manage all aspects of your site from a single location. This includes:

- **Site Identity**: Name, URL, description, author, logo
- **Theme System**: Colors, typography, design tokens
- **Secrets & API Keys**: OpenAI, Formspree, Google Analytics
- **Feature Flags**: Enable/disable functionality
- **Content Settings**: Collection configuration
- **Multilingual Setup**: Language preferences and translation settings
- **Integration Settings**: Third-party service configuration

## Configuration File Structure

The main configuration is located in `src/config.yaml` and follows this structure:

```yaml
# Site Identity & Branding
site:
  name: 'Your Site Name'
  site: 'https://your-domain.com'
  title: 'Site Title'
  description: 'Site description'
  author: 'Your Name'
  logo:
    src: '~/assets/images/logo.svg'
    alt: 'Logo Alt Text'

# Theme & Design System
theme:
  colors:
    primary: '#2563eb'        # Your brand primary color
    secondary: '#7c3aed'      # Your brand secondary color
    # ... more colors
    light:                    # Light mode colors
      background: '#ffffff'
      text:
        primary: '#0f172a'
    dark:                     # Dark mode colors
      background: '#0f172a'
      text:
        primary: '#f8fafc'

# API Integrations
integrations:
  openai:
    enabled: true
    model: 'gpt-4o'
  contact:
    enabled: true
    provider: 'formspree'
    endpoint: 'https://formspree.io/f/your-form-id'

# Feature Flags
features:
  enableSearch: true
  enableComments: false
  enableTranslation: true
  # ... more features
```

## Environment Variables

Sensitive information like API keys should be stored in environment variables:

### Local Development (`.env.local`)
```env
# OpenAI API Key for translations
OPENAI_API_KEY=sk-proj-your-openai-key-here

# Translation quality threshold (0-100)
TRANSLATION_QUALITY_THRESHOLD=70

# Optional: Override Formspree endpoint
FORMSPREE_ENDPOINT=https://formspree.io/f/your-form-id

# Optional: Google Analytics ID
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Production (GitHub Secrets)
For production deployment, add these as GitHub repository secrets:
- `OPENAI_API_KEY`
- `FORMSPREE_ENDPOINT` (optional)
- `GOOGLE_ANALYTICS_ID` (optional)

## Customization Guide

### 1. Site Identity

Edit the `site` section in `config.yaml`:

```yaml
site:
  name: 'Your Brand Name'
  site: 'https://yourdomain.com'
  title: 'Your Site Title'
  description: 'Your site description for SEO'
  author: 'Your Name'
  logo:
    src: '~/assets/images/your-logo.svg'
    alt: 'Your Logo'
```

### 2. Theme Colors

Customize your brand colors in the `theme.colors` section:

```yaml
theme:
  colors:
    primary: '#your-primary-color'     # Main brand color
    secondary: '#your-secondary-color' # Secondary brand color
    accent: '#your-accent-color'       # Accent color for highlights
    
    # Light mode colors
    light:
      background: '#ffffff'
      surface: '#f8fafc'
      text:
        primary: '#0f172a'
        secondary: '#475569'
    
    # Dark mode colors
    dark:
      background: '#0f172a'
      surface: '#1e293b'
      text:
        primary: '#f8fafc'
        secondary: '#cbd5e1'
```

### 3. Homepage Configuration

Customize your homepage in the `homepage` section:

```yaml
homepage:
  hero:
    enabled: true
    title: 'Your Hero Title'
    subtitle: 'Your hero subtitle'
    cta:
      primary:
        text: 'Primary Button'
        url: '/your-primary-link'
      secondary:
        text: 'Secondary Button'
        url: '/your-secondary-link'
```

### 4. Navigation

Configure your site navigation:

```yaml
navigation:
  header:
    showLogo: true
    showThemeToggle: true
    showLanguageSwitch: true
    items:
      - text: 'Home'
        href: '/'
        icon: '🏠'
      - text: 'About'
        href: '/about'
        icon: '👋'
```

### 5. Feature Flags

Enable or disable features:

```yaml
features:
  enableSearch: true          # Site-wide search
  enableComments: false       # Comment system
  enableShare: true           # Social sharing
  enableTranslation: true     # Auto-translation
  enableTags: true           # Content tagging
```

## Environment Setup

### 1. Set up your OpenAI API Key

For local development:
1. Create `.env.local` in the project root
2. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

For production:
1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Add `OPENAI_API_KEY` as a repository secret

### 2. Configure Contact Form (Optional)

If you want to use the contact form:
1. Sign up at [Formspree](https://formspree.io)
2. Create a new form and get your endpoint URL
3. Update the `integrations.contact.endpoint` in `config.yaml`

### 3. Set up Google Analytics (Optional)

1. Create a Google Analytics 4 property
2. Get your measurement ID (starts with `G-`)
3. Add it to your environment variables as `GOOGLE_ANALYTICS_ID`

## Usage in Components

While the full TypeScript integration is being refined, you can access configuration values in your Astro components like this:

```astro
---
// Import the configuration
import config from '../config.yaml';

// Access configuration values
const siteName = config.site.name;
const primaryColor = config.theme.colors.primary;
const searchEnabled = config.features.enableSearch;
---

<h1>{siteName}</h1>
```

## Migration from Old Configuration

If you're upgrading from the old configuration system:

1. **Backup**: Save your current `config.yaml`
2. **Update**: Replace with the new comprehensive structure
3. **Migrate**: Copy your existing values to the new sections
4. **Environment**: Move sensitive values to `.env.local`
5. **Test**: Run `pnpm run dev` to ensure everything works

## Troubleshooting

### Configuration not loading
- Ensure `config.yaml` syntax is valid
- Check that all required sections are present
- Verify environment variables are set correctly

### API keys not working
- Check that `.env.local` exists and contains your keys
- Ensure keys are not quoted in the environment file
- Verify the key format is correct (OpenAI keys start with `sk-`)

### Theme colors not applying
- Clear your browser cache
- Check that color values are valid CSS colors
- Ensure the theme system is properly configured

## Benefits

1. **Single Source of Truth**: All configuration in one place
2. **Type Safety**: TypeScript support for configuration values
3. **Environment Aware**: Automatic environment variable integration
4. **Theme Flexibility**: Easy color and design customization
5. **Feature Flags**: Toggle functionality without code changes
6. **Security**: Sensitive data in environment variables
7. **Documentation**: Self-documenting configuration structure

## Next Steps

1. Review and customize `src/config.yaml` for your needs
2. Set up your `.env.local` with API keys
3. Test the configuration by running the development server
4. Deploy with proper environment variables configured

This centralized system makes it much easier to manage and customize your Seez site while maintaining security and flexibility.
