#!/usr/bin/env node

// Script to systematically update component import paths after restructuring
// Run this script to update all import paths to the new component structure

import { promises as fs } from 'fs';
import { glob } from 'glob';

const IMPORT_MAPPINGS = {
  // Core components
  '~/components/widgets/Header.astro': '~/components/core/layout/Header.astro',
  '~/components/widgets/Footer.astro': '~/components/core/layout/Footer.astro',
  '~/components/common/ToggleMenu.astro': '~/components/core/layout/ToggleMenu.astro',
  '~/components/common/ToggleTheme.astro': '~/components/core/layout/ToggleTheme.astro',
  '~/components/ui/LanguageSwitcher.astro': '~/components/core/layout/LanguageSwitcher.astro',

  '~/components/Logo.astro': '~/components/core/brand/Logo.astro',

  '~/components/Favicons.astro': '~/components/core/meta/Favicons.astro',
  '~/components/CustomStyles.astro': '~/components/core/meta/CustomStyles.astro',
  '~/components/common/CommonMeta.astro': '~/components/core/meta/CommonMeta.astro',
  '~/components/common/Metadata.astro': '~/components/core/meta/Metadata.astro',
  '~/components/common/Analytics.astro': '~/components/core/meta/Analytics.astro',
  '~/components/common/SiteVerification.astro': '~/components/core/meta/SiteVerification.astro',
  '~/components/common/BasicScripts.astro': '~/components/core/meta/BasicScripts.astro',
  '~/components/common/ApplyColorMode.astro': '~/components/core/meta/ApplyColorMode.astro',
  '~/components/common/SplitbeeAnalytics.astro': '~/components/core/meta/SplitbeeAnalytics.astro',

  // Content components
  '~/components/common/ContentMetadata.astro': '~/components/content/metadata/ContentMetadata.astro',
  '~/components/common/ContentFallbackNotice.astro': '~/components/content/metadata/ContentFallbackNotice.astro',
  '~/components/common/SocialShare.astro': '~/components/content/metadata/SocialShare.astro',
  '~/components/common/Image.astro': '~/components/content/media/Image.astro',
  '~/components/widgets/MediaPlayer.astro': '~/components/content/media/MediaPlayer.astro',

  // Blog components
  '~/components/blog/Grid.astro': '~/components/content/blog/Grid.astro',
  '~/components/blog/GridItem.astro': '~/components/content/blog/GridItem.astro',
  '~/components/blog/List.astro': '~/components/content/blog/List.astro',
  '~/components/blog/ListItem.astro': '~/components/content/blog/ListItem.astro',
  '~/components/blog/Pagination.astro': '~/components/content/blog/Pagination.astro',
  '~/components/blog/RelatedPosts.astro': '~/components/content/blog/RelatedPosts.astro',
  '~/components/blog/SinglePost.astro': '~/components/content/blog/SinglePost.astro',
  '~/components/blog/Tags.astro': '~/components/content/blog/Tags.astro',
  '~/components/blog/ToBlogLink.astro': '~/components/content/blog/ToBlogLink.astro',
  '~/components/blog/Headline.astro': '~/components/content/blog/Headline.astro',

  // UI components
  '~/components/ui/Button.astro': '~/components/ui/forms/Button.astro',
  '~/components/ui/Form.astro': '~/components/ui/forms/Form.astro',
  '~/components/widgets/Contact.astro': '~/components/ui/forms/Contact.astro',

  '~/components/ui/Badge.astro': '~/components/ui/display/Badge.astro',
  '~/components/ui/Note.astro': '~/components/ui/display/Note.astro',
  '~/components/ui/Timeline.astro': '~/components/ui/display/Timeline.astro',
  '~/components/ui/Background.astro': '~/components/ui/display/Background.astro',
  '~/components/ui/Headline.astro': '~/components/ui/display/Headline.astro',
  '~/components/ui/DListItem.astro': '~/components/ui/display/DListItem.astro',

  '~/components/ui/ItemGrid.astro': '~/components/ui/layout/ItemGrid.astro',
  '~/components/ui/ItemGrid2.astro': '~/components/ui/layout/ItemGrid2.astro',
  '~/components/ui/WidgetWrapper.astro': '~/components/ui/layout/WidgetWrapper.astro',

  // Marketing components
  '~/components/widgets/Hero.astro': '~/components/marketing/hero/Hero.astro',
  '~/components/widgets/Hero2.astro': '~/components/marketing/hero/Hero2.astro',
  '~/components/widgets/HeroText.astro': '~/components/marketing/hero/HeroText.astro',

  '~/components/widgets/Features.astro': '~/components/marketing/features/Features.astro',
  '~/components/widgets/Features2.astro': '~/components/marketing/features/Features2.astro',
  '~/components/widgets/Features3.astro': '~/components/marketing/features/Features3.astro',
  '~/components/widgets/Steps.astro': '~/components/marketing/features/Steps.astro',
  '~/components/widgets/Steps2.astro': '~/components/marketing/features/Steps2.astro',

  '~/components/widgets/Testimonials.astro': '~/components/marketing/social-proof/Testimonials.astro',
  '~/components/widgets/Stats.astro': '~/components/marketing/social-proof/Stats.astro',
  '~/components/widgets/Brands.astro': '~/components/marketing/social-proof/Brands.astro',

  '~/components/widgets/CallToAction.astro': '~/components/marketing/conversion/CallToAction.astro',
  '~/components/widgets/Pricing.astro': '~/components/marketing/conversion/Pricing.astro',
  '~/components/widgets/FAQs.astro': '~/components/marketing/conversion/FAQs.astro',

  '~/components/widgets/Content.astro': '~/components/marketing/content/Content.astro',
  '~/components/widgets/Announcement.astro': '~/components/marketing/content/Announcement.astro',
  '~/components/widgets/BlogHighlightedPosts.astro': '~/components/marketing/content/BlogHighlightedPosts.astro',
  '~/components/widgets/BlogLatestPosts.astro': '~/components/marketing/content/BlogLatestPosts.astro',
  '~/components/widgets/ChromaGrid.astro': '~/components/marketing/content/ChromaGrid.astro',
  '~/components/widgets/Tldr.astro': '~/components/marketing/content/Tldr.astro',
  '~/components/widgets/Note.astro': '~/components/marketing/content/Note.astro',
};

// Handle relative imports with path mapping
const RELATIVE_MAPPINGS = {
  '../../../components/widgets/Tldr.astro': '../../../components/marketing/content/Tldr.astro',
  '../../../components/widgets/Note.astro': '../../../components/marketing/content/Note.astro',
  '../../../components/ui/Badge.astro': '../../../components/ui/display/Badge.astro',
  '../../../components/common/ContentMetadata.astro': '../../../components/content/metadata/ContentMetadata.astro',
};

async function updateImportsInFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;

    // Update each mapping
    for (const [oldPath, newPath] of Object.entries(IMPORT_MAPPINGS)) {
      if (content.includes(oldPath)) {
        content = content.replaceAll(oldPath, newPath);
        modified = true;
      }
    }

    // Update relative imports
    for (const [oldPath, newPath] of Object.entries(RELATIVE_MAPPINGS)) {
      if (content.includes(oldPath)) {
        content = content.replaceAll(oldPath, newPath);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

async function updateAllImports() {
  console.log('Starting component import path updates...');

  const patterns = ['src/**/*.astro', 'src/**/*.mdx', 'src/**/*.tsx', 'src/**/*.ts'];

  for (const pattern of patterns) {
    const files = await glob(pattern, { cwd: process.cwd() });
    console.log(`Processing ${files.length} files matching ${pattern}...`);

    for (const file of files) {
      await updateImportsInFile(file);
    }
  }

  console.log('Import path updates completed!');
}

updateAllImports().catch(console.error);
