# TODO: Content Metadata & UI Badges Feature

## Planning
- [x] Analyze requirements and repo for reusable components
- [x] List existing components and layouts
- [x] Create planning, design, and implementation docs

---

## Phase 1: Foundation & Core Components (Week 1)

### 1.1 Metadata Schema Definition
- [x] **Update Content Schema** - Extend `src/content/config.ts` with new metadata fields
  - [x] **Language Field** - Add enum field for 'en' | 'de' with default 'en'
  - [x] **Timestamp Field** - Add ISO 8601 datetime string field (optional)
  - [x] **Status Object** - Add nested object with authoring and translation fields
    - [x] Authoring status: 'Human' | 'AI' | 'AI+Human' (default: 'Human')
    - [x] Translation status: 'Human' | 'AI' | 'AI+Human' | undefined (optional)
  - [x] **Backward Compatibility** - Ensure existing content continues to work
- [x] **Type Definitions** - Extend TypeScript interfaces in `src/types.d.ts`
  - [x] **ExtendedMetaData Interface** - Extend existing MetaData with new fields
    - [x] Add language, timestamp, status, alternateLanguages properties
  - [x] **Status Enums** - Define AuthoringStatus and TranslationStatus types
  - [x] **Content Props Interface** - Create ContentMetadataProps for component props

### 1.2 UI Components Creation
- [x] **Badge Component** - Create reusable `src/components/ui/Badge.astro`
  - [x] **Variant System** - Implement color-coded variants
    - [x] AI variant: blue color scheme with robot icon
    - [x] Human variant: green color scheme with person icon
    - [x] AI+Human variant: purple color scheme with handshake icon
    - [x] Tag variant: gray color scheme for content tags
    - [x] Language variant: indigo color scheme with flag icons
    - [x] Timestamp variant: slate color scheme with calendar icon
  - [x] **Size Options** - Support sm, md, lg size variations
  - [x] **Icon Integration** - Optional icon prop with proper spacing
  - [x] **Accessibility** - Proper ARIA labels and keyboard navigation
- [x] **ContentMetadata Component** - Create `src/components/common/ContentMetadata.astro`
  - [x] **Layout Structure** - Organize metadata in responsive flex layout
    - [x] Primary badges row: language, authoring status, translation status, timestamp
    - [x] Secondary tags row: content tags with retro styling
  - [x] **Language Display** - Map language codes to labels and flag emojis
  - [x] **Status Icons** - Map status types to appropriate emoji icons
  - [x] **Conditional Rendering** - Only show component if metadata exists
  - [x] **Responsive Design** - Stack on mobile, inline on desktop
- [x] **Update MarkdownLayout** - Integrate ContentMetadata into existing layout
  - [x] **Header Section** - Add title and subtitle structure
  - [x] **Metadata Integration** - Insert ContentMetadata below header
  - [x] **Content Separation** - Add proper spacing and borders
  - [x] **Prop Passing** - Pass frontmatter data to ContentMetadata component

> Lint errors for type usage and unused imports were fixed during implementation.

### 1.3 Content Migration
- [x] **Migration Script** - Create `scripts/migrate-content.js`
  - [x] ES module imports and __dirname compatibility fixed
  - [x] **Backup System** - Automatically backup content directory before changes
    - [x] Create timestamped backup folder
    - [x] Copy entire content directory structure
    - [x] Verify backup integrity
  - [x] **Dry Run Mode** - Preview changes without modifying files
    - [x] Parse --dry-run command line flag
    - [x] Show before/after frontmatter comparison
    - [x] Count files that would be affected
  - [x] **File Processing** - Add default metadata to existing files
    - [x] Parse existing frontmatter with gray-matter
    - [x] Merge with default metadata values
    - [x] Preserve existing values when present
    - [x] Generate new frontmatter with proper formatting
  - [x] **Validation System** - Ensure data integrity
    - [x] Validate required fields (title, date, tags)
    - [x] Check language code validity
    - [x] Verify status enum values
    - [x] Report validation warnings and errors
  - [x] **Progress Reporting** - Detailed console output with colors
    - [x] File-by-file processing status
    - [x] Summary statistics (processed, updated, errors)
    - [x] Error details and suggestions
- [x] **Content Updates** - Apply migration to existing content collections
  - [x] **Books Collection** - Process all markdown files in books directory
  - [x] **Projects Collection** - Process all markdown files in projects directory  
  - [x] **Lab Collection** - Process all markdown files in lab directory
  - [x] **Life Collection** - Process all markdown files in life directory

> Migration script and content updates complete and tested. Next: i18n setup and configuration.

---

## Phase 2: Internationalization & Routing (Week 2)

### 2.1 i18n Setup
- [x] **Package Installation** - Install and configure i18n dependencies
  - [x] **Core Packages** - Install astro-i18next, i18next, gray-matter
    - [x] Run: `pnpm add astro-i18next@^1.0.0-beta.21 i18next@^23.7.6 gray-matter@^4.0.3`
    - [x] Install dev dependency: `pnpm add -D i18next-scanner@^4.4.0`
    - [x] Verify package compatibility with current Astro version
  - [x] **Version Compatibility** - Ensure all packages work together
    - [x] Test build process with new dependencies
    - [x] Check for peer dependency warnings
- [x] **Astro Configuration** - Update `astro.config.ts` for i18n support
  - [x] **Integration Setup** - Add astro-i18next integration to config
    - [x] Configure default language as 'en'
    - [x] Set supported languages array: ['en', 'de']
    - [x] Configure fallback language behavior
  - [ ] **Sitemap Integration** - Update sitemap for multilingual URLs
    - [ ] Configure locale mapping for sitemap generation
    - [ ] Set default locale for canonical URLs
  - [x] **Build Configuration** - Ensure proper build output for languages
- [x] **Translation Files** - Create `src/locales/` structure with clustered keys
  - [x] **English Translations** - Create comprehensive `en.json`
    - [x] Metadata cluster: title, language, timestamp, status, tags
    - [x] Badges cluster: ai, human, ai_human, created_by, translated_by
    - [x] Status cluster: created, translated, authoring, translation
    - [x] Content cluster: not_available, redirected_notice, dismiss
    - [x] Navigation cluster: language_switcher, available_in, not_available_in
  - [x] **German Translations** - Create corresponding `de.json`
    - [x] Translate all English keys to German equivalents
    - [x] Maintain same key structure for consistency
    - [x] Review translations for cultural appropriateness
  - [x] **Key Documentation** - Document i18n key structure and usage
    - [x] Create key naming conventions guide
    - [x] Document cluster organization rationale
    - [x] Provide examples for adding new translations

### 2.2 Routing Architecture
- [x] **Dynamic Route Structure** - Implement locale-aware routing patterns
  - [x] **Route Organization** - Plan URL structure for multilingual content
    - [x] Default language (en): /books/slug vs. /en/books/slug decision
    - [x] Alternate languages: /de/books/slug pattern
    - [x] Backward compatibility for existing URLs
  - [x] **Collection Routes** - Update existing collection pages for language support
    - [x] Books: Create language-aware routes for book pages
    - [x] Projects: Update project routing for multilingual support
    - [x] Lab: Add language routing to lab experiments
    - [x] Life: Enable multilingual life posts
  - [x] **Static Path Generation** - Implement getStaticPaths for language routing
    - [x] Generate paths for all available content languages
    - [x] Handle content availability per language
    - [x] Create proper param structure for language detection
- [x] **Content Utils** - Create `src/utils/content.ts` for content management
  - [x] **Language Filtering** - Function to get content by language
    - [x] Filter collections by language field
    - [x] Exclude draft content from results
    - [x] Sort by date or other criteria
  - [x] **Fallback Logic** - Handle missing translations gracefully
    - [x] Try preferred language first
    - [x] Fallback to English if available
    - [x] Fallback to any available language as last resort
    - [x] Return null if no content exists
  - [x] **URL Generation** - Helper functions for multilingual URLs
    - [x] Generate alternate language URLs for same content
    - [x] Create hreflang URLs for SEO
    - [x] Handle language prefix logic consistently
  - [x] **Content Discovery** - Functions to check content availability
    - [x] Check if content exists in specific language
    - [x] Get list of available languages for content piece
    - [x] Determine best language match for user preference

### 2.3 Language Integration
- [x] Layout Updates – Layouts now load and pass translations statically (SSR compatible)
- [x] String Replacement – All metadata, badge, and tag labels use translation keys
- [ ] Navigation Components – Update header/footer for i18n (labels, menu, legal links)
- [ ] Locale Context – Ensure current language is available to all components
- [x] Badge Component – Receives translated text via props
- [x] ContentMetadata Component – Fully translation-supported

---

## Phase 3: Advanced Features & Polish (Week 3)

### 3.1 Language Switching
- [x] LanguageSwitcher Component – Dropdown/toggle, content-aware, disables unavailable languages
- [ ] Header Integration – Add LanguageSwitcher to header, responsive placement, styling, state management

### 3.2 SEO Enhancement
- [x] Hreflang Tags – Metadata component extended, alternate URLs generated
- [ ] Search Engine Integration – Open Graph tags, JSON-LD, robots.txt for language variants
- [x] Content Fallback – Fallback notice, redirect logic, user experience polish

### 3.3 Quality Assurance
- [ ] CI Integration – i18next-scanner, translation coverage, GitHub Actions workflow
- [ ] Testing & Validation – Route, metadata, switcher, performance tests

---

## Next Steps
- [ ] Update navigation/header/footer for i18n
- [ ] Integrate LanguageSwitcher in header (responsive, accessible)
- [ ] Polish fallback and SEO features
- [ ] Add CI translation validation and test coverage
- [ ] Document all new patterns and lessons learned

# TODO: Content Metadata & UI Badges Feature

## Planning
- [x] Analyze requirements and repo for reusable components
- [x] List existing components and layouts
- [x] Create planning, design, and implementation docs

---

## Phase 1: Foundation & Core Components (Week 1)

### 1.1 Metadata Schema Definition
- [x] **Update Content Schema** - Extend `src/content/config.ts` with new metadata fields
  - [x] **Language Field** - Add enum field for 'en' | 'de' with default 'en'
  - [x] **Timestamp Field** - Add ISO 8601 datetime string field (optional)
  - [x] **Status Object** - Add nested object with authoring and translation fields
    - [x] Authoring status: 'Human' | 'AI' | 'AI+Human' (default: 'Human')
    - [x] Translation status: 'Human' | 'AI' | 'AI+Human' | undefined (optional)
  - [x] **Backward Compatibility** - Ensure existing content continues to work
- [x] **Type Definitions** - Extend TypeScript interfaces in `src/types.d.ts`
  - [x] **ExtendedMetaData Interface** - Extend existing MetaData with new fields
    - [x] Add language, timestamp, status, alternateLanguages properties
  - [x] **Status Enums** - Define AuthoringStatus and TranslationStatus types
  - [x] **Content Props Interface** - Create ContentMetadataProps for component props

### 1.2 UI Components Creation
- [x] **Badge Component** - Create reusable `src/components/ui/Badge.astro`
  - [x] **Variant System** - Implement color-coded variants
    - [x] AI variant: blue color scheme with robot icon
    - [x] Human variant: green color scheme with person icon
    - [x] AI+Human variant: purple color scheme with handshake icon
    - [x] Tag variant: gray color scheme for content tags
    - [x] Language variant: indigo color scheme with flag icons
    - [x] Timestamp variant: slate color scheme with calendar icon
  - [x] **Size Options** - Support sm, md, lg size variations
  - [x] **Icon Integration** - Optional icon prop with proper spacing
  - [x] **Accessibility** - Proper ARIA labels and keyboard navigation
- [x] **ContentMetadata Component** - Create `src/components/common/ContentMetadata.astro`
  - [x] **Layout Structure** - Organize metadata in responsive flex layout
    - [x] Primary badges row: language, authoring status, translation status, timestamp
    - [x] Secondary tags row: content tags with retro styling
  - [x] **Language Display** - Map language codes to labels and flag emojis
  - [x] **Status Icons** - Map status types to appropriate emoji icons
  - [x] **Conditional Rendering** - Only show component if metadata exists
  - [x] **Responsive Design** - Stack on mobile, inline on desktop
- [x] **Update MarkdownLayout** - Integrate ContentMetadata into existing layout
  - [x] **Header Section** - Add title and subtitle structure
  - [x] **Metadata Integration** - Insert ContentMetadata below header
  - [x] **Content Separation** - Add proper spacing and borders
  - [x] **Prop Passing** - Pass frontmatter data to ContentMetadata component

> Lint errors for type usage and unused imports were fixed during implementation.

### 1.3 Content Migration
- [x] **Migration Script** - Create `scripts/migrate-content.js`
  - [x] ES module imports and __dirname compatibility fixed
  - [x] **Backup System** - Automatically backup content directory before changes
    - [x] Create timestamped backup folder
    - [x] Copy entire content directory structure
    - [x] Verify backup integrity
  - [x] **Dry Run Mode** - Preview changes without modifying files
    - [x] Parse --dry-run command line flag
    - [x] Show before/after frontmatter comparison
    - [x] Count files that would be affected
  - [x] **File Processing** - Add default metadata to existing files
    - [x] Parse existing frontmatter with gray-matter
    - [x] Merge with default metadata values
    - [x] Preserve existing values when present
    - [x] Generate new frontmatter with proper formatting
  - [x] **Validation System** - Ensure data integrity
    - [x] Validate required fields (title, date, tags)
    - [x] Check language code validity
    - [x] Verify status enum values
    - [x] Report validation warnings and errors
  - [x] **Progress Reporting** - Detailed console output with colors
    - [x] File-by-file processing status
    - [x] Summary statistics (processed, updated, errors)
    - [x] Error details and suggestions
- [x] **Content Updates** - Apply migration to existing content collections
  - [x] **Books Collection** - Process all markdown files in books directory
  - [x] **Projects Collection** - Process all markdown files in projects directory  
  - [x] **Lab Collection** - Process all markdown files in lab directory
  - [x] **Life Collection** - Process all markdown files in life directory

> Migration script and content updates complete and tested. Next: i18n setup and configuration.

---

## Phase 2: Internationalization & Routing (Week 2)

### 2.1 i18n Setup
- [x] **Package Installation** - Install and configure i18n dependencies
  - [x] **Core Packages** - Install astro-i18next, i18next, gray-matter
    - [x] Run: `pnpm add astro-i18next@^1.0.0-beta.21 i18next@^23.7.6 gray-matter@^4.0.3`
    - [x] Install dev dependency: `pnpm add -D i18next-scanner@^4.4.0`
    - [x] Verify package compatibility with current Astro version
  - [x] **Version Compatibility** - Ensure all packages work together
    - [x] Test build process with new dependencies
    - [x] Check for peer dependency warnings
- [x] **Astro Configuration** - Update `astro.config.ts` for i18n support
  - [x] **Integration Setup** - Add astro-i18next integration to config
    - [x] Configure default language as 'en'
    - [x] Set supported languages array: ['en', 'de']
    - [x] Configure fallback language behavior
  - [ ] **Sitemap Integration** - Update sitemap for multilingual URLs
    - [ ] Configure locale mapping for sitemap generation
    - [ ] Set default locale for canonical URLs
  - [x] **Build Configuration** - Ensure proper build output for languages
- [x] **Translation Files** - Create `src/locales/` structure with clustered keys
  - [x] **English Translations** - Create comprehensive `en.json`
    - [x] Metadata cluster: title, language, timestamp, status, tags
    - [x] Badges cluster: ai, human, ai_human, created_by, translated_by
    - [x] Status cluster: created, translated, authoring, translation
    - [x] Content cluster: not_available, redirected_notice, dismiss
    - [x] Navigation cluster: language_switcher, available_in, not_available_in
  - [x] **German Translations** - Create corresponding `de.json`
    - [x] Translate all English keys to German equivalents
    - [x] Maintain same key structure for consistency
    - [x] Review translations for cultural appropriateness
  - [x] **Key Documentation** - Document i18n key structure and usage
    - [x] Create key naming conventions guide
    - [x] Document cluster organization rationale
    - [x] Provide examples for adding new translations

### 2.2 Routing Architecture
- [x] **Dynamic Route Structure** - Implement locale-aware routing patterns
  - [x] **Route Organization** - Plan URL structure for multilingual content
    - [x] Default language (en): /books/slug vs. /en/books/slug decision
    - [x] Alternate languages: /de/books/slug pattern
    - [x] Backward compatibility for existing URLs
  - [x] **Collection Routes** - Update existing collection pages for language support
    - [x] Books: Create language-aware routes for book pages
    - [x] Projects: Update project routing for multilingual support
    - [x] Lab: Add language routing to lab experiments
    - [x] Life: Enable multilingual life posts
  - [x] **Static Path Generation** - Implement getStaticPaths for language routing
    - [x] Generate paths for all available content languages
    - [x] Handle content availability per language
    - [x] Create proper param structure for language detection
- [x] **Content Utils** - Create `src/utils/content.ts` for content management
  - [x] **Language Filtering** - Function to get content by language
    - [x] Filter collections by language field
    - [x] Exclude draft content from results
    - [x] Sort by date or other criteria
  - [x] **Fallback Logic** - Handle missing translations gracefully
    - [x] Try preferred language first
    - [x] Fallback to English if available
    - [x] Fallback to any available language as last resort
    - [x] Return null if no content exists
  - [x] **URL Generation** - Helper functions for multilingual URLs
    - [x] Generate alternate language URLs for same content
    - [x] Create hreflang URLs for SEO
    - [x] Handle language prefix logic consistently
  - [x] **Content Discovery** - Functions to check content availability
    - [x] Check if content exists in specific language
    - [x] Get list of available languages for content piece
    - [x] Determine best language match for user preference

### 2.3 Language Integration
- [x] Layout Updates – Layouts now load and pass translations statically (SSR compatible)
- [x] String Replacement – All metadata, badge, and tag labels use translation keys
- [ ] Navigation Components – Update header/footer for i18n (labels, menu, legal links)
- [ ] Locale Context – Ensure current language is available to all components
- [x] Badge Component – Receives translated text via props
- [x] ContentMetadata Component – Fully translation-supported

---

## Phase 3: Advanced Features & Polish (Week 3)

### 3.1 Language Switching
- [x] LanguageSwitcher Component – Dropdown/toggle, content-aware, disables unavailable languages
- [ ] Header Integration – Add LanguageSwitcher to header, responsive placement, styling, state management

### 3.2 SEO Enhancement
- [x] Hreflang Tags – Metadata component extended, alternate URLs generated
- [ ] Search Engine Integration – Open Graph tags, JSON-LD, robots.txt for language variants
- [x] Content Fallback – Fallback notice, redirect logic, user experience polish

### 3.3 Quality Assurance
- [ ] CI Integration – i18next-scanner, translation coverage, GitHub Actions workflow
- [ ] Testing & Validation – Route, metadata, switcher, performance tests

---

## Next Steps
- [ ] Update navigation/header/footer for i18n
- [ ] Integrate LanguageSwitcher in header (responsive, accessible)
- [ ] Polish fallback and SEO features
- [ ] Add CI translation validation and test coverage
- [ ] Document all new patterns and lessons learned

# TODO: Content Metadata & UI Badges Feature

## Planning
- [x] Analyze requirements and repo for reusable components
- [x] List existing components and layouts
- [x] Create planning, design, and implementation docs

---

## Phase 1: Foundation & Core Components (Week 1)

### 1.1 Metadata Schema Definition
- [x] **Update Content Schema** - Extend `src/content/config.ts` with new metadata fields
  - [x] **Language Field** - Add enum field for 'en' | 'de' with default 'en'
  - [x] **Timestamp Field** - Add ISO 8601 datetime string field (optional)
  - [x] **Status Object** - Add nested object with authoring and translation fields
    - [x] Authoring status: 'Human' | 'AI' | 'AI+Human' (default: 'Human')
    - [x] Translation status: 'Human' | 'AI' | 'AI+Human' | undefined (optional)
  - [x] **Backward Compatibility** - Ensure existing content continues to work
- [x] **Type Definitions** - Extend TypeScript interfaces in `src/types.d.ts`
  - [x] **ExtendedMetaData Interface** - Extend existing MetaData with new fields
    - [x] Add language, timestamp, status, alternateLanguages properties
  - [x] **Status Enums** - Define AuthoringStatus and TranslationStatus types
  - [x] **Content Props Interface** - Create ContentMetadataProps for component props

### 1.2 UI Components Creation
- [x] **Badge Component** - Create reusable `src/components/ui/Badge.astro`
  - [x] **Variant System** - Implement color-coded variants
    - [x] AI variant: blue color scheme with robot icon
    - [x] Human variant: green color scheme with person icon
    - [x] AI+Human variant: purple color scheme with handshake icon
    - [x] Tag variant: gray color scheme for content tags
    - [x] Language variant: indigo color scheme with flag icons
    - [x] Timestamp variant: slate color scheme with calendar icon
  - [x] **Size Options** - Support sm, md, lg size variations
  - [x] **Icon Integration** - Optional icon prop with proper spacing
  - [x] **Accessibility** - Proper ARIA labels and keyboard navigation
- [x] **ContentMetadata Component** - Create `src/components/common/ContentMetadata.astro`
  - [x] **Layout Structure** - Organize metadata in responsive flex layout
    - [x] Primary badges row: language, authoring status, translation status, timestamp
    - [x] Secondary tags row: content tags with retro styling
  - [x] **Language Display** - Map language codes to labels and flag emojis
  - [x] **Status Icons** - Map status types to appropriate emoji icons
  - [x] **Conditional Rendering** - Only show component if metadata exists
  - [x] **Responsive Design** - Stack on mobile, inline on desktop
- [x] **Update MarkdownLayout** - Integrate ContentMetadata into existing layout
  - [x] **Header Section** - Add title and subtitle structure
  - [x] **Metadata Integration** - Insert ContentMetadata below header
  - [x] **Content Separation** - Add proper spacing and borders
  - [x] **Prop Passing** - Pass frontmatter data to ContentMetadata component

> Lint errors for type usage and unused imports were fixed during implementation.

### 1.3 Content Migration
- [x] **Migration Script** - Create `scripts/migrate-content.js`
  - [x] ES module imports and __dirname compatibility fixed
  - [x] **Backup System** - Automatically backup content directory before changes
    - [x] Create timestamped backup folder
    - [x] Copy entire content directory structure
    - [x] Verify backup integrity
  - [x] **Dry Run Mode** - Preview changes without modifying files
    - [x] Parse --dry-run command line flag
    - [x] Show before/after frontmatter comparison
    - [x] Count files that would be affected
  - [x] **File Processing** - Add default metadata to existing files
    - [x] Parse existing frontmatter with gray-matter
    - [x] Merge with default metadata values
    - [x] Preserve existing values when present
    - [x] Generate new frontmatter with proper formatting
  - [x] **Validation System** - Ensure data integrity
    - [x] Validate required fields (title, date, tags)
    - [x] Check language code validity
    - [x] Verify status enum values
    - [x] Report validation warnings and errors
  - [x] **Progress Reporting** - Detailed console output with colors
    - [x] File-by-file processing status
    - [x] Summary statistics (processed, updated, errors)
    - [x] Error details and suggestions
- [x] **Content Updates** - Apply migration to existing content collections
  - [x] **Books Collection** - Process all markdown files in books directory
  - [x] **Projects Collection** - Process all markdown files in projects directory  
  - [x] **Lab Collection** - Process all markdown files in lab directory
  - [x] **Life Collection** - Process all markdown files in life directory

> Migration script and content updates complete and tested. Next: i18n setup and configuration.

---

## Phase 2: Internationalization & Routing (Week 2)

### 2.1 i18n Setup
- [x] **Package Installation** - Install and configure i18n dependencies
  - [x] **Core Packages** - Install astro-i18next, i18next, gray-matter
    - [x] Run: `pnpm add astro-i18next@^1.0.0-beta.21 i18next@^23.7.6 gray-matter@^4.0.3`
    - [x] Install dev dependency: `pnpm add -D i18next-scanner@^4.4.0`
    - [x] Verify package compatibility with current Astro version
  - [x] **Version Compatibility** - Ensure all packages work together
    - [x] Test build process with new dependencies
    - [x] Check for peer dependency warnings
- [x] **Astro Configuration** - Update `astro.config.ts` for i18n support
  - [x] **Integration Setup** - Add astro-i18next integration to config
    - [x] Configure default language as 'en'
    - [x] Set supported languages array: ['en', 'de']
    - [x] Configure fallback language behavior
  - [ ] **Sitemap Integration** - Update sitemap for multilingual URLs
    - [ ] Configure locale mapping for sitemap generation
    - [ ] Set default locale for canonical URLs
  - [x] **Build Configuration** - Ensure proper build output for languages
- [x] **Translation Files** - Create `src/locales/` structure with clustered keys
  - [x] **English Translations** - Create comprehensive `en.json`
    - [x] Metadata cluster: title, language, timestamp, status, tags
    - [x] Badges cluster: ai, human, ai_human, created_by, translated_by
    - [x] Status cluster: created, translated, authoring, translation
    - [x] Content cluster: not_available, redirected_notice, dismiss
    - [x] Navigation cluster: language_switcher, available_in, not_available_in
  - [x] **German Translations** - Create corresponding `de.json`
    - [x] Translate all English keys to German equivalents
    - [x] Maintain same key structure for consistency
    - [x] Review translations for cultural appropriateness
  - [x] **Key Documentation** - Document i18n key structure and usage
    - [x] Create key naming conventions guide
    - [x] Document cluster organization rationale
    - [x] Provide examples for adding new translations

### 2.2 Routing Architecture
- [x] **Dynamic Route Structure** - Implement locale-aware routing patterns
  - [x] **Route Organization** - Plan URL structure for multilingual content
    - [x] Default language (en): /books/slug vs. /en/books/slug decision
    - [x] Alternate languages: /de/books/slug pattern
    - [x] Backward compatibility for existing URLs
  - [x] **Collection Routes** - Update existing collection pages for language support
    - [x] Books: Create language-aware routes for book pages
    - [x] Projects: Update project routing for multilingual support
    - [x] Lab: Add language routing to lab experiments
    - [x] Life: Enable multilingual life posts
  - [x] **Static Path Generation** - Implement getStaticPaths for language routing
    - [x] Generate paths for all available content languages
    - [x] Handle content availability per language
    - [x] Create proper param structure for language detection
- [x] **Content Utils** - Create `src/utils/content.ts` for content management
  - [x] **Language Filtering** - Function to get content by language
    - [x] Filter collections by language field
    - [x] Exclude draft content from results
    - [x] Sort by date or other criteria
  - [x] **Fallback Logic** - Handle missing translations gracefully
    - [x] Try preferred language first
    - [x] Fallback to English if available
    - [x] Fallback to any available language as last resort
    - [x] Return null if no content exists
  - [x] **URL Generation** - Helper functions for multilingual URLs
    - [x] Generate alternate language URLs for same content
    - [x] Create hreflang URLs for SEO
    - [x] Handle language prefix logic consistently
  - [x] **Content Discovery** - Functions to check content availability
    - [x] Check if content exists in specific language
    - [x] Get list of available languages for content piece
    - [x] Determine best language match for user preference

### 2.3 Language Integration
- [x] Layout Updates – Layouts now load and pass translations statically (SSR compatible)
- [x] String Replacement – All metadata, badge, and tag labels use translation keys
- [ ] Navigation Components – Update header/footer for i18n (labels, menu, legal links)
- [ ] Locale Context – Ensure current language is available to all components
- [x] Badge Component – Receives translated text via props
- [x] ContentMetadata Component – Fully translation-supported

---

## Phase 3: Advanced Features & Polish (Week 3)

### 3.1 Language Switching
- [x] LanguageSwitcher Component – Dropdown/toggle, content-aware, disables unavailable languages
- [ ] Header Integration – Add LanguageSwitcher to header, responsive placement, styling, state management

### 3.2 SEO Enhancement
- [x] Hreflang Tags – Metadata component extended, alternate URLs generated
- [ ] Search Engine Integration – Open Graph tags, JSON-LD, robots.txt for language variants
- [x] Content Fallback – Fallback notice, redirect logic, user experience polish

### 3.3 Quality Assurance
- [ ] CI Integration – i18next-scanner, translation coverage, GitHub Actions workflow
- [ ] Testing & Validation – Route, metadata, switcher, performance tests

---

## Next Steps
- [ ] Update navigation/header/footer for i18n
- [ ] Integrate LanguageSwitcher in header (responsive, accessible)
- [ ] Polish fallback and SEO features
- [ ] Add CI translation validation and test coverage
- [ ] Document all new patterns and lessons learned

# TODO: Content Metadata & UI Badges Feature

## Planning
- [x] Analyze requirements and repo for reusable components
- [x] List existing components and layouts
- [x] Create planning, design, and implementation docs

---

## Phase 1: Foundation & Core Components (Week 1)

### 1.1 Metadata Schema Definition
- [x] **Update Content Schema** - Extend `src/content/config.ts` with new metadata fields
  - [x] **Language Field** - Add enum field for 'en' | 'de' with default 'en'
  - [x] **Timestamp Field** - Add ISO 8601 datetime string field (optional)
  - [x] **Status Object** - Add nested object with authoring and translation fields
    - [x] Authoring status: 'Human' | 'AI' | 'AI+Human' (default: 'Human')
    - [x] Translation status: 'Human' | 'AI' | 'AI+Human' | undefined (optional)
  - [x] **Backward Compatibility** - Ensure existing content continues to work
- [x] **Type Definitions** - Extend TypeScript interfaces in `src/types.d.ts`
  - [x] **ExtendedMetaData Interface** - Extend existing MetaData with new fields
    - [x] Add language, timestamp, status, alternateLanguages properties
  - [x] **Status Enums** - Define AuthoringStatus and TranslationStatus types
  - [x] **Content Props Interface** - Create ContentMetadataProps for component props

### 1.2 UI Components Creation
- [x] **Badge Component** - Create reusable `src/components/ui/Badge.astro`
  - [x] **Variant System** - Implement color-coded variants
    - [x] AI variant: blue color scheme with robot icon
    - [x] Human variant: green color scheme with person icon
    - [x] AI+Human variant: purple color scheme with handshake icon
    - [x] Tag variant: gray color scheme for content tags
    - [x] Language variant: indigo color scheme with flag icons
    - [x] Timestamp variant: slate color scheme with calendar icon
  - [x] **Size Options** - Support sm, md, lg size variations
  - [x] **Icon Integration** - Optional icon prop with proper spacing
  - [x] **Accessibility** - Proper ARIA labels and keyboard navigation
- [x] **ContentMetadata Component** - Create `src/components/common/ContentMetadata.astro`
  - [x] **Layout Structure** - Organize metadata in responsive flex layout
    - [x] Primary badges row: language, authoring status, translation status, timestamp
    - [x] Secondary tags row: content tags with retro styling
  - [x] **Language Display** - Map language codes to labels and flag emojis
  - [x] **Status Icons** - Map status types to appropriate emoji icons
  - [x] **Conditional Rendering** - Only show component if metadata exists
  - [x] **Responsive Design** - Stack on mobile, inline on desktop
- [x] **Update MarkdownLayout** - Integrate ContentMetadata into existing layout
  - [x] **Header Section** - Add title and subtitle structure
  - [x] **Metadata Integration** - Insert ContentMetadata below header
  - [x] **Content Separation** - Add proper spacing and borders
  - [x] **Prop Passing** - Pass frontmatter data to ContentMetadata component

> Lint errors for type usage and unused imports were fixed during implementation.

### 1.3 Content Migration
- [x] **Migration Script** - Create `scripts/migrate-content.js`
  - [x] ES module imports and __dirname compatibility fixed
  - [x] **Backup System** - Automatically backup content directory before changes
    - [x] Create timestamped backup folder
    - [x] Copy entire content directory structure
    - [x] Verify backup integrity
  - [x] **Dry Run Mode** - Preview changes without modifying files
    - [x] Parse --dry-run command line flag
    - [x] Show before/after frontmatter comparison
    - [x] Count files that would be affected
  - [x] **File Processing** - Add default metadata to existing files
    - [x] Parse existing frontmatter with gray-matter
    - [x] Merge with default metadata values
    - [x] Preserve existing values when present
    - [x] Generate new frontmatter with proper formatting
  - [x] **Validation System** - Ensure data integrity
    - [x] Validate required fields (title, date, tags)
    - [x] Check language code validity
    - [x] Verify status enum values
    - [x] Report validation warnings and errors
  - [x] **Progress Reporting** - Detailed console output with colors
    - [x] File-by-file processing status
    - [x] Summary statistics (processed, updated, errors)
    - [x] Error details and suggestions
- [x] **Content Updates** - Apply migration to existing content collections
  - [x] **Books Collection** - Process all markdown files in books directory
  - [x] **Projects Collection** - Process all markdown files in projects directory  
  - [x] **Lab Collection** - Process all markdown files in lab directory
  - [x] **Life Collection** - Process all markdown files in life directory

> Migration script and content updates complete and tested. Next: i18n setup and configuration.

---

## Phase 2: Internationalization & Routing (Week 2)

### 2.1 i18n Setup
- [x] **Package Installation** - Install and configure i18n dependencies
  - [x] **Core Packages** - Install astro-i18next, i18next, gray-matter
    - [x] Run: `pnpm add astro-i18next@^1.0.0-beta.21 i18next@^23.7.6 gray-matter@^4.0.3`
    - [x] Install dev dependency: `pnpm add -D i18next-scanner@^4.4.0`
    - [x] Verify package compatibility with current Astro version
  - [x] **Version Compatibility** - Ensure all packages work together
    - [x] Test build process with new dependencies
    - [x] Check for peer dependency warnings
- [x] **Astro Configuration** - Update `astro.config.ts` for i18n support
  - [x] **Integration Setup** - Add astro-i18next integration to config
    - [x] Configure default language as 'en'
    - [x] Set supported languages array: ['en', 'de']
    - [x] Configure fallback language behavior
  - [ ] **Sitemap Integration** - Update sitemap for multilingual URLs
    - [ ] Configure locale mapping for sitemap generation
    - [ ] Set default locale for canonical URLs
  - [x] **Build Configuration** - Ensure proper build output for languages
- [x] **Translation Files** - Create `src/locales/` structure with clustered keys
  - [x] **English Translations** - Create comprehensive `en.json`
    - [x] Metadata cluster: title, language, timestamp, status, tags
    - [x] Badges cluster: ai, human, ai_human, created_by, translated_by
    - [x] Status cluster: created, translated, authoring, translation
    - [x] Content cluster: not_available, redirected_notice, dismiss
    - [x] Navigation cluster: language_switcher, available_in, not_available_in
  - [x] **German Translations** - Create corresponding `de.json`
    - [x] Translate all English keys to German equivalents
    - [x] Maintain same key structure for consistency
    - [x] Review translations for cultural appropriateness
  - [x] **Key Documentation** - Document i18n key structure and usage
    - [x] Create key naming conventions guide
    - [x] Document cluster organization rationale
    - [x] Provide examples for adding new translations

### 2.2 Routing Architecture
- [x] **Dynamic Route Structure** - Implement locale-aware routing patterns
  - [x] **Route Organization** - Plan URL structure for multilingual content
    - [x] Default language (en): /books/slug vs. /en/books/slug decision
    - [x] Alternate languages: /de/books/slug pattern
    - [x] Backward compatibility for existing URLs
  - [x] **Collection Routes** - Update existing collection pages for language support
    - [x] Books: Create language-aware routes for book pages
    - [x] Projects: Update project routing for multilingual support
    - [x] Lab: Add language routing to lab experiments
    - [x] Life: Enable multilingual life posts
  - [x] **Static Path Generation** - Implement getStaticPaths for language routing
    - [x] Generate paths for all available content languages
    - [x] Handle content availability per language
    - [x] Create proper param structure for language detection
- [x] **Content Utils** - Create `src/utils/content.ts` for content management
  - [x] **Language Filtering** - Function to get content by language
    - [x] Filter collections by language field
    - [x] Exclude draft content from results
    - [x] Sort by date or other criteria
  - [x] **Fallback Logic** - Handle missing translations gracefully
    - [x] Try preferred language first
    - [x] Fallback to English if available
    - [x] Fallback to any available language as last resort
    - [x] Return null if no content exists
  - [x] **URL Generation** - Helper functions for multilingual URLs
    - [x] Generate alternate language URLs for same content
    - [x] Create hreflang URLs for SEO
    - [x] Handle language prefix logic consistently
  - [x] **Content Discovery** - Functions to check content availability
    - [x] Check if content exists in specific language
    - [x] Get list of available languages for content piece
    - [x] Determine best language match for user preference

### 2.3 Language Integration
- [x] Layout Updates – Layouts now load and pass translations statically (SSR compatible)
- [x] String Replacement – All metadata, badge, and tag labels use translation keys
- [ ] Navigation Components – Update header/footer for i18n (labels, menu, legal links)
- [ ] Locale Context – Ensure current language is available to all components
- [x] Badge Component – Receives translated text via props
- [x] ContentMetadata Component – Fully translation-supported

---

## Phase 3: Advanced Features & Polish (Week 3)

### 3.1 Language Switching
- [x] LanguageSwitcher Component – Dropdown/toggle, content-aware, disables unavailable languages
- [ ] Header Integration – Add LanguageSwitcher to header, responsive placement, styling, state management

### 3.2 SEO Enhancement
- [x] Hreflang Tags – Metadata component extended, alternate URLs generated
- [ ] Search Engine Integration – Open Graph tags, JSON-LD, robots.txt for language variants
- [x] Content Fallback – Fallback notice, redirect logic, user experience polish

### 3.3 Quality Assurance
- [ ] CI Integration – i18next-scanner, translation coverage, GitHub Actions workflow
- [ ] Testing & Validation – Route, metadata, switcher, performance tests

---

## Next Steps
- [ ] Update navigation/header/footer for i18n
- [ ] Integrate LanguageSwitcher in header (responsive, accessible)
- [ ] Polish fallback and SEO features
- [ ] Add CI translation validation and test coverage
- [ ] Document all new patterns and lessons learned
