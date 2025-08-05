#!/usr/bin/env tsx

/**
 * Content Canonical System - Simplified Version
 * @purpose Manage canonical IDs and content registry
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

type SupportedLanguage = 'en' | 'de';

const CONTENT_BASE_PATH = 'src/content';
const CONTENT_REGISTRY_PATH = 'data/content-registry.json';
const CONTENT_COLLECTIONS = ['books', 'projects', 'lab', 'life'];

interface ContentRegistryEntry {
  canonicalId: string;
  originalPath: string;
  originalLanguage: SupportedLanguage;
  title: string;
  lastModified: string;
  contentHash: string;
  translations: Record<
    string,
    {
      path: string;
      status: 'current' | 'stale' | 'missing';
      lastTranslated: string;
      translationHash: string;
    }
  >;
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: Record<string, ContentRegistryEntry>;
}

function generateCanonicalId(filePath: string, content: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const hash = crypto
    .createHash('sha256')
    .update(filePath + content)
    .digest('hex')
    .substring(0, 8);
  return `slug-${date}-${hash}`;
}

function loadContentRegistry(): ContentRegistry {
  if (!fs.existsSync(CONTENT_REGISTRY_PATH)) {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      entries: {},
    };
  }

  try {
    return JSON.parse(fs.readFileSync(CONTENT_REGISTRY_PATH, 'utf-8'));
  } catch (error) {
    console.warn('Failed to load content registry, creating new one:', error);
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      entries: {},
    };
  }
}

function saveContentRegistry(registry: ContentRegistry): void {
  registry.lastUpdated = new Date().toISOString();

  // Ensure data directory exists
  fs.mkdirSync(path.dirname(CONTENT_REGISTRY_PATH), { recursive: true });

  fs.writeFileSync(CONTENT_REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function getAllContentFiles(): string[] {
  const files: string[] = [];

  for (const collection of CONTENT_COLLECTIONS) {
    const collectionPath = path.join(CONTENT_BASE_PATH, collection);
    if (!fs.existsSync(collectionPath)) {
      console.log(`⏭️ Skipping non-existent collection: ${collection}`);
      continue;
    }

    console.log(`📁 Scanning collection: ${collection}`);

    function scanDirectory(dirPath: string) {
      const entries = fs.readdirSync(dirPath);

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const stat = fs.statSync(entryPath);

        if (stat.isDirectory()) {
          scanDirectory(entryPath);
        } else if (entry.match(/\.(md|mdx)$/)) {
          files.push(entryPath);
        }
      }
    }

    scanDirectory(collectionPath);
  }

  console.log(`📄 Found ${files.length} content files total`);
  return files;
}

function scanAndUpdateContent(): { registryUpdated: boolean; filesUpdated: string[] } {
  console.log('🔍 Scanning content files for canonical ID updates...');

  const registry = loadContentRegistry();
  const files = getAllContentFiles();
  let registryUpdated = false;
  const filesUpdated: string[] = [];

  console.log(`📊 Processing ${files.length} files...`);

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    console.log(`[${i + 1}/${files.length}] Processing: ${path.relative(process.cwd(), filePath)}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(content);
      const relativePath = path.relative(CONTENT_BASE_PATH, filePath).replace(/\\/g, '/');

      // Check if file already has canonical ID
      let canonicalId = parsed.data.canonicalId as string;

      if (!canonicalId) {
        // Generate new canonical ID
        canonicalId = generateCanonicalId(relativePath, content);
        console.log(`  ✨ Generated canonical ID: ${canonicalId}`);

        // Update frontmatter
        parsed.data.canonicalId = canonicalId;
        const updated = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(filePath, updated);
        filesUpdated.push(filePath);
        registryUpdated = true;

        // Add to registry (simplified - treat everything as original for now)
        const language = (parsed.data.language as SupportedLanguage) || 'en';
        const title = (parsed.data.title as string) || path.basename(filePath, path.extname(filePath));

        registry.entries[canonicalId] = {
          canonicalId,
          originalPath: relativePath,
          originalLanguage: language,
          title,
          lastModified: new Date().toISOString(),
          contentHash: crypto.createHash('sha256').update(content).digest('hex'),
          translations: {},
        };
      } else {
        console.log(`  ✅ Already has canonical ID: ${canonicalId}`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error);
    }
  }

  if (registryUpdated) {
    console.log('💾 Saving content registry...');
    saveContentRegistry(registry);
    console.log(`✅ Updated content registry with ${Object.keys(registry.entries).length} entries`);
  }

  return { registryUpdated, filesUpdated };
}

function main() {
  const command = process.argv[2];

  console.log(`🚀 Content Canonical System - Command: ${command || 'none'}`);

  switch (command) {
    case 'scan': {
      const result = scanAndUpdateContent();
      console.log(`\n📊 Scan Results:`);
      console.log(`   Registry updated: ${result.registryUpdated}`);
      console.log(`   Files updated: ${result.filesUpdated.length}`);
      if (result.filesUpdated.length > 0) {
        console.log(`   Updated files:`);
        result.filesUpdated.forEach((file) => {
          console.log(`     - ${path.relative(process.cwd(), file)}`);
        });
      }
      break;
    }

    default:
      console.log('Usage: content-canonical-simple.ts <scan>');
      console.log('  scan - Scan content and update registry');
      process.exit(1);
  }

  console.log('\n✅ Done!');
}

// Run immediately
main();
