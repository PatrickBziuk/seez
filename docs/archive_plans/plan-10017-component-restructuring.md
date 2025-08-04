# Plan 20001: Component Directory Restructuring

## Goal
Reorganize the `src/components/` directory structure to group components by context and usage patterns, making the codebase more maintainable and logical for developers.

## Current Structure Analysis

### Current Organization Issues
1. **Inconsistent categorization**: Some components in `/widgets` are actually layout components (Header, Footer)
2. **Feature duplication**: Headline components exist in both `/ui` and `/blog`
3. **Mixed abstraction levels**: High-level widgets mixed with basic UI components
4. **Context confusion**: Components used in multiple contexts scattered across directories

### Current Usage Patterns Identified

#### Layout & Site Structure
- **Layout components**: Header.astro (widgets), Footer.astro (widgets), ToggleMenu.astro, ToggleTheme.astro
- **Core site components**: Favicons.astro, CustomStyles.astro, Logo.astro
- **Meta & Analytics**: CommonMeta.astro, Metadata.astro, Analytics.astro, SiteVerification.astro

#### Content Display & Management
- **Content metadata**: ContentMetadata.astro, ContentFallbackNotice.astro
- **Content specific**: SocialShare.astro
- **Language**: LanguageSwitcher.astro

#### Blog-Specific Components
- All components in `/blog/` directory are content-related for blog posts
- Used primarily in blog listing and detail pages

#### Landing Page & Marketing
- Hero variations, CallToAction, Features, Testimonials, Pricing, Stats
- Used in marketing pages and landing pages

#### Basic UI Elements
- Badge, Button, Form, Note, Background, Timeline
- Reusable across different contexts

## Proposed New Structure

```
src/components/
├── core/              # Core site functionality
│   ├── layout/        # Site layout components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ToggleMenu.astro
│   │   ├── ToggleTheme.astro
│   │   └── LanguageSwitcher.astro
│   ├── meta/          # Meta tags, analytics, scripts
│   │   ├── CommonMeta.astro
│   │   ├── Metadata.astro
│   │   ├── Analytics.astro
│   │   ├── SiteVerification.astro
│   │   ├── BasicScripts.astro
│   │   ├── ApplyColorMode.astro
│   │   ├── Favicons.astro
│   │   └── CustomStyles.astro
│   └── brand/         # Brand-specific components
│       └── Logo.astro
│
├── content/           # Content display components
│   ├── metadata/      # Content metadata & management
│   │   ├── ContentMetadata.astro
│   │   ├── ContentFallbackNotice.astro
│   │   └── SocialShare.astro
│   ├── blog/          # Blog-specific components
│   │   ├── Grid.astro
│   │   ├── GridItem.astro
│   │   ├── List.astro
│   │   ├── ListItem.astro
│   │   ├── Pagination.astro
│   │   ├── RelatedPosts.astro
│   │   ├── SinglePost.astro
│   │   ├── Tags.astro
│   │   ├── ToBlogLink.astro
│   │   └── Headline.astro
│   └── media/         # Media components
│       ├── Image.astro
│       └── MediaPlayer.astro
│
├── ui/                # Basic reusable UI components
│   ├── forms/         # Form-related components
│   │   ├── Button.astro
│   │   ├── Form.astro
│   │   └── Contact.astro
│   ├── display/       # Display components
│   │   ├── Badge.astro
│   │   ├── Note.astro
│   │   ├── Timeline.astro
│   │   ├── Background.astro
│   │   ├── Headline.astro
│   │   └── DListItem.astro
│   └── layout/        # Layout utilities
│       ├── ItemGrid.astro
│       ├── ItemGrid2.astro
│       └── WidgetWrapper.astro
│
├── marketing/         # Marketing & landing page components
│   ├── hero/          # Hero variations
│   │   ├── Hero.astro
│   │   ├── Hero2.astro
│   │   └── HeroText.astro
│   ├── features/      # Feature showcases
│   │   ├── Features.astro
│   │   ├── Features2.astro
│   │   ├── Features3.astro
│   │   └── Steps.astro
│   │   └── Steps2.astro
│   ├── social-proof/  # Social proof & validation
│   │   ├── Testimonials.astro
│   │   ├── Stats.astro
│   │   └── Brands.astro
│   ├── conversion/    # Conversion-focused components
│   │   ├── CallToAction.astro
│   │   ├── Pricing.astro
│   │   └── FAQs.astro
│   └── content/       # Marketing content blocks
│       ├── Content.astro
│       ├── Announcement.astro
│       ├── BlogHighlightedPosts.astro
│       ├── BlogLatestPosts.astro
│       ├── ChromaGrid.astro
│       ├── ChromaGrid.types.ts
│       └── Tldr.astro
```

## Migration Strategy

### Phase 1: Create New Directory Structure
1. Create new folder structure
2. Move components to new locations
3. Update all import references

### Phase 2: Update Import References
1. Scan all files for component imports
2. Update import paths systematically
3. Test build after each major group of changes

### Phase 3: Update Type Definitions & Config
1. Update any TypeScript path mappings
2. Update any bundler/build configurations
3. Run full type checking and build validation

## Implementation Steps

### Step 1: Directory Creation
```bash
# Create new structure
mkdir -p src/components/core/{layout,meta,brand}
mkdir -p src/components/content/{metadata,blog,media}
mkdir -p src/components/ui/{forms,display,layout}
mkdir -p src/components/marketing/{hero,features,social-proof,conversion,content}
```

### Step 2: Component Migration Plan

#### Core Components Movement
- `widgets/Header.astro` → `core/layout/Header.astro`
- `widgets/Footer.astro` → `core/layout/Footer.astro`
- `common/ToggleMenu.astro` → `core/layout/ToggleMenu.astro`
- `common/ToggleTheme.astro` → `core/layout/ToggleTheme.astro`
- `ui/LanguageSwitcher.astro` → `core/layout/LanguageSwitcher.astro`
- `Logo.astro` → `core/brand/Logo.astro`
- `Favicons.astro` → `core/meta/Favicons.astro`
- `CustomStyles.astro` → `core/meta/CustomStyles.astro`
- All `common/*Meta.astro`, `common/Analytics.astro`, etc. → `core/meta/`

#### Content Components Movement
- `common/ContentMetadata.astro` → `content/metadata/ContentMetadata.astro`
- `common/ContentFallbackNotice.astro` → `content/metadata/ContentFallbackNotice.astro`
- `common/SocialShare.astro` → `content/metadata/SocialShare.astro`
- `common/Image.astro` → `content/media/Image.astro`
- `widgets/MediaPlayer.astro` → `content/media/MediaPlayer.astro`
- All `blog/*` → `content/blog/` (keep structure)

#### UI Components Movement
- `ui/Button.astro` → `ui/forms/Button.astro`
- `ui/Form.astro` → `ui/forms/Form.astro`
- `widgets/Contact.astro` → `ui/forms/Contact.astro`
- `ui/Badge.astro`, `ui/Note.astro`, etc. → `ui/display/`
- `ui/ItemGrid*.astro`, `ui/WidgetWrapper.astro` → `ui/layout/`

#### Marketing Components Movement
- `widgets/Hero*.astro` → `marketing/hero/`
- `widgets/Features*.astro`, `widgets/Steps*.astro` → `marketing/features/`
- `widgets/Testimonials.astro`, `widgets/Stats.astro`, `widgets/Brands.astro` → `marketing/social-proof/`
- `widgets/CallToAction.astro`, `widgets/Pricing.astro`, `widgets/FAQs.astro` → `marketing/conversion/`
- `widgets/Content.astro`, `widgets/Announcement.astro`, `widgets/Blog*.astro`, `widgets/ChromaGrid.*`, `widgets/Tldr.astro` → `marketing/content/`

### Step 3: Import Reference Updates
Update all import statements in:
- All layout files (`src/layouts/*.astro`)
- All page files (`src/pages/**/*.astro`)
- All content files (`src/content/**/*.mdx`)
- Any component that imports other components

### Step 4: Cleanup
- Remove old empty directories
- Update any documentation
- Verify all builds pass

## Benefits of New Structure

1. **Logical Grouping**: Components grouped by their primary usage context
2. **Clear Hierarchy**: Core → Content → UI → Marketing represents increasing specificity
3. **Easier Discovery**: Developers can quickly find components based on what they're building
4. **Better Maintainability**: Related components are co-located
5. **Scalability**: Clear patterns for where new components should go

## Edge Cases & Considerations

1. **Shared Components**: Some components (like Note) are used in multiple contexts - placed in UI as they're basic building blocks
2. **Component Dependencies**: Ensure no circular dependencies are created
3. **Build System**: Verify that build tools handle the new structure correctly
4. **Team Communication**: Update team documentation and onboarding materials

## Success Criteria
- [ ] All components moved to new logical locations
- [ ] All import references updated and working
- [ ] Build passes without errors
- [ ] No broken component references
- [ ] Documentation updated
- [ ] Team briefed on new structure

## Rollback Plan
- Keep a backup of the current structure
- Use Git branching for the migration
- Have a list of all changed import paths for quick reversal if needed
