---
title: Tech Stack
language: en
description: 'An overview of the technology stack used to build this website, including Astro, TypeScript, Tailwind CSS, and modern JAMstack deployment practices.'
authors:
  - authors/seez
tags:
  - astro
  - jamstack
  - typescript
  - tailwind
  - deployment
  - tech-stack
publicationStatus: published
draft: false
canonicalId: 01k2jadmvq8mn9ckpav7jsd6t
firstPublishedAt: '2025-01-12T19:59:08.408Z'
publishDate: '2025-01-12T19:59:08.408Z'
---

# The Tech Stack Behind This Project

This site and most of my projects are built with a deliberate focus on **simplicity**, **performance**, **maintainability**, and **digital sovereignty**. Here's what powers everything and why I chose these technologies.

## Core Framework

### 🚀 Astro 5.x

**Why Astro?** It perfectly embodies my philosophy of shipping only what you need. Astro generates static HTML by default and only hydrates JavaScript when necessary. This results in blazing-fast sites with minimal JavaScript bloat.

- **Zero-JS by default**: Pages load instantly because there's no unnecessary JavaScript
- **Component agnostic**: Use React, Vue, Svelte, or just Astro components - whatever fits the task
- **Content collections**: Perfect for managing multilingual content with type safety
- **Modern tooling**: Built-in TypeScript support, dev server, and build optimization

## Styling & Design

### 🎨 Tailwind CSS

**Why Tailwind?** Utility-first CSS that grows with your project without growing your bundle size. Only the classes you use get included in the final build.

- **No CSS bloat**: Only styles actually used are included
- **Design system consistency**: Enforced spacing, colors, and typography scales
- **Developer experience**: IntelliSense and instant visual feedback
- **Maintainable**: No CSS files to manage, styles are co-located with components

## Content Management

### 📝 Astro Content Collections

**Why content collections?** Type-safe, structured content management that scales from simple pages to complex multilingual sites.

- **Type safety**: Catch content errors at build time
- **Multilingual support**: Built-in handling for multiple languages
- **Flexible schema**: Support for metadata, AI attribution, and complex content structures
- **Version control**: Content lives in Git alongside code

### 🌐 Multilingual Architecture

Built from the ground up for English and German content with:

- **astro-i18next**: Professional i18n routing and translations
- **Language-aware URLs**: `/en/about` and `/de/ueber` patterns
- **Automated hreflang**: Proper SEO for multilingual content
- **Translation workflows**: AI-assisted translation with human review

## Search & Discovery

### 🔍 Pagefind

**Why Pagefind?** Static site search that doesn't require servers or external services.

- **Privacy-first**: No tracking, no external services
- **Lightning fast**: Client-side search with excellent performance
- **Multilingual**: Automatic language detection and search
- **Zero configuration**: Works out of the box with Astro

## Deployment & Hosting

### 📦 GitHub Pages & Codeberg Pages

**Why static hosting?** Aligns with my digital sovereignty principles - no vendor lock-in, maximum performance, minimal cost.

- **GitHub Pages**: Primary deployment target with GitHub Actions CI/CD
- **Codeberg Pages**: Mirror deployment for redundancy and European hosting
- **Static assets**: Global CDN performance without complexity
- **Version control**: Every deployment is tied to a Git commit

## Development Workflow

### 🔧 Modern JavaScript Tooling

- **TypeScript**: Type safety across the entire codebase
- **pnpm**: Fast, space-efficient package management
- **ESLint & Prettier**: Consistent code formatting and quality
- **Playwright**: End-to-end testing for critical user flows

### 🚢 CI/CD Pipeline

- **GitHub Actions**: Automated testing, building, and deployment
- **Multi-target deployment**: Simultaneous deployment to multiple platforms
- **Quality gates**: Automated testing before deployment
- **Dependency management**: Automated security updates

## Performance & Optimization

### ⚡ Build Optimization

- **Static generation**: Pre-rendered HTML for maximum performance
- **Image optimization**: Automatic WebP conversion and responsive images
- **CSS purging**: Only used styles make it to production
- **JavaScript minimization**: Tree-shaking and code splitting

### 📊 Bundle Analysis

- **Astro Bundle Analyzer**: Monitor bundle size and composition
- **Pagefind indexing**: Optimized search indices
- **Font optimization**: Self-hosted Inter variable font

## AI Integration & Transparency

### 🤖 AI Tooling

- **Translation assistance**: AI-powered multilingual content with human review
- **Content analysis**: Automated quality scoring and optimization suggestions
- **Token tracking**: Full transparency about AI usage and costs
- **Environmental impact**: CO2 tracking for AI operations

## Monitoring & Analytics

### 📈 Privacy-First Analytics

- **Plausible Analytics**: GDPR-compliant, cookie-free website analytics
- **Core Web Vitals**: Performance monitoring without user tracking
- **Build analytics**: Monitor build times and optimization opportunities

## Why This Stack?

### 🎯 Alignment with Principles

Every technology choice aligns with my core principles:

1. **Digital Sovereignty**: No vendor lock-in, self-hostable, open source
2. **Performance**: Fast loading, minimal JavaScript, optimized delivery
3. **Privacy**: No tracking, no external dependencies, user-controlled
4. **Transparency**: Open source, documented decisions, clear architecture
5. **Maintainability**: Simple, well-documented, future-proof

### 🔄 Learning & Evolution

This stack grows with my knowledge:

- **Astro**: Learned through building this site
- **Tailwind**: Mastered through multiple projects
- **TypeScript**: Continuous improvement across all projects
- **Deployment**: Multi-platform strategy for resilience

### 🛠 Practical Benefits

- **Fast development**: Hot reload, great DX, minimal configuration
- **Reliable deployment**: Multiple hosting targets, automated pipelines
- **Scalable content**: From single pages to large multilingual sites
- **Cost effective**: Mostly free hosting with optional premium features

---

## Want to Build Something Similar?

If you're inspired by this approach and want to build something similar, here are the key decisions that made the biggest difference:

1. **Start with Astro** if you need a content-heavy site with optional interactivity
2. **Use Tailwind** if you want to move fast without CSS maintenance burden
3. **Choose static hosting** for performance, simplicity, and sovereignty
4. **Plan for multilingual** from day one if you need it later
5. **Implement search** with Pagefind for privacy-respecting site search

The entire stack is designed to grow with your needs while maintaining simplicity and performance. Every piece can be understood, modified, or replaced without breaking the whole system.

That's what **digital sovereignty** looks like in practice.
