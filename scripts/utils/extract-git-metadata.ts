import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { glob } from 'glob';
import { dirname } from 'path';

interface GitMetadata {
  [filePath: string]: {
    publishDate: string;
    modifiedDate: string;
  };
}

async function extractGitMetadata() {
  const contentFiles = glob.sync('src/content/**/*.{md,mdx}');
  const metadata: GitMetadata = {};

  for (const file of contentFiles) {
    try {
      // Get first commit date (publish date) - Windows compatible
      const firstCommitResult = execSync(`git log --reverse --format=%cI --follow -- "${file}"`, {
        encoding: 'utf8',
      }).trim();
      const firstCommit = firstCommitResult.split('\n')[0];

      // Get last commit date (modified date)
      const lastCommit = execSync(`git log -1 --format=%cI -- "${file}"`, { encoding: 'utf8' }).trim();

      if (firstCommit && lastCommit) {
        metadata[file] = {
          publishDate: firstCommit,
          modifiedDate: lastCommit,
        };
      }
    } catch (error) {
      console.warn(`Could not extract git metadata for ${file}:`, error);
    }
  }

  // Ensure the directory exists
  const outputPath = 'src/generated/git-metadata.json';
  mkdirSync(dirname(outputPath), { recursive: true });

  writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Extracted metadata for ${Object.keys(metadata).length} files`);
}

extractGitMetadata().catch(console.error);
