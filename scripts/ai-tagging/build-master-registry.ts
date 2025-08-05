/**
 * Build master tag registry from analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MasterTagRegistry {
  version: string;
  lastUpdated: string;
  metadata: {
    totalTags: number;
    byLanguage: { en: number; de: number };
    sources: string[];
  };
  categories: {
    technology: {
      en: string[];
      de: string[];
    };
    content: {
      en: string[];
      de: string[];
    };
    personal: {
      en: string[];
      de: string[];
    };
    creative: {
      en: string[];
      de: string[];
    };
    academic: {
      en: string[];
      de: string[];
    };
    business: {
      en: string[];
      de: string[];
    };
    other: {
      en: string[];
      de: string[];
    };
  };
  multilingual_pairs: Array<{
    en: string;
    de: string;
    confidence: 'high' | 'medium' | 'low';
    category?: string;
  }>;
  aliases: {
    en: Record<string, string>;
    de: Record<string, string>;
  };
  usage_stats: {
    [tag: string]: {
      language: 'en' | 'de';
      count: number;
      collections: string[];
      last_seen: string;
    };
  };
}

async function buildMasterRegistry(): Promise<MasterTagRegistry> {
  console.log('📋 Building master tag registry...');

  // Load the analysis
  const analysisPath = path.join(__dirname, '../../src/data/tags/tag-analysis.json');
  if (!fs.existsSync(analysisPath)) {
    throw new Error('Tag analysis not found. Run analyze-existing-tags.ts first.');
  }

  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

  // Initialize registry structure
  const registry: MasterTagRegistry = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    metadata: {
      totalTags: analysis.analysis.totalTags,
      byLanguage: analysis.analysis.byLanguage,
      sources: ['content-analysis', 'manual-curation'],
    },
    categories: {
      technology: { en: [], de: [] },
      content: { en: [], de: [] },
      personal: { en: [], de: [] },
      creative: { en: [], de: [] },
      academic: { en: [], de: [] },
      business: { en: [], de: [] },
      other: { en: [], de: [] },
    },
    multilingual_pairs: [],
    aliases: { en: {}, de: {} },
    usage_stats: {},
  };

  // Categorize English tags
  const enTags = Object.keys(analysis.tags.en);
  categorizeTagsIntoRegistry(enTags, 'en', registry, analysis.tags.en);

  // Categorize German tags
  const deTags = Object.keys(analysis.tags.de);
  categorizeTagsIntoRegistry(deTags, 'de', registry, analysis.tags.de);

  // Add high-confidence multilingual pairs
  registry.multilingual_pairs = [
    { en: 'ai', de: 'ki', confidence: 'high', category: 'technology' },
    { en: 'personal', de: 'persönlich', confidence: 'high', category: 'personal' },
    { en: 'music', de: 'musik', confidence: 'high', category: 'creative' },
    { en: 'reflection', de: 'reflexion', confidence: 'high', category: 'personal' },
    { en: 'programming', de: 'programmierung', confidence: 'high', category: 'technology' },
    { en: 'components', de: 'komponenten', confidence: 'high', category: 'technology' },
    { en: 'collaboration', de: 'zusammenarbeit', confidence: 'medium', category: 'business' },
    { en: 'literature', de: 'literatur', confidence: 'high', category: 'academic' },
    { en: 'creative', de: 'kreativ', confidence: 'high', category: 'creative' },
    { en: 'life', de: 'leben', confidence: 'high', category: 'personal' },
  ];

  // Add aliases for common abbreviations and variations
  registry.aliases.en = {
    js: 'javascript',
    ts: 'typescript',
    ml: 'machine-learning',
    ui: 'user-interface',
    ux: 'user-experience',
    api: 'application-programming-interface',
    css: 'cascading-style-sheets',
    html: 'hypertext-markup-language',
  };

  registry.aliases.de = {
    ki: 'künstliche-intelligenz',
    ui: 'benutzeroberfläche',
    api: 'programmierschnittstelle',
  };

  console.log('✅ Master registry built!');
  console.log(`   Categories populated: ${Object.keys(registry.categories).length}`);
  console.log(`   Multilingual pairs: ${registry.multilingual_pairs.length}`);
  console.log(`   English aliases: ${Object.keys(registry.aliases.en).length}`);
  console.log(`   German aliases: ${Object.keys(registry.aliases.de).length}`);

  return registry;
}

function categorizeTagsIntoRegistry(
  tags: string[],
  language: 'en' | 'de',
  registry: MasterTagRegistry,
  tagData: Record<string, { count: number; collections: string[]; files: string[]; language: string; tag: string }>
) {
  const categoryKeywords = {
    technology: {
      en: [
        'programming',
        'software',
        'javascript',
        'typescript',
        'astro',
        'ai',
        'web',
        'development',
        'components',
        'tech',
        'code',
        'api',
        'database',
        'framework',
        'portique',
        'foss',
        'jamstack',
        'supabase',
        'deployment',
        'accessibility',
        'mdx',
        'ui',
      ],
      de: [
        'programmierung',
        'software',
        'javascript',
        'typescript',
        'astro',
        'ki',
        'web',
        'entwicklung',
        'komponenten',
        'tech',
        'code',
        'api',
        'datenbank',
        'framework',
      ],
    },
    content: {
      en: ['demo', 'showcase', 'components', 'example', 'note', 'tldr', 'badge'],
      de: ['demo', 'beispiel', 'komponenten', 'notiz', 'tldr', 'badge'],
    },
    personal: {
      en: ['personal', 'reflection', 'life', 'career', 'experience', 'learning', 'growth'],
      de: ['persönlich', 'reflexion', 'leben', 'karriere', 'erfahrung', 'lernen', 'wachstum'],
    },
    creative: {
      en: ['music', 'creative', 'art', 'design', 'inspiration', 'portfolio', 'poetry'],
      de: ['musik', 'kreativ', 'kunst', 'design', 'inspiration', 'portfolio', 'poesie'],
    },
    academic: {
      en: ['literature', 'poetry', 'fiction', 'german literature', 'research'],
      de: ['literatur', 'poesie', 'fiktion', 'deutsche literatur', 'forschung'],
    },
    business: {
      en: ['startup', 'collaboration', 'consensus', 'platform', 'eu-hosting', 'digital sovereignty'],
      de: ['startup', 'zusammenarbeit', 'konsens', 'plattform', 'eu-hosting', 'digitale-souveränität'],
    },
  };

  for (const tag of tags) {
    let categorized = false;

    // Check each category
    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      const categoryKeywordList = keywords[language] || [];

      if (
        categoryKeywordList.some(
          (keyword) =>
            tag.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(tag.toLowerCase())
        )
      ) {
        registry.categories[categoryName as keyof typeof registry.categories][language].push(tag);
        categorized = true;
        break;
      }
    }

    // Handle specific tags that might not match keywords exactly
    if (!categorized) {
      // Trauma, depression, etc. -> personal
      if (['trauma', 'depression', 'selbstfindung', 'liebe'].includes(tag.toLowerCase())) {
        registry.categories.personal[language].push(tag);
        categorized = true;
      }
    }

    if (!categorized) {
      registry.categories.other[language].push(tag);
    }

    // Add usage stats
    if (tagData[tag]) {
      registry.usage_stats[tag] = {
        language,
        count: tagData[tag].count,
        collections: tagData[tag].collections,
        last_seen: new Date().toISOString(),
      };
    }
  }
}

async function main() {
  try {
    const registry = await buildMasterRegistry();

    // Save the registry
    const outputPath = path.join(__dirname, '../../src/data/tags/master-tag-registry.json');
    fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

    console.log(`📁 Master registry saved to: ${outputPath}`);

    // Display category summary
    console.log('\n📊 Category Summary:');
    Object.entries(registry.categories).forEach(([category, languages]) => {
      const enCount = languages.en.length;
      const deCount = languages.de.length;
      if (enCount > 0 || deCount > 0) {
        console.log(`   ${category}: ${enCount} EN, ${deCount} DE tags`);
        if (enCount > 0) console.log(`     EN: ${languages.en.slice(0, 5).join(', ')}${enCount > 5 ? '...' : ''}`);
        if (deCount > 0) console.log(`     DE: ${languages.de.slice(0, 5).join(', ')}${deCount > 5 ? '...' : ''}`);
      }
    });
  } catch (error) {
    console.error('❌ Error building master registry:', error);
    process.exit(1);
  }
}

// Run the script
main();
