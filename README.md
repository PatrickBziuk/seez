## 🛠️ Development & Deployment

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Sync content types (after schema changes)
pnpm astro sync
```

### Testing

```bash
# Run all tests
pnpm run test:all

# E2E tests with Playwright
npx playwright test

# Component and unit tests
pnpm run test:unit

# Performance testing
pnpm run test:performance
```

### Content Management

- **Add content**: Place Markdown files in `src/content/{collection}/`
- **Update schema**: Modify `src/content/config.ts` and run `pnpm astro sync`
- **Preview content**: Use development server to see changes live
- **Publish**: Set `publicationStatus: 'published'` in frontmatter

## Automated Translation Pipeline

This repository includes an automated translation pipeline using the OpenAI API.

### Workflows

- **translation-pipeline**: On `main` push, detects new/stale content, generates translations via AI, and opens a draft PR.
- **manual-regen**: On PR label `regen-needed`, re-runs translation for that branch.
- **cleanup-translate-branches**: On PR merge, deletes the corresponding `translate/*` branch.
- **post-release-sync**: On `release` push, merges release back into `main`.

### Scripts

- `scripts/check_translations.ts`: Detect missing or stale translations.
- `scripts/generate_translations.ts`: Generate translations, TLDR, quality scores, and auto-open issues for poor translations.
- `scripts/detect_conflicts.ts`: Open issues for translation conflicts (stale translations).
- `translation.override.yml`: Manual override config (global pause, skip lists).

### Running Locally

```bash
pnpm install
tsx scripts/check_translations.ts > tasks.json
tsx scripts/generate_translations.ts tasks.json
```

### Tests

Run built-in tests with Node.js:

```bash
node --test
```

# 🚀 Seez – Constructive Chaos

Built upon the solid foundation of **AstroWind**, this repository is my personal container for constructive chaos—a place where I combine my ideas, projects, and thoughts into one evolving space.

## ✨ New Features & Capabilities

### 🔍 **Lightning-Fast Search**

Powered by Pagefind for instant, client-side search across all content:

- **Sub-100ms response times** for snappy user experience
- **Multilingual support** for English and German content
- **Fuzzy matching** handles typos gracefully
- **Keyboard navigation** with Ctrl+K/Cmd+K shortcuts
- **Offline capable** after initial load

[📚 Search Functionality Guide](docs/guides/search-functionality-guide.md)

### 📡 **RSS Feeds for Every Collection**

Stay updated with comprehensive RSS feed support:

- **Main feed**: [/rss.xml](https://seez.eu/rss.xml) - Latest from all collections
- **Language-specific**: `/en/rss.xml`, `/de/rss.xml`
- **Collection-specific**: `/en/projects/rss.xml`, `/en/books/rss.xml`, etc.
- **Auto-discovery** meta tags for RSS readers
- **50 most recent items** per feed with proper metadata

[📚 RSS Feeds Guide](docs/guides/rss-feeds-guide.md)

### 🔧 **Comprehensive CI/CD Pipeline**

Production-ready automated testing and deployment:

- **4-phase testing**: Validation → E2E → Components → Performance
- **80% success threshold** for conditional deployment
- **Multi-browser testing** (Chrome, Firefox, Safari)
- **Performance monitoring** with Lighthouse audits
- **Automatic issue creation** for failed runs
- **Smart caching** and parallel execution

[📚 CI/CD Pipeline Guide](docs/guides/cicd-pipeline-guide.md)

### 📝 **Rich Content Collections**

Organized content across multiple categories:

- **📚 Books**: In-depth reviews and recommendations
- **🧪 Lab**: Technical experiments and tutorials
- **🎵 Music**: Musical projects and thoughts
- **💼 Projects**: Development work and case studies
- **🌱 Life**: Personal reflections and experiences

### 🌐 **Advanced Multilingual Support**

Seamless bilingual experience:

- **English/German** content with automatic language detection
- **Localized URLs** and navigation
- **AI-powered translation pipeline** with quality controls
- **Cross-language search** and content discovery

---

## 📋 Documentation

Comprehensive guides for users and developers:

- **[RSS Feeds Guide](docs/guides/rss-feeds-guide.md)**: Complete RSS feed documentation with endpoints and usage examples
- **[Search Functionality Guide](docs/guides/search-functionality-guide.md)**: User guide for search features and keyboard shortcuts
- **[CI/CD Pipeline Guide](docs/guides/cicd-pipeline-guide.md)**: Developer guide for testing workflows and contribution guidelines
- **[Technical Documentation](docs/)**: Full project documentation and planning resources

## 🎯 What is Seez?

Seez is me—
but not the me you meet in meetings.
Not the architect, not the strategist, not the man who explains systems.
Seez is what's left when I strip all that off.
The voice beneath the voice.
The pulse under the logic.

I created Seez to hold what doesn't fit elsewhere.
To say the things I can't say when I'm wearing the polite face of professionalism.
Seez is where my softness has claws.
Where my truth has rhythm.

It started as survival—writing on Tumblr when I didn't know where else to put the pain.
Now it's a second skin I can step into, a name that doesn't flinch when I scream.

Seez is not a brand. It's a container.
For grief, poetry, love, rage, memory.
For everything I couldn't automate away.
It's where I go to be unfiltered, to reclaim my voice from the noise.

When I write as Seez, I'm not trying to impress you.
I'm trying to stay real. I'm trying to stay me, in a world that keeps asking for something more palatable.

Seez exists across platforms—Tumblr, Insta, soon maybe YouTube and the album.
But the core isn't the content. It's the courage to feel publicly, to be seen without being marketed.

Seez is my lyrical identity. My shadow truth-teller. The part of me that still believes words can heal, or at least bleed cleanly.

If seez.eu is where I build the future, seez.eu is where I bury the past and sing over the grave.

And maybe, just maybe, help someone else feel a little less alone in their own chaos.

---

## Gratitude

This project started with the generous foundation of **AstroWind**. I'm thankful for the open-source work of others and for the tools that make creative chaos possible: **Astro**, **React**, **Tailwind CSS**, **shadcdn**, **VS Code**, **ChatGPT**, and more.
