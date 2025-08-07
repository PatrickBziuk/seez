/**
 * Analyze existing tags across all content collections
 * Builds initial master tag registry from current content usage
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TagAnalysis {
  tag: string;
  language: 'en' | 'de';
  count: number;
  collections: string[];
  files: string[];
}

interface TagRegistry {
  version: string;
  lastUpdated: string;
  analysis: {
    totalFiles: number;
    totalTags: number;
    byLanguage: {
      en: number;
      de: number;
    };
    byCollection: Record<string, number>;
  };
  tags: {
    en: Record<string, TagAnalysis>;
    de: Record<string, TagAnalysis>;
  };
  suggestions: {
    multilingual_pairs: Array<{
      en: string;
      de: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
    categories: {
      technology: string[];
      content: string[];
      personal: string[];
      creative: string[];
      other: string[];
    };
  };
}

async function analyzeExistingTags(): Promise<TagRegistry> {
  const contentDir = path.join(__dirname, '../../../src/content');
  const collections = ['books', 'projects', 'lab', 'life', 'pages'];

  const tagsByLanguage: {
    en: Map<string, TagAnalysis>;
    de: Map<string, TagAnalysis>;
  } = {
    en: new Map(),
    de: new Map(),
  };

  let totalFiles = 0;
  const collectionCounts: Record<string, number> = {};

  console.log('🔍 Analyzing existing tags across all content...');

  for (const collection of collections) {
    const collectionPath = path.join(contentDir, collection);
    if (!fs.existsSync(collectionPath)) {
      console.log(`⚠️  Collection ${collection} not found, skipping`);
      continue;
    }

    // Find all markdown files in collection using fs.readdirSync
    const files: string[] = [];

    function findMarkdownFiles(dir: string): string[] {
      const result: string[] = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          result.push(...findMarkdownFiles(fullPath));
        } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.mdx'))) {
          result.push(fullPath);
        }
      }
      return result;
    }

    files.push(...findMarkdownFiles(collectionPath));
    collectionCounts[collection] = files.length;
    totalFiles += files.length;

    console.log(`📁 Processing ${collection}: ${files.length} files`);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const { data: frontmatter } = matter(content);

        const language = (frontmatter.language as 'en' | 'de') || 'en';
        const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

        if (tags.length === 0) {
          console.log(`  📄 ${path.basename(file)}: No tags`);
          continue;
        }

        console.log(`  📄 ${path.basename(file)} (${language}): [${tags.join(', ')}]`);

        // Process each tag
        for (const tag of tags) {
          if (typeof tag !== 'string') continue;

          const normalizedTag = tag.toLowerCase().trim();
          const langMap = tagsByLanguage[language];

          if (langMap.has(normalizedTag)) {
            const existing = langMap.get(normalizedTag)!;
            existing.count++;
            if (!existing.collections.includes(collection)) {
              existing.collections.push(collection);
            }
            existing.files.push(path.relative(contentDir, file));
          } else {
            langMap.set(normalizedTag, {
              tag: normalizedTag,
              language,
              count: 1,
              collections: [collection],
              files: [path.relative(contentDir, file)],
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error);
      }
    }
  }

  // Convert Maps to objects and generate suggestions
  const tagsEn = Object.fromEntries(tagsByLanguage.en);
  const tagsDe = Object.fromEntries(tagsByLanguage.de);

  console.log('\n📊 Analysis Summary:');
  console.log(`   Total files: ${totalFiles}`);
  console.log(`   English tags: ${Object.keys(tagsEn).length}`);
  console.log(`   German tags: ${Object.keys(tagsDe).length}`);

  // Generate multilingual pairs suggestions
  const multilingualPairs = generateMultilingualPairs(tagsEn, tagsDe);

  // Categorize tags
  const categories = categorizeTags([...Object.keys(tagsEn), ...Object.keys(tagsDe)]);

  const registry: TagRegistry = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    analysis: {
      totalFiles,
      totalTags: Object.keys(tagsEn).length + Object.keys(tagsDe).length,
      byLanguage: {
        en: Object.keys(tagsEn).length,
        de: Object.keys(tagsDe).length,
      },
      byCollection: collectionCounts,
    },
    tags: {
      en: tagsEn,
      de: tagsDe,
    },
    suggestions: {
      multilingual_pairs: multilingualPairs,
      categories,
    },
  };

  return registry;
}

function generateMultilingualPairs(
  tagsEn: Record<string, TagAnalysis>,
  tagsDe: Record<string, TagAnalysis>
): Array<{ en: string; de: string; confidence: 'high' | 'medium' | 'low' }> {
  const pairs: Array<{ en: string; de: string; confidence: 'high' | 'medium' | 'low' }> = [];

  // Known translations with high confidence
  const knownPairs: Record<string, string> = {
    ai: 'ki',
    music: 'musik',
    programming: 'programmierung',
    'web-development': 'web-entwicklung',
    'machine-learning': 'maschinelles-lernen',
    tutorial: 'anleitung',
    guide: 'leitfaden',
    documentation: 'dokumentation',
    translation: 'übersetzung',
    writing: 'schreiben',
    creative: 'kreativ',
    personal: 'persönlich',
    project: 'projekt',
    startup: 'startup', // Same in both languages
    collaboration: 'zusammenarbeit',
  };

  // Add known pairs if both tags exist
  for (const [en, de] of Object.entries(knownPairs)) {
    if (tagsEn[en] && tagsDe[de]) {
      pairs.push({ en, de, confidence: 'high' });
    }
  }

  // Find potential pairs based on similar usage patterns
  for (const enTag of Object.keys(tagsEn)) {
    for (const deTag of Object.keys(tagsDe)) {
      // Skip if already paired
      if (pairs.some((p) => p.en === enTag || p.de === deTag)) continue;

      const enAnalysis = tagsEn[enTag];
      const deAnalysis = tagsDe[deTag];

      // Check if they appear in similar collections
      const sharedCollections = enAnalysis.collections.filter((c) => deAnalysis.collections.includes(c));

      if (sharedCollections.length > 0) {
        const confidence = sharedCollections.length >= 2 ? 'medium' : 'low';
        pairs.push({ en: enTag, de: deTag, confidence });
      }
    }
  }

  return pairs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
}

function categorizeTags(allTags: string[]): {
  technology: string[];
  content: string[];
  personal: string[];
  creative: string[];
  other: string[];
} {
  const categories = {
    technology: [] as string[],
    content: [] as string[],
    personal: [] as string[],
    creative: [] as string[],
    other: [] as string[],
  };

  const categoryKeywords = {
    technology: [
      'programming',
      'programmierung',
      'javascript',
      'typescript',
      'astro',
      'ai',
      'ki',
      'web',
      'development',
      'entwicklung',
      'machine-learning',
      'maschinelles-lernen',
      'tech',
      'code',
      'software',
      'api',
      'database',
      'framework',
    ],
    content: [
      'demo',
      'showcase',
      'components',
      'tutorial',
      'anleitung',
      'guide',
      'leitfaden',
      'documentation',
      'dokumentation',
      'translation',
      'übersetzung',
      'writing',
      'schreiben',
      'badge',
      'tldr',
    ],
    personal: [
      'personal',
      'persönlich',
      'reflection',
      'reflexion',
      'journey',
      'reise',
      'experience',
      'erfahrung',
      'learning',
      'lernen',
      'growth',
      'wachstum',
    ],
    creative: ['music', 'musik', 'art', 'kunst', 'design', 'creative', 'kreativ', 'inspiration'],
  };

  for (const tag of allTags) {
    let categorized = false;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => tag.includes(keyword) || keyword.includes(tag))) {
        categories[category as keyof typeof categories].push(tag);
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories.other.push(tag);
    }
  }

  return categories;
}

async function main() {
  try {
    console.log('🚀 Starting tag analysis...\n');
    console.log('Script directory:', __dirname);
    console.log('Working directory:', process.cwd());

    const registry = await analyzeExistingTags();

    // Save the analysis
    const outputPath = path.join(__dirname, '../../../src/data/tags/tag-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

    console.log('\n✅ Tag analysis complete!');
    console.log(`📁 Analysis saved to: ${outputPath}`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`   Total files analyzed: ${registry.analysis.totalFiles}`);
    console.log(`   Total unique tags: ${registry.analysis.totalTags}`);
    console.log(`   English tags: ${registry.analysis.byLanguage.en}`);
    console.log(`   German tags: ${registry.analysis.byLanguage.de}`);
    console.log(`   Multilingual pairs found: ${registry.suggestions.multilingual_pairs.length}`);

    console.log('\n🏷️  Most common tags by language:');

    // Show top tags for each language
    const topEnTags = Object.values(registry.tags.en)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topDeTags = Object.values(registry.tags.de)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log('\n   English:');
    topEnTags.forEach((tag) => {
      console.log(`     ${tag.tag} (${tag.count} files, collections: ${tag.collections.join(', ')})`);
    });

    console.log('\n   German:');
    topDeTags.forEach((tag) => {
      console.log(`     ${tag.tag} (${tag.count} files, collections: ${tag.collections.join(', ')})`);
    });

    if (registry.suggestions.multilingual_pairs.length > 0) {
      console.log('\n🔗 Suggested multilingual pairs:');
      registry.suggestions.multilingual_pairs.slice(0, 10).forEach((pair) => {
        console.log(`     ${pair.en} ↔ ${pair.de} (${pair.confidence} confidence)`);
      });
    }
  } catch (error) {
    console.error('❌ Error during tag analysis:', error);
    process.exit(1);
  }
}

// Run the script
console.log('Script loaded, calling main...');
main().catch((error) => {
  console.error('Error in main:', error);
  process.exit(1);
});
