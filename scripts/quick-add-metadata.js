import fs from 'fs';
import matter from 'gray-matter';
import { glob } from 'glob';

async function addMissingMetadata() {
  console.log('🚀 Starting metadata addition for all published content...');

  const files = await glob('src/content/**/*.{md,mdx}');
  console.log(`📊 Found ${files.length} content files`);

  const currentTimestamp = new Date().toISOString();
  let updatedCount = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const parsed = matter(content);

      // Only process published content (draft !== true)
      if (parsed.data.draft === true) {
        continue;
      }

      const needsFirstPublish = !parsed.data.firstPublishDate;
      const needsPublish = !parsed.data.publishDate;

      if (needsFirstPublish || needsPublish) {
        console.log(`📝 Updating: ${file}`);

        if (needsFirstPublish) {
          parsed.data.firstPublishDate = currentTimestamp;
          console.log(`   ✅ Added firstPublishDate`);
        }

        if (needsPublish) {
          parsed.data.publishDate = currentTimestamp;
          console.log(`   ✅ Added publishDate`);
        }

        const updatedContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(file, updatedContent, 'utf-8');
        updatedCount++;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to process ${file}:`, error.message);
    }
  }

  console.log(`✅ Metadata addition completed! Updated ${updatedCount} files`);
}

addMissingMetadata().catch(console.error);
