import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import matter from 'gray-matter';

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: {
    [canonicalId: string]: {
      canonicalId: string;
      originalPath: string;
      originalLanguage: string;
      title: string;
      lastModified: string;
      contentHash: string;
      translations: Record<
        string,
        {
          path: string;
          status: string;
          lastTranslated: string;
          translationHash: string;
        }
      >;
    };
  };
}

/**
 * Manual resolution for content divergence cases
 */
function resolveContentDivergence() {
  console.log('🔧 Manual Content Divergence Resolution');
  console.log('=====================================');

  console.log('\n📄 Case: lab/tldr-demo');
  console.log('English: 189 words (comprehensive examples)');
  console.log('German: 97 words (simplified version)');
  console.log('\nAnalysis: English version is more comprehensive and likely the original.');
  console.log('Decision: Keep English as original, German as simplified translation.');

  // Load registry
  const registryContent = readFileSync('data/content-registry.json', 'utf-8');
  const registry: ContentRegistry = JSON.parse(registryContent);

  // Get the English version's canonical ID (it should become the main one)
  const enFile = 'src/content/lab/en/tldr-demo.mdx';
  const deFile = 'src/content/lab/de/tldr-demo.mdx';

  const enContent = readFileSync(enFile, 'utf-8');
  const { data: enFrontmatter } = matter(enContent);
  const enCanonicalId = enFrontmatter.canonicalId;

  const deContent = readFileSync(deFile, 'utf-8');
  const { data: deFrontmatter, content: deMarkdown } = matter(deContent);
  const deCanonicalId = deFrontmatter.canonicalId;

  console.log(`\nEnglish canonical ID: ${enCanonicalId}`);
  console.log(`German canonical ID: ${deCanonicalId}`);

  // Decision: Use English canonical ID as the main one
  const mainCanonicalId = enCanonicalId;

  // Update German file to be a translation of English
  const updatedDeFrontmatter = {
    ...deFrontmatter,
    canonicalId: mainCanonicalId,
    translationOf: mainCanonicalId,
    sourceLanguage: 'en',
  };

  const updatedDeContent = matter.stringify(deMarkdown, updatedDeFrontmatter);
  writeFileSync(deFile, updatedDeContent);

  console.log(`\n✅ Updated ${deFile}:`);
  console.log(`   - canonicalId: ${mainCanonicalId}`);
  console.log(`   - translationOf: ${mainCanonicalId}`);
  console.log(`   - sourceLanguage: en`);

  // Update registry - merge entries
  const enEntry = registry.entries[enCanonicalId];
  const deEntry = registry.entries[deCanonicalId];

  if (enEntry && deEntry) {
    // Update main entry to be the English one
    enEntry.originalLanguage = 'en';
    enEntry.translations = enEntry.translations || {};
    enEntry.translations.de = {
      path: deFile,
      status: 'current',
      lastTranslated: new Date().toISOString(),
      translationHash: createHash('sha256').update(deMarkdown).digest('hex'),
    };

    // Remove the old German entry
    delete registry.entries[deCanonicalId];

    console.log(`\n📁 Registry updated:`);
    console.log(`   - Merged entries under ${mainCanonicalId}`);
    console.log(`   - Removed duplicate entry ${deCanonicalId}`);
    console.log(`   - Added German as translation`);
  }

  // Save updated registry
  registry.lastUpdated = new Date().toISOString();
  writeFileSync('data/content-registry.json', JSON.stringify(registry, null, 2));

  console.log(`\n💾 Registry saved with consolidated entries`);
  console.log('\n✅ Content divergence resolved!');
  console.log('📊 Result: English original → German translation relationship established');
}

// Run the resolution
resolveContentDivergence();
