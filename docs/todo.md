# TODO: Content Metadata & UI Badges Feature

- [x] Housekeeping: Remove obsolete temp files from src/pages and subfolders (see plan-10009-housekeeping-temp-files.md)
- [x] Fix language switcher URL generation for consistent /[lang]/ routing (see plan-10010-fix-language-switcher-urls.md)
- [x] Implement content organization structure and tags system (see plan-10011-content-organization-tags-system.md)
- [x] Language separation, badges redesign, and tag overview (see plan-10008-language-separation-badges-tags.md)
- [x] SEO & Quality Assurance enhancements (see plan-10006-seo-qa.md)
- [x] Type safety & ESLint cleanup (see plan-10012-typescript-eslint-cleanup.md)
- [x] Astro component & UI error fixes (see plan-10013-astro-component-ui-error-fixes.md)
- [x] Node.js script modernization (see plan-10014-nodejs-script-modernization.md)

## 🎯 Current Priority: All error-fix plans completed
- All major plans and error-fix tasks have been implemented and verified.
- Node.js scripts refactored and lint/type errors resolved.
- No outstanding errors in scripts or components.

---

## ✅ MAJOR PROGRESS: Multilingual Navigation & Routing Fixed!

**What was completed:**
- ✅ Fixed translation keys in navigation.ts (Books, Projects, Lab, Life, About, Contact)
- ✅ Added missing German translations for all navigation items
- ✅ Created multilingual routes: `/[lang]/books`, `/[lang]/projects`, `/[lang]/lab`, `/[lang]/life`, `/[lang]/about`, `/[lang]/contact`
- ✅ Set up automatic redirects from old routes (`/life` → `/en/life`)
- ✅ Fixed content collection schema and file structure conflicts
- ✅ Updated PageLayout to use locale-aware navigation data
- ✅ All major routing issues resolved - navigation now works correctly!

**Test Status:** ✅ WORKING
- Navigation links correctly show translated text (Books → "Bücher" in German)
- Clicking navigation items redirects to proper language URLs (`/de/life`)
- Content sections now load with language-specific filtering
- Server redirects work correctly for backward compatibility

## Planning
- [x] Analyze requirements and repo for reusable components
- [x] List existing components and layouts
- [x] Create planning, design, and implementation docs

---

## Phase 2: Internationalization & Routing (Week 2) ✅ MOSTLY COMPLETED

### 2.1 i18n Setup ✅ COMPLETED
- [x] **Multilingual Routing** - Implemented `/[lang]/` routes for all content sections
- [x] **Translation Keys** - Fixed navigation translation keys in EN/DE locale files  
- [x] **Content Collections** - Updated to support language-aware content loading
- [x] **Redirects** - Added automatic redirects from `/life` → `/en/life` etc.
- [ ] **Sitemap Integration** - Update sitemap for multilingual URLs
    - [ ] Configure locale mapping for sitemap generation
    - [ ] Set default locale for canonical URLs

### 2.3 Language Integration ✅ COMPLETED
- [x] Navigation Components – Updated header/footer for i18n (translation keys implemented)
- [x] Locale Context – Current language is available to all components via PageLayout and Header widgets

---

## Phase 3: Advanced Features & Polish (Week 3)

### 3.1 Language Switching
- [ ] Header Integration – Add LanguageSwitcher to header, responsive placement, styling, state management
- [ ] Fix LanguageSwitcher TypeScript errors (see src/components/ui/LanguageSwitcher.astro)
    - [ ] Type '() => void' is not assignable to type 'string'.
    - [ ] Type '(e: Event) => void' is not assignable to type 'string'.
    - [ ] Property 'closest' does not exist on type 'EventTarget'.
    - [ ] 'e.target' is possibly 'null'.

### 3.2 SEO Enhancement
- [ ] Search Engine Integration – Open Graph tags, JSON-LD, robots.txt for language variants

### 3.3 Quality Assurance
- [ ] CI Integration – i18next-scanner, translation coverage, GitHub Actions workflow
- [ ] Testing & Validation – Route, metadata, switcher, performance tests

---

## New Task: Language Separation, Translation Key Rendering, Badge Redesign, and Tag Overview
- [ ] **Language Separation, Translation Key Rendering, Badge Redesign, and Tag Overview** ([plan-10008-language-separation-badges-tags.md](./plan-10008-language-separation-badges-tags.md))
    - [ ] Restructure content folders by language
    - [ ] Update content loading and i18n config
    - [ ] Render translation keys on all pages
    - [ ] Redesign and group badge display
    - [ ] Make tag badges clickable and link to overview
    - [ ] Implement tag overview page
    - [ ] Update documentation and archive completed tasks/plans

---

## Phase 4: Component Documentation & Code Quality

### 4.1 Component Documentation Audit ([Plan 10007](plan-10007-component-documentation.md)) ✅ COMPLETED
- [x] **Header Component Fix** - Resolved TypeScript errors in Header.astro
    - [x] Fixed navigation import from headerData
    - [x] Updated prop types to match LanguageSwitcher interface
    - [x] Added proper TypeScript interfaces
- [x] **Component Documentation Inventory** - Completed systematic audit of all components
    - [x] Identified components with complete documentation (many UI components already documented)
    - [x] Identified components missing documentation (some widgets)
    - [x] Completed priority documentation work across all groups
- [x] **Critical UI Components Documentation** (High Priority) ✅ COMPLETED
    - [x] Form.astro - Already documented (form component with validation)
    - [x] Headline.astro - Added documentation (heading component variants)
    - [x] ItemGrid.astro - Already documented (grid layout component)
    - [x] ItemGrid2.astro - Already documented (enhanced grid variant)
    - [x] Background.astro - Already documented (background component) 
    - [x] DListItem.astro - Already documented (definition list item)
    - [x] Badge.astro - Fixed documentation structure and TypeScript interface
- [x] **Widget Components Documentation** (High Priority) ✅ COMPLETED
    - [x] Hero.astro - Added documentation (hero section component)
    - [x] Features.astro - Added documentation (features section)
    - [x] Content.astro - Added documentation (content widget)
    - [x] Contact.astro - Added documentation (contact form widget)
    - [x] CallToAction.astro - Added documentation (CTA component)
    - [x] Steps.astro - Added documentation (step-by-step process component)
    - [x] Stats.astro - Added documentation (statistics display component)
    - [x] Pricing.astro - Added documentation (pricing table component)
    - [x] Footer.astro (widget) - Already documented (footer widget)
- [x] **Common Components Documentation** (Medium Priority) ✅ COMPLETED
    - [x] Header.astro - Fixed TypeScript interface and documentation
    - [x] Footer.astro - Fixed TypeScript interface and documentation
    - [x] ContentMetadata.astro - Already documented (metadata display)
    - [x] Analytics.astro - Already documented (analytics integration)
    - [x] SocialShare.astro - Added documentation (social sharing)
    - [x] BasicScripts.astro - Fixed import structure
- [x] **Documentation Quality Assurance** ✅ COMPLETED
    - [x] Reviewed documentation consistency across all components
    - [x] Validated component relationships and prop interfaces
    - [x] Verified TypeScript compatibility and successful build
    - [x] Established consistent @props/@behavior/@dependencies/@usedBy pattern

---

## Next Steps
- [ ] Update navigation/header/footer for i18n
- [ ] Integrate LanguageSwitcher in header (responsive, accessible)
- [ ] Polish fallback and SEO features
- [ ] Add CI translation validation and test coverage
- [ ] Document all new patterns and lessons learned
