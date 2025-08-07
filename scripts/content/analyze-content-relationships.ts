import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import * as path from 'path';
import matter from 'gray-matter';

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
 * Analyze content files to identify translation relationships
 */
async function analyzeContentRelationships(): Promise<RelationshipAnalysis[]> {
  console.log('🔍 Analyzing content relationships...');

  // Find all content files
  const contentFiles = await glob('src/content/{books,projects,lab,life}/**/*.{md,mdx}', {
    cwd: process.cwd(),
  });

  console.log(`Found ${contentFiles.length} content files`);

  // Parse all files
  const parsedFiles: ContentFile[] = [];

  for (const filePath of contentFiles) {
    try {
      const fullPath = path.resolve(filePath);
      const content = readFileSync(fullPath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);

      // Extract metadata
      const pathParts = filePath.replace(/\\/g, '/').split('/'); // Normalize Windows paths
      const collection = pathParts[2]; // books, projects, lab, life
      const language = pathParts[3]; // en, de
      const fileName = pathParts[pathParts.length - 1];
      const slug = fileName.replace(/\.(md|mdx)$/, '');

      // Calculate content richness
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

  console.log(`Parsed ${parsedFiles.length} files successfully`);

  // Group files by slug to find potential translations
  const groupedBySlug = new Map<string, ContentFile[]>();

  for (const file of parsedFiles) {
    const key = `${file.collection}/${file.slug}`;
    if (!groupedBySlug.has(key)) {
      groupedBySlug.set(key, []);
    }
    groupedBySlug.get(key)!.push(file);
  }

  // Analyze relationships
  const relationships: RelationshipAnalysis[] = [];

  for (const [key, files] of groupedBySlug) {
    if (files.length === 1) {
      // Single file - no translation relationship
      continue;
    }

    const [_collection, _slug] = key.split('/');
    const collections = [...new Set(files.map((f) => f.collection))];

    // Analyze which should be the original
    const richFiles = files.filter((f) => f.hasRichContent);
    const poorFiles = files.filter((f) => !f.hasRichContent);

    let suggestedOriginal: ContentFile | undefined;
    let suggestedTranslations: ContentFile[] = [];
    let needsManualReview = false;
    let reason = '';

    if (richFiles.length === 1 && poorFiles.length >= 1) {
      // Clear case: one rich file, one or more poor files
      suggestedOriginal = richFiles[0];
      suggestedTranslations = poorFiles;
      reason = `Clear original-translation relationship: ${suggestedOriginal.language} has ${suggestedOriginal.wordCount} words, others are placeholders`;
    } else if (richFiles.length > 1) {
      // Multiple rich files - potential divergence
      needsManualReview = true;
      // Suggest the file with most content as original
      suggestedOriginal = richFiles.sort((a, b) => b.wordCount - a.wordCount)[0];
      suggestedTranslations = richFiles.filter((f) => f !== suggestedOriginal);
      reason = `Multiple rich files found - potential content divergence needs manual review`;
    } else if (richFiles.length === 0) {
      // All files are poor - stub files
      needsManualReview = true;
      reason = `All files are placeholders - unclear which should be original`;
    } else {
      // Edge case
      needsManualReview = true;
      reason = `Unclear relationship pattern`;
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

/**
 * Display analysis results
 */
function displayResults(relationships: RelationshipAnalysis[]) {
  console.log('\n📊 ANALYSIS RESULTS');
  console.log('='.repeat(50));

  const clearCases = relationships.filter((r) => !r.needsManualReview);
  const manualReviewCases = relationships.filter((r) => r.needsManualReview);

  console.log(`\n✅ Clear Translation Relationships: ${clearCases.length}`);
  for (const rel of clearCases) {
    console.log(`\n📄 ${rel.slug}`);
    console.log(`   Original: ${rel.suggestedOriginal?.language} (${rel.suggestedOriginal?.wordCount} words)`);
    console.log(
      `   Translations: ${rel.suggestedTranslations.map((t) => `${t.language} (${t.wordCount} words)`).join(', ')}`
    );
    console.log(`   Reason: ${rel.reason}`);
  }

  console.log(`\n⚠️  Manual Review Required: ${manualReviewCases.length}`);
  for (const rel of manualReviewCases) {
    console.log(`\n📄 ${rel.slug}`);
    console.log(`   Files: ${rel.files.map((f) => `${f.language} (${f.wordCount} words)`).join(', ')}`);
    console.log(`   Reason: ${rel.reason}`);
    if (rel.suggestedOriginal) {
      console.log(`   Suggested Original: ${rel.suggestedOriginal.language}`);
    }
  }

  console.log('\n📈 SUMMARY');
  console.log(`Total file groups analyzed: ${relationships.length}`);
  console.log(`Clear relationships: ${clearCases.length}`);
  console.log(`Need manual review: ${manualReviewCases.length}`);

  // Save detailed results for further processing
  const resultsPath = 'data/content-analysis-results.json';
  writeFileSync(resultsPath, JSON.stringify(relationships, null, 2));
  console.log(`\n💾 Detailed results saved to: ${resultsPath}`);
}

// Main execution
analyzeContentRelationships()
  .then(displayResults)
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });

export { analyzeContentRelationships, type RelationshipAnalysis, type ContentFile };
