/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, writeFileSync } from 'fs';

/**
 * Fix registry file paths - they should have src/content/ prefix
 */
function fixRegistryPaths() {
  console.log('🔧 Fixing registry file paths...');

  const registryPath = 'data/content-registry.json';
  const content = readFileSync(registryPath, 'utf-8');
  const registry = JSON.parse(content);

  let fixedCount = 0;

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    const typedEntry = entry as any;
    const oldPath = typedEntry.originalPath;

    // Fix paths that don't start with src/content/
    if (!oldPath.startsWith('src/content/')) {
      let newPath = oldPath;

      // Handle different path formats
      if (
        oldPath.startsWith('books/') ||
        oldPath.startsWith('projects/') ||
        oldPath.startsWith('lab/') ||
        oldPath.startsWith('life/')
      ) {
        newPath = 'src/content/' + oldPath;
      } else if (oldPath.includes('\\') && oldPath.includes('content\\')) {
        // Already has full path but with backslashes - normalize
        newPath = oldPath.replace(/\\/g, '/');
      }

      if (newPath !== oldPath) {
        console.log(`  ${canonicalId}: ${oldPath} → ${newPath}`);
        typedEntry.originalPath = newPath;
        fixedCount++;
      }

      // Also fix translation paths
      for (const [lang, translation] of Object.entries(typedEntry.translations || {})) {
        const typedTranslation = translation as any;
        const oldTransPath = typedTranslation.path;
        let newTransPath = oldTransPath;

        if (!oldTransPath.startsWith('src/content/')) {
          if (
            oldTransPath.startsWith('books/') ||
            oldTransPath.startsWith('projects/') ||
            oldTransPath.startsWith('lab/') ||
            oldTransPath.startsWith('life/')
          ) {
            newTransPath = 'src/content/' + oldTransPath;
          } else if (oldTransPath.includes('\\') && oldTransPath.includes('content\\')) {
            newTransPath = oldTransPath.replace(/\\/g, '/');
          }

          if (newTransPath !== oldTransPath) {
            console.log(`    Translation ${lang}: ${oldTransPath} → ${newTransPath}`);
            typedTranslation.path = newTransPath;
            fixedCount++;
          }
        }
      }
    }
  }

  if (fixedCount > 0) {
    registry.lastUpdated = new Date().toISOString();
    writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    console.log(`✅ Fixed ${fixedCount} file paths in registry`);
  } else {
    console.log('✅ No paths needed fixing');
  }
}

fixRegistryPaths();
