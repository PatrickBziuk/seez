# Quick Site Setup Guide: From Zero to Live in 10 Minutes

This guide shows you how to set up a completely new website based on the Seez repository by simply editing the configuration file. No deep technical knowledge required!

## 🚀 Overview

The Seez repository is designed to be **instantly reusable**. Everything is controlled by a single configuration file (`src/config.yaml`), so you can:

1. Clone the repository
2. Edit one configuration file
3. Deploy your site

Everything else (routing, navigation, theming, content management) adapts automatically to your configuration.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)
- Domain name (optional, can use Netlify/Vercel subdomain)

---

## 🎯 Step-by-Step Setup

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/PatrickBziuk/seez.git my-awesome-site
cd my-awesome-site

# Install dependencies
pnpm install
# or: npm install
```

### Step 2: Essential Configuration Changes

Open `src/config.yaml` and change these **required** values:

```yaml
# Change these to your site details
site:
  name: 'Your Site Name'                    # ← Your site name
  site: 'https://yoursite.com'              # ← Your domain
  title: 'Your Site - Your Tagline'         # ← Your site title
  description: 'Your site description'      # ← SEO description
  author: 'Your Name'                       # ← Your name
  
  # Update logo path (or keep default)
  logo:
    src: '~/assets/images/logo.svg'          # ← Your logo file
    alt: 'Your Site Logo'                   # ← Logo alt text

# Update colors to match your brand
theme:
  colors:
    primary: '#your-brand-color'             # ← Your primary color
    secondary: '#your-secondary-color'       # ← Your secondary color
    accent: '#your-accent-color'             # ← Your accent color
    # Keep other colors or customize as needed

# Update navigation
navigation:
  footer:
    social:
      - platform: 'github'
        url: 'https://github.com/yourusername'  # ← Your GitHub
      - platform: 'email'  
        url: 'mailto:your@email.com'           # ← Your email

# Update contact form
integrations:
  contact:
    endpoint: 'https://formspree.io/f/YOUR_ID'  # ← Your Formspree endpoint
```

### Step 3: Content Customization

**Enable/disable content sections you want:**

```yaml
content:
  collections:
    books:
      enabled: true/false        # ← Keep or remove books section
      title: 'Your Books Title'  # ← Customize section name
      
    projects:
      enabled: true             # ← Usually keep this
      title: 'Your Projects'    # ← Customize section name
      
    lab:
      enabled: true/false       # ← Keep or remove experiments section
      
    life:
      enabled: true/false       # ← Keep or remove personal blog
```

**Customize homepage:**

```yaml
homepage:
  hero:
    title: 'Welcome to Your Site'           # ← Your hero title
    subtitle: 'Your compelling subtitle'    # ← Your hero subtitle
    cta:
      primary:
        text: 'See My Work'                 # ← Your call-to-action
        url: '/en/projects'                 # ← Where it links to
```

### Step 4: Test Your Site

```bash
# Start development server
pnpm run dev

# Open browser to localhost:4321
```

Your site should now show your branding and content!

### Step 5: Add Your Content

1. **Remove example content:**
   ```bash
   # Remove example files (optional)
   rm -rf src/content/*/en/example-*
   rm -rf src/content/*/de/example-*
   ```

2. **Add your content:**
   - Put your markdown files in `src/content/projects/en/`
   - Add images to `src/assets/images/`
   - Update `src/pages/[lang]/about.astro` with your bio

3. **Replace logo:**
   - Add your logo to `src/assets/images/logo.svg`
   - Update the path in config.yaml if different

### Step 6: Deploy

**For Netlify:**
```bash
# Build your site
pnpm run build

# Deploy to Netlify (drag dist/ folder to netlify.app)
# Or connect your GitHub repo to Netlify
```

**For Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🎨 Advanced Customization

### Theme Colors

Your brand colors will automatically apply to:
- Buttons and links
- Navigation elements
- Badges and tags
- Dark/light mode variants

```yaml
theme:
  colors:
    primary: '#2563eb'      # Main brand color
    secondary: '#7c3aed'    # Secondary brand color
    accent: '#f59e0b'       # Accent color for highlights
    
    # Keep semantic colors for consistency
    success: '#10b981'
    warning: '#f59e0b'
    error: '#ef4444'
    info: '#3b82f6'
```

### Navigation Customization

```yaml
navigation:
  header:
    showLogo: true           # Show/hide logo
    showThemeToggle: true    # Show/hide dark mode toggle
    showLanguageSwitch: true # Show/hide language switcher
    showSearch: true         # Show/hide search button
    
    items:
      - text: 'Portfolio'    # Your navigation items
        href: '/projects'
        icon: '🚀'
      - text: 'About'
        href: '/about'
        icon: '👋'
      # Add more items as needed
```

### Feature Toggles

```yaml
features:
  enableSearch: true         # Site search functionality
  enableShare: true          # Social sharing buttons
  enableTags: true           # Tag-based navigation
  enableComments: false      # Comment system (not implemented yet)
  
  # Translation features
  enableAutoTranslation: true    # AI-powered translation
  showTranslationMetadata: true  # Show translation info
```

### Multilingual Setup

```yaml
i18n:
  locales: ['en', 'de']      # Languages you support
  # Add more languages: ['en', 'de', 'es', 'fr']
  
  translations:
    autoGenerate: true       # AI translation enabled
    qualityThreshold: 70     # Minimum translation quality
```

---

## 🔧 Common Customizations

### 1. Change Color Scheme

**Dark & Professional:**
```yaml
theme:
  colors:
    primary: '#1f2937'       # Dark gray
    secondary: '#6366f1'     # Indigo
    accent: '#f59e0b'        # Amber
```

**Bright & Creative:**
```yaml
theme:
  colors:
    primary: '#ec4899'       # Pink
    secondary: '#8b5cf6'     # Purple
    accent: '#06b6d4'        # Cyan
```

### 2. Portfolio-Only Site

```yaml
content:
  collections:
    projects:
      enabled: true
    books:
      enabled: false         # Disable books
    lab:
      enabled: false         # Disable experiments
    life:
      enabled: false         # Disable blog

navigation:
  header:
    items:
      - text: 'Portfolio'
        href: '/projects'
      - text: 'About'
        href: '/about'
      - text: 'Contact'
        href: '/contact'
```

### 3. Blog-Focused Site

```yaml
content:
  collections:
    life:
      enabled: true
      title: 'Blog'          # Rename to "Blog"
    projects:
      enabled: false
    books:
      enabled: false
    lab:
      enabled: false

homepage:
  featured:
    sections:
      - type: 'life'         # Feature blog posts
        title: 'Latest Posts'
        limit: 5
```

### 4. Multi-Language Business Site

```yaml
i18n:
  locales: ['en', 'de', 'es']  # Add Spanish

navigation:
  header:
    items:
      - text: 'Services'
        href: '/projects'
        icon: '⚡'
      - text: 'About Us'
        href: '/about'
        icon: '👥'
      - text: 'Contact'
        href: '/contact'
        icon: '📞'
```

---

## 📁 File Structure for New Content

```
your-site/
├── src/
│   ├── config.yaml          # ← Your main configuration
│   ├── assets/
│   │   └── images/
│   │       └── logo.svg     # ← Your logo
│   └── content/
│       ├── projects/
│       │   ├── en/
│       │   │   ├── my-project-1.mdx
│       │   │   └── my-project-2.mdx
│       │   └── de/          # Auto-generated translations
│       └── life/
│           ├── en/
│           │   └── my-blog-post.md
│           └── de/
```

---

## 🌍 Environment Variables

Create `.env.local` for secrets:

```bash
# Required for AI translations
OPENAI_API_KEY=sk-proj-your-key-here

# Optional overrides
FORMSPREE_ENDPOINT=https://formspree.io/f/your-id
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Updated `site.site` with your real domain
- [ ] Added your real contact information
- [ ] Replaced example content with your content
- [ ] Added your logo and favicon
- [ ] Set up environment variables in your hosting platform
- [ ] Tested all navigation links
- [ ] Checked mobile responsiveness

---

## 📚 What You Get Out of the Box

**Automatically included:**
- ✅ Responsive design (mobile-first)
- ✅ Dark/light mode toggle
- ✅ SEO optimization
- ✅ Site search functionality
- ✅ Multilingual support with AI translation
- ✅ Fast static site generation
- ✅ Tag-based content organization
- ✅ Social sharing buttons
- ✅ Contact form integration
- ✅ Performance optimization
- ✅ Accessibility features

**Content management:**
- ✅ Markdown/MDX support
- ✅ Automatic image optimization
- ✅ Code syntax highlighting
- ✅ Reading time estimation
- ✅ Related content suggestions

**Developer experience:**
- ✅ TypeScript support
- ✅ Hot reload development
- ✅ Automated builds
- ✅ Error handling
- ✅ Code formatting

---

## 💡 Tips for Success

### 1. Start Simple
- Begin with just the essential configuration changes
- Add one content section at a time
- Test frequently during development

### 2. Content Strategy
- Write in your primary language first
- Let AI handle translations automatically
- Focus on clear, engaging content

### 3. Branding
- Choose 2-3 main colors and stick to them
- Ensure good contrast for accessibility
- Keep navigation simple and intuitive

### 4. Performance
- Optimize images before adding them
- Use the built-in features rather than adding plugins
- Test on mobile devices

---

## 🆘 Troubleshooting

### Configuration Not Applying
```bash
# Restart development server
pnpm run dev
```

### Build Errors
```bash
# Check configuration syntax
pnpm run check
```

### Missing Translations
```bash
# Translations are generated automatically
# Add OPENAI_API_KEY to .env.local
```

### Styling Issues
- Check that colors are valid hex codes
- Ensure YAML indentation is correct
- Clear browser cache

---

## 📞 Getting Help

- **Documentation**: Check `docs/` folder for detailed guides
- **Issues**: Common problems and solutions
- **Examples**: Look at existing content for patterns

Your new site should be live and fully functional! The configuration system makes it easy to iterate and improve over time.
