import { ulid } from 'ulid';
import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'node:fs';
import matter from 'gray-matter';

/**
 * Frontmatter Migration Script for Plan 10035
 * 
 * This script migrates the existing complex frontmatter structure to the new
 * simplified schema outlined in Plan 10035: Frontmatter Refactor - Three Passes
 * 
 * Key transformations:
 * 1. status.authoring → authors array with references to authors collection
 * 2. Complex status objects → simple publicationStatus field  
 * 3. Generate canonicalId where missing (ULID format)
 * 4. Clean up AI metadata bloat while preserving essential data
 * 5. Remove nested review objects and other complexity
 */

interface LegacyFrontmatter {
  title: string;
  language?: 'en' | 'de';
  status?: {
    authoring?: 'Human' | 'AI' | 'AI+Human';
    translation?: 'Human' | 'AI' | 'AI+Human';
    review?: {
      content?: boolean;
      translation?: boolean;
      reviewer?: string;
      reviewDate?: string;
      notes?: string;
    };
  };
  authors?: string[];
  canonicalId?: string;
  draft?: boolean;
  publicationStatus?: 'draft' | 'published' | 'archived';
  ai_metadata?: unknown;
  [key: string]: unknown;
}

interface NewFrontmatter {
  title: string;
  subtitle?: string;
  language: 'en' | 'de';
  authors: string[];
  tags: string[];
  publicationStatus: 'draft' | 'published' | 'archived';
  draft: boolean;
  canonicalId: string;
  translationKey?: string;
  firstPublishedAt?: string;
  updatedAt?: string;
  ai_metadata?: {
    translation?: {
      model?: string;
      at: string;
      sourceLanguage: 'en' | 'de';
      targetLanguage: 'en' | 'de';
      tokens?: number;
      cost?: number;
      co2?: number;
    };
  };
  [key: string]: unknown; // Allow other legacy fields during transition
}

/**
 * Maps legacy status.authoring values to authors collection references
 */
function mapStatusToAuthors(status: LegacyFrontmatter['status'], language: 'en' | 'de' = 'en'): string[] {
  const authorSuffix = language === 'de' ? '-de' : '';
  
  if (!status?.authoring) {
    // Default to seez for content without explicit authoring status
    return [`authors/seez${authorSuffix}`];
  }

  switch (status.authoring) {
    case 'AI':
      return [`authors/echo${authorSuffix}`];
    case 'AI+Human':
      return [`authors/seez${authorSuffix}`, `authors/echo${authorSuffix}`];
    case 'Human':
    default:
      return [`authors/seez${authorSuffix}`];
  }
}

/**
 * Converts legacy draft/status to new publicationStatus
 */
function mapToPublicationStatus(frontmatter: LegacyFrontmatter): 'draft' | 'published' | 'archived' {
  // If publicationStatus already exists, use it
  if (frontmatter.publicationStatus) {
    return frontmatter.publicationStatus;
  }
  
  // Otherwise, derive from draft field
  return frontmatter.draft === false ? 'published' : 'draft';
}

/**
 * Generates a new canonical ID in ULID format (lowercase)
 */
function generateCanonicalId(): string {
  return ulid().toLowerCase();
}

/**
 * Cleans up AI metadata, preserving only essential translation info
 */
function cleanAIMetadata(aiMetadata: unknown): NewFrontmatter['ai_metadata'] | undefined {
  if (!aiMetadata || typeof aiMetadata !== 'object') return undefined;
  
  const metadata = aiMetadata as Record<string, unknown>;
  
  // Extract translation metadata if it exists
  const tokenUsage = metadata.tokenUsage as Record<string, unknown>;
  const translation = tokenUsage?.translation as Record<string, unknown>;
  
  if (translation) {
    return {
      translation: {
        model: translation.model as string,
        at: (translation.timestamp as string) || new Date().toISOString(),
        sourceLanguage: (translation.sourceLanguage as 'en' | 'de') || 'en',
        targetLanguage: (translation.targetLanguage as 'en' | 'de') || 'de',
        tokens: (translation.totalTokens as number) || (translation.tokens as number),
        cost: translation.cost as number,
        co2: (translation.co2Impact as number) || (translation.co2 as number),
      }
    };
  }
  
  return undefined;
}

/**
 * Migrates a single frontmatter object from legacy to new format
 */
function migrateFrontmatter(frontmatter: LegacyFrontmatter): NewFrontmatter {
  const language = frontmatter.language || 'en';
  
  // 1. Map authors from status
  const authors = frontmatter.authors || mapStatusToAuthors(frontmatter.status, language);
  
  // 2. Map publication status
  const publicationStatus = mapToPublicationStatus(frontmatter);
  
  // 3. Generate canonicalId if missing
  const canonicalId = frontmatter.canonicalId || generateCanonicalId();
  
  // 4. Clean up AI metadata
  const ai_metadata = cleanAIMetadata(frontmatter.ai_metadata);
  
  // 5. Preserve essential fields, remove complexity
  const migrated: NewFrontmatter = {
    title: frontmatter.title,
    language,
    authors,
    tags: (frontmatter.tags as string[]) || [],
    publicationStatus,
    draft: publicationStatus === 'draft',
    canonicalId,
  };
  
  // Only add optional fields if they have values
  if (frontmatter.subtitle) {
    migrated.subtitle = frontmatter.subtitle as string;
  }
  
  if (frontmatter.translationKey) {
    migrated.translationKey = frontmatter.translationKey as string;
  }
  
  if (frontmatter.firstPublishDate || frontmatter.firstPublishedAt) {
    migrated.firstPublishedAt = (frontmatter.firstPublishDate as string) || (frontmatter.firstPublishedAt as string);
  }
  
  if (frontmatter.lastChangeDate || frontmatter.updatedAt) {
    migrated.updatedAt = (frontmatter.lastChangeDate as string) || (frontmatter.updatedAt as string);
  }
  
  // Add AI metadata only if it exists
  if (ai_metadata) {
    migrated.ai_metadata = ai_metadata;
  }
  
  // Preserve some legacy fields temporarily for compatibility
  const legacyFields = [
    'description', 'slug', 'publishDate', 'modifiedDate', 'changeLog',
    'translators', 'sources', 'date', 'timestamp', 'original', 
    'originalLanguage', 'translationOf', 'sourceLanguage', 
    'translationHistory', 'ai_tldr', 'ai_textscore'
  ];
  
  legacyFields.forEach(field => {
    if (frontmatter[field] !== undefined && frontmatter[field] !== null) {
      migrated[field] = frontmatter[field];
    }
  });
  
  // Clean up any remaining undefined values before returning
  Object.keys(migrated).forEach(key => {
    if (migrated[key] === undefined) {
      delete migrated[key];
    }
  });
  
  return migrated;
}

/**
 * Migrates all frontmatter in content collections
 */
async function migrateFrontmatterFiles(dryRun: boolean = true): Promise<void> {
  console.log(`🚀 Starting frontmatter migration (${dryRun ? 'DRY RUN' : 'LIVE RUN'})...`);
  
  const collections = ['books', 'projects', 'lab', 'life', 'pages'];
  let totalFiles = 0;
  let migratedFiles = 0;
  
  for (const collection of collections) {
    console.log(`\n📁 Processing collection: ${collection}`);
    
    const pattern = `src/content/${collection}/**/*.{md,mdx}`;
    const files = await glob(pattern);
    
    console.log(`   Found ${files.length} files`);
    totalFiles += files.length;
    
    for (const filePath of files) {
      try {
        console.log(`   📄 Processing: ${filePath}`);
        
        const raw = readFileSync(filePath, 'utf8');
        const parsed = matter(raw);
        const legacy = parsed.data as LegacyFrontmatter;
        
        // Migrate frontmatter
        const migrated = migrateFrontmatter(legacy);
        
        // Show changes
        console.log(`      🔄 Authors: ${legacy.status?.authoring || 'undefined'} → ${migrated.authors.join(', ')}`);
        console.log(`      📊 Status: ${legacy.draft ? 'draft' : 'published'} → ${migrated.publicationStatus}`);
        console.log(`      🆔 CanonicalId: ${legacy.canonicalId || 'missing'} → ${migrated.canonicalId}`);
        
        if (!dryRun) {
          // Write the migrated file
          const newContent = matter.stringify(parsed.content, migrated);
          writeFileSync(filePath, newContent, 'utf8');
          console.log(`      ✅ Migrated successfully`);
        } else {
          console.log(`      👁️  Would migrate (dry run)`);
        }
        
        migratedFiles++;
        
      } catch (error) {
        console.error(`      ❌ Error processing ${filePath}:`, error);
      }
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Successfully migrated: ${migratedFiles}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN - No files were changed' : 'LIVE RUN - Files have been updated'}`);
  
  if (dryRun) {
    console.log(`\n🔄 To execute the migration, run:`);
    console.log(`   tsx scripts/migrate-frontmatter.ts --live`);
  } else {
    console.log(`\n✅ Migration complete! Run 'pnpm astro sync' to update types.`);
  }
}

// Script execution for direct running
const isDirectRun = process.argv[1]?.endsWith('migrate-frontmatter.ts');
if (isDirectRun) {
  const isLiveRun = process.argv.includes('--live');
  migrateFrontmatterFiles(!isLiveRun).catch(console.error);
}

export { migrateFrontmatterFiles, migrateFrontmatter, mapStatusToAuthors };
