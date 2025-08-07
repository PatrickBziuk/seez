import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import matter from 'gray-matter';

// Import the analyze function (we'll run it directly)
import { glob } from 'glob';

interface ContentFile {
  path: string;
  slug: string;
  collection: string;
  language: string;
  title: string;
  canonicalId?: string;
  content: string;
  wordCount: number;
  hasRichContent: boolean;
}

interface RelationshipAnalysis {
  slug: string;
  collections: string[];
  files: ContentFile[];
  suggestedOriginal?: ContentFile;
  suggestedTranslations: ContentFile[];
  needsManualReview: boolean;
  reason: string;
}

/**
 * Simple version of content analysis for this script
 */
async function analyzeContentForClassification(): Promise<RelationshipAnalysis[]> {
  const contentFiles = await glob('src/content/{books,projects,lab,life}/**/*.{md,mdx}', {
    cwd: process.cwd(),
  });

  const parsedFiles: ContentFile[] = [];

  for (const filePath of contentFiles) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);

      const pathParts = filePath.replace(/\\/g, '/').split('/');
      const collection = pathParts[2];
      const language = pathParts[3];
      const fileName = pathParts[pathParts.length - 1];
      const slug = fileName.replace(/\.(md|mdx)$/, '');

      const wordCount = markdownContent.trim().split(/\s+/).length;
      const hasRichContent = wordCount > 50 && markdownContent.length > 200;

      parsedFiles.push({
        path: filePath,
        slug,
        collection,
        language,
        title: frontmatter.title || 'Untitled',
        canonicalId: frontmatter.canonicalId,
        content: markdownContent,
        wordCount,
        hasRichContent,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  Failed to parse ${filePath}:`, errorMessage);
    }
  }

  // Group by slug and analyze
  const groupedBySlug = new Map<string, ContentFile[]>();

  for (const file of parsedFiles) {
    const key = `${file.collection}/${file.slug}`;
    if (!groupedBySlug.has(key)) {
      groupedBySlug.set(key, []);
    }
    groupedBySlug.get(key)!.push(file);
  }

  const relationships: RelationshipAnalysis[] = [];

  for (const [key, files] of groupedBySlug) {
    if (files.length === 1) continue;

    const collections = [...new Set(files.map((f) => f.collection))];
    const richFiles = files.filter((f) => f.hasRichContent);
    const poorFiles = files.filter((f) => !f.hasRichContent);

    let suggestedOriginal: ContentFile | undefined;
    let suggestedTranslations: ContentFile[] = [];
    let needsManualReview = false;
    let reason = '';

    if (richFiles.length === 1 && poorFiles.length >= 1) {
      suggestedOriginal = richFiles[0];
      suggestedTranslations = poorFiles;
      reason = `Clear original-translation relationship: ${suggestedOriginal.language} has ${suggestedOriginal.wordCount} words, others are placeholders`;
    } else {
      needsManualReview = true;
      suggestedOriginal = richFiles.sort((a, b) => b.wordCount - a.wordCount)[0];
      suggestedTranslations = richFiles.filter((f) => f !== suggestedOriginal);
      reason = `Multiple rich files found - potential content divergence needs manual review`;
    }

    relationships.push({
      slug: key,
      collections,
      files,
      suggestedOriginal,
      suggestedTranslations,
      needsManualReview,
      reason,
    });
  }

  return relationships;
}

interface RegistryEntry {
  canonicalId: string;
  originalPath: string;
  originalLanguage: string;
  title: string;
  lastModified: string;
  contentHash: string;
  translations: {
    [lang: string]: {
      path: string;
      status: 'current' | 'stale' | 'missing';
      lastTranslated: string;
      translationHash: string;
    };
  };
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: { [canonicalId: string]: RegistryEntry };
}

/**
 * Load existing registry or create new one
 */
function loadRegistry(): ContentRegistry {
  try {
    const content = readFileSync('data/content-registry.json', 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      entries: {},
    };
  }
}

/**
 * Save registry to file
 */
function saveRegistry(registry: ContentRegistry): void {
  registry.lastUpdated = new Date().toISOString();
  writeFileSync('data/content-registry.json', JSON.stringify(registry, null, 2));
}

/**
 * Generate content hash from file content
 */
function generateContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Generate canonical ID for new content
 */
function generateCanonicalId(filePath: string, content: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const hash = createHash('sha256')
    .update(filePath + content)
    .digest('hex')
    .substring(0, 8);
  return `slug-${date}-${hash}`;
}

/**
 * Update frontmatter for a content file
 */
function updateContentFrontmatter(filePath: string, updates: Record<string, string | boolean | undefined>): void {
  const content = readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: markdownContent } = matter(content);

  // Merge updates into frontmatter
  const updatedFrontmatter = { ...frontmatter, ...updates };

  // Reconstruct the file
  const newContent = matter.stringify(markdownContent, updatedFrontmatter);
  writeFileSync(filePath, newContent);

  console.log(`Updated ${filePath} with:`, updates);
}

/**
 * Classify content relationships and update registry
 */
async function classifyAndUpdateContent(): Promise<void> {
  console.log('🔄 Classifying content relationships and updating registry...');

  // Load existing registry
  const registry = loadRegistry();
  console.log(`Loaded registry with ${Object.keys(registry.entries).length} existing entries`);

  // Get relationship analysis
  const relationships = await analyzeContentForClassification();
  console.log(`Analyzing ${relationships.length} content groups`);

  // Process clear translation relationships
  const clearRelationships = relationships.filter((r: RelationshipAnalysis) => !r.needsManualReview);
  console.log(`\n✅ Processing ${clearRelationships.length} clear relationships:`);

  for (const rel of clearRelationships) {
    if (!rel.suggestedOriginal) continue;

    const original = rel.suggestedOriginal;
    const translations = rel.suggestedTranslations;

    console.log(`\n📄 Processing ${rel.slug}:`);
    console.log(`  Original: ${original.language} (${original.path})`);
    console.log(`  Translations: ${translations.map((t: ContentFile) => `${t.language} (${t.path})`).join(', ')}`);

    // Generate or get canonical ID for original
    let canonicalId = original.canonicalId;
    if (!canonicalId) {
      canonicalId = generateCanonicalId(original.path, original.content);

      // Update original file with canonical ID
      updateContentFrontmatter(original.path, {
        canonicalId,
        originalLanguage: original.language,
      });
    }

    // Update registry entry for original
    const contentHash = generateContentHash(original.content);
    registry.entries[canonicalId] = {
      canonicalId,
      originalPath: original.path,
      originalLanguage: original.language,
      title: original.title,
      lastModified: new Date().toISOString(),
      contentHash,
      translations: {},
    };

    // Process translations
    for (const translation of translations) {
      console.log(`  Updating translation: ${translation.language}`);

      // Update translation file frontmatter
      updateContentFrontmatter(translation.path, {
        canonicalId,
        translationOf: canonicalId,
        sourceLanguage: original.language,
      });

      // Add to registry
      const translationHash = generateContentHash(translation.content);
      registry.entries[canonicalId].translations[translation.language] = {
        path: translation.path,
        status: translation.hasRichContent ? 'current' : 'missing',
        lastTranslated: new Date().toISOString(),
        translationHash,
      };
    }
  }

  // Report manual review cases
  const manualReviewCases = relationships.filter((r: RelationshipAnalysis) => r.needsManualReview);
  if (manualReviewCases.length > 0) {
    console.log(`\n⚠️  Manual review required for ${manualReviewCases.length} cases:`);
    for (const rel of manualReviewCases) {
      console.log(`  ${rel.slug}: ${rel.reason}`);
      console.log(`    Files: ${rel.files.map((f: ContentFile) => `${f.language} (${f.wordCount} words)`).join(', ')}`);
    }
    console.log('\n💡 These cases need manual classification before proceeding');
  }

  // Save updated registry
  saveRegistry(registry);
  console.log(`\n💾 Registry updated with ${Object.keys(registry.entries).length} entries`);

  // Summary
  console.log('\n📊 CLASSIFICATION SUMMARY:');
  console.log(`✅ Processed: ${clearRelationships.length} clear relationships`);
  console.log(`⚠️  Manual review needed: ${manualReviewCases.length} cases`);
  console.log(`📁 Registry entries: ${Object.keys(registry.entries).length} total`);
}

// Main execution
classifyAndUpdateContent().catch(console.error);
