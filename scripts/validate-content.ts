import { glob } from 'glob';
import { readFileSync } from 'fs';
import matter from 'gray-matter';

function validateUniqueness(slugs: string[]): string[] {
  const seen = new Set();
  const duplicates: string[] = [];

  for (const slug of slugs) {
    if (seen.has(slug)) {
      duplicates.push(slug);
    } else {
      seen.add(slug);
    }
  }

  return duplicates;
}

async function validateContent() {
  console.log('🔍 Validating content collections...');

  const collections = ['books', 'projects', 'lab', 'life', 'pages'];
  const allSlugs: string[] = [];
  const issues: string[] = [];

  for (const collectionName of collections) {
    try {
      console.log(`📚 Validating collection: ${collectionName}`);
      const pattern = `src/content/${collectionName}/**/*.{md,mdx}`;
      const files = glob.sync(pattern);

      for (const filePath of files) {
        const content = readFileSync(filePath, 'utf-8');
        const { data } = matter(content);
        const filename =
          filePath
            .split('/')
            .pop()
            ?.replace(/\.(md|mdx)$/, '') || '';

        // Check for required fields
        if (!data.title) {
          issues.push(`${collectionName}/${filename}: Missing title`);
        }

        // Check description for collections that should have it
        if (collectionName !== 'pages' && !data.description) {
          issues.push(`${collectionName}/${filename}: Missing description (recommended)`);
        }

        // Validate language field
        if (!data.language || !['en', 'de'].includes(data.language)) {
          issues.push(`${collectionName}/${filename}: Invalid or missing language field`);
        }

        // Check for duplicate slugs across all collections
        const entrySlug = filename;
        const fullSlug = `${data.language}/${collectionName}/${entrySlug}`;
        allSlugs.push(fullSlug);
      }

      console.log(`✅ ${collectionName}: ${files.length} entries validated`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  Could not validate collection ${collectionName}:`, errorMessage);
    }
  }

  // Check for duplicate slugs
  const duplicates = validateUniqueness(allSlugs);
  if (duplicates.length > 0) {
    issues.push(`Duplicate slugs found: ${duplicates.join(', ')}`);
  }

  if (issues.length > 0) {
    console.error('❌ Content validation failed:');
    issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exit(1);
  } else {
    console.log('✅ Content validation passed');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateContent().catch(console.error);
}

export { validateContent };
