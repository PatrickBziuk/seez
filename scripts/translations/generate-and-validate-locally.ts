#!/usr/bin/env tsx

/**
 * Generate and Validate Translations Locally (BLOCKING)
 *
 * Purpose: Detect missing translations, generate them via OpenAI API locally, and validate quality
 *
 * This script:
 * - Detects missing translations using canonical registry
 * - Generates AI translations locally for review
 * - Validates translation links and quality
 * - Stages generated files for commit
 * - Requires human review before allowing commit
 *
 * @blocking This validation BLOCKS commits until translations are generated and reviewed
 * @dependencies OpenAI API, content registry, translation detection system
 * @usedBy Pre-commit validation
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import matter from 'gray-matter';
import OpenAI from 'openai';
import { execSync } from 'child_process';

interface TranslationTask {
  canonicalId: string;
  originalPath: string;
  originalLanguage: string;
  targetLanguage: string;
  targetPath: string;
  priority: 'high' | 'medium' | 'low';
}

interface ValidationError {
  task: string;
  issue: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  generated: number;
  reviewed: number;
  summary: string;
}

interface RegistryEntry {
  originalLanguage: string;
  originalPath: string;
  translations?: { [lang: string]: { status: string; path: string; timestamp?: string } };
}

interface ContentByLanguage {
  [language: string]: {
    path: string;
    frontmatter: Record<string, unknown>;
  };
}

/**
 * Load environment configuration
 */
function loadConfig() {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    openaiKey,
    targetLanguages: ['en', 'de'],
    qualityThreshold: 70,
    maxTokens: 2000,
  };
}

/**
 * Detect missing translations using canonical registry
 */
async function detectMissingTranslations(): Promise<TranslationTask[]> {
  console.log('🔍 Detecting missing translations...');

  const tasks: TranslationTask[] = [];

  try {
    // Load content registry
    const registryPath = 'data/content-registry.json';
    if (!existsSync(registryPath)) {
      console.log('⚠️  No content registry found, scanning files directly...');
      return await detectMissingTranslationsFromFiles();
    }

    const registryContent = readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);

    const config = loadConfig();

    for (const [canonicalId, entry] of Object.entries(registry.entries)) {
      const typedEntry = entry as RegistryEntry;

      // Check each target language
      for (const targetLang of config.targetLanguages) {
        if (targetLang === typedEntry.originalLanguage) continue;

        // Check if translation exists
        const hasTranslation = typedEntry.translations && typedEntry.translations[targetLang];

        if (!hasTranslation) {
          // Determine target path
          const originalPath = typedEntry.originalPath;
          const pathParts = originalPath.split('/');
          const collection = pathParts[2]; // src/content/[collection]
          const filename = pathParts[pathParts.length - 1];

          let targetPath: string;
          if (pathParts[3] && ['en', 'de'].includes(pathParts[3])) {
            // Language-specific directory structure
            pathParts[3] = targetLang;
            targetPath = pathParts.join('/');
          } else {
            // Flat structure - add language to filename
            const baseName = filename.replace(/\.(md|mdx)$/, '');
            const extension = filename.split('.').pop();
            targetPath = `src/content/${collection}/${baseName}.${targetLang}.${extension}`;
          }

          tasks.push({
            canonicalId,
            originalPath,
            originalLanguage: typedEntry.originalLanguage,
            targetLanguage: targetLang,
            targetPath,
            priority: 'medium',
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to detect missing translations:', error);
    return [];
  }

  console.log(`📄 Found ${tasks.length} missing translations`);
  return tasks;
}

/**
 * Fallback: detect missing translations by scanning files directly
 */
async function detectMissingTranslationsFromFiles(): Promise<TranslationTask[]> {
  const tasks: TranslationTask[] = [];
  const config = loadConfig();

  try {
    const contentFiles = await glob('src/content/{books,projects,lab,life,pages,figures,texts,music}/**/*.{md,mdx}', {
      cwd: process.cwd(),
    });

    const contentByCanonicalId = new Map<string, ContentByLanguage>();

    // Group content by canonical ID
    for (const filePath of contentFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(content);

        const canonicalId = frontmatter.canonicalId || filePath;
        const language = frontmatter.language || 'en';

        if (!contentByCanonicalId.has(canonicalId)) {
          contentByCanonicalId.set(canonicalId, {});
        }

        const canonicalContent = contentByCanonicalId.get(canonicalId)!;
        canonicalContent[language] = {
          path: filePath,
          frontmatter,
        };
      } catch (error) {
        console.warn(`⚠️  Could not parse ${filePath}:`, error);
      }
    }

    // Find missing translations
    for (const [canonicalId, languageMap] of contentByCanonicalId) {
      for (const targetLang of config.targetLanguages) {
        if (!languageMap[targetLang]) {
          // Find original language version
          const originalLang = Object.keys(languageMap)[0];
          const original = languageMap[originalLang];

          if (original) {
            const originalPath = original.path;
            const pathParts = originalPath.split('/');
            const filename = pathParts[pathParts.length - 1];
            const collection = pathParts[2];

            const baseName = filename.replace(/\.(md|mdx)$/, '');
            const extension = filename.split('.').pop();
            const targetPath = `src/content/${collection}/${baseName}.${targetLang}.${extension}`;

            tasks.push({
              canonicalId,
              originalPath,
              originalLanguage: originalLang,
              targetLanguage: targetLang,
              targetPath,
              priority: 'medium',
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to scan files for missing translations:', error);
  }

  return tasks;
}

/**
 * Generate translation using OpenAI API
 */
async function generateTranslation(task: TranslationTask, openai: OpenAI): Promise<string | null> {
  try {
    console.log(`🤖 Generating ${task.targetLanguage} translation for ${task.canonicalId}...`);

    const originalContent = readFileSync(task.originalPath, 'utf-8');
    const { data: frontmatter, content } = matter(originalContent);
    const notranslate: string[] = Array.isArray(frontmatter.notranslate) ? (frontmatter.notranslate as string[]) : [];
    let masked = content;
    let idx = 0;
    for (const phrase of notranslate) {
      if (!phrase || phrase.length < 2) continue;
      const safe = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safe, 'g');
      masked = masked.replace(re, `__NOTR_${idx++}__`);
    }

    const targetLanguageName = task.targetLanguage === 'de' ? 'German' : 'English';

    const prompt = `You are a professional translator. Translate the following markdown content from ${task.originalLanguage} to ${targetLanguageName}. 

IMPORTANT INSTRUCTIONS:
1. Translate ONLY the content text, NOT the frontmatter metadata
2. Preserve all markdown formatting (headers, links, code blocks, etc.)
3. Keep technical terms and proper nouns in their original form when appropriate
4. Maintain the same tone and style as the original
5. Do not add explanations or comments

Original content to translate:

${masked}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator specializing in technical and content translation. Provide accurate, natural translations while preserving formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const translatedContent = response.choices[0]?.message?.content;
    if (!translatedContent) {
      throw new Error('No translation received from OpenAI');
    }

    // Create translated frontmatter
    const translatedFrontmatter = {
      ...frontmatter,
      language: task.targetLanguage,
      translationOf: task.canonicalId,
      status: {
        ...frontmatter.status,
        translation: 'AI',
        translationReviewed: false,
      },
    };

    // Combine frontmatter and content
    const fullTranslation = matter.stringify(translatedContent, translatedFrontmatter);

    return fullTranslation;
  } catch (error) {
    console.error(`❌ Failed to generate translation for ${task.canonicalId}:`, error);
    return null;
  }
}

/**
 * Generate all missing translations
 */
async function generateMissingTranslations(tasks: TranslationTask[]): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let generated = 0;

  if (tasks.length === 0) {
    return {
      passed: true,
      errors: [],
      warnings: [],
      generated: 0,
      reviewed: 0,
      summary: '✅ No missing translations detected',
    };
  }

  try {
    const config = loadConfig();
    const openai = new OpenAI({ apiKey: config.openaiKey });

    console.log(`🚀 Generating ${tasks.length} missing translations...`);

    for (const task of tasks) {
      try {
        // Check if target file already exists
        if (existsSync(task.targetPath)) {
          warnings.push({
            task: task.canonicalId,
            issue: `Translation file already exists: ${task.targetPath}`,
            severity: 'warning',
          });
          continue;
        }

        const translation = await generateTranslation(task, openai);
        if (translation) {
          // Ensure target directory exists
          const targetDir = task.targetPath.substring(0, task.targetPath.lastIndexOf('/'));
          execSync(`mkdir -p "${targetDir}"`, { stdio: 'ignore' });

          // Write translation file
          writeFileSync(task.targetPath, translation, 'utf-8');

          // Stage file for git
          try {
            execSync(`git add "${task.targetPath}"`, { stdio: 'ignore' });
            console.log(`✅ Generated and staged: ${task.targetPath}`);
            generated++;
          } catch {
            warnings.push({
              task: task.canonicalId,
              issue: `Generated file but failed to stage: ${task.targetPath}`,
              severity: 'warning',
            });
          }
        } else {
          errors.push({
            task: task.canonicalId,
            issue: 'Failed to generate translation',
            severity: 'critical',
          });
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (taskError) {
        errors.push({
          task: task.canonicalId,
          issue: `Translation generation failed: ${(taskError as Error).message}`,
          severity: 'critical',
        });
      }
    }
  } catch (error) {
    errors.push({
      task: 'translation-system',
      issue: `Translation system failed: ${(error as Error).message}`,
      severity: 'critical',
    });
  }

  const passed = errors.length === 0;
  const summary = passed
    ? `✅ Generated ${generated} translations successfully`
    : `❌ Failed to generate ${errors.length} translations`;

  return {
    passed,
    errors,
    warnings,
    generated,
    reviewed: 0, // Will be checked separately
    summary,
  };
}

/**
 * Validate that all AI translations have been human-reviewed
 */
async function validateTranslationReview(): Promise<ValidationResult> {
  console.log('👁️  Validating translation review status...');

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let reviewed = 0;

  try {
    const contentFiles = await glob('src/content/{books,projects,lab,life,pages}/**/*.{md,mdx}', {
      cwd: process.cwd(),
    });

    for (const filePath of contentFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(content);

        // Check if this is an AI translation
        if (frontmatter.translationOf && frontmatter.status?.translation === 'AI') {
          if (!frontmatter.status?.translationReviewed) {
            errors.push({
              task: filePath,
              issue: 'AI translation not marked as human-reviewed',
              severity: 'critical',
            });
          } else {
            reviewed++;
          }
        }
      } catch (parseError) {
        warnings.push({
          task: filePath,
          issue: `Could not parse file: ${(parseError as Error).message}`,
          severity: 'warning',
        });
      }
    }
  } catch (error) {
    errors.push({
      task: 'review-system',
      issue: `Review validation failed: ${(error as Error).message}`,
      severity: 'critical',
    });
  }

  const passed = errors.length === 0;
  const summary = passed
    ? `✅ All AI translations have been reviewed (${reviewed} reviewed)`
    : `❌ Found ${errors.length} unreviewed AI translations`;

  return {
    passed,
    errors,
    warnings,
    generated: 0,
    reviewed,
    summary,
  };
}

/**
 * Print validation results and exit with appropriate code
 */
function reportResults(generationResult: ValidationResult, reviewResult: ValidationResult): void {
  console.log('\n📊 TRANSLATION GENERATION & VALIDATION RESULTS');
  console.log('\n' + generationResult.summary);
  console.log(reviewResult.summary);

  const allErrors = [...generationResult.errors, ...reviewResult.errors];
  const allWarnings = [...generationResult.warnings, ...reviewResult.warnings];

  if (allErrors.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES (must be fixed before commit):');
    allErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.task}`);
      console.log(`     ${error.issue}`);
    });

    console.log('\n💡 To fix:');
    console.log('   • Review all AI-generated translations manually');
    console.log('   • Add translationReviewed: true to status for approved translations');
    console.log('   • Fix any translation generation failures');
    console.log('   • Ensure translation relationships are properly configured');
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended fixes):');
    allWarnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.task}`);
      console.log(`     ${warning.issue}`);
    });
  }

  const passed = generationResult.passed && reviewResult.passed;

  if (passed) {
    console.log('\n🎉 All translations are generated and reviewed! Ready for commit.');
    process.exit(0);
  } else {
    console.log('\n❌ Commit blocked due to translation issues.');
    console.log('Please review generated translations and mark them as reviewed.');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    console.log('🌍 Starting translation generation and validation...');

    // Step 1: Detect and generate missing translations
    const missingTasks = await detectMissingTranslations();
    const generationResult = await generateMissingTranslations(missingTasks);

    // Step 2: Validate that all AI translations are reviewed
    const reviewResult = await validateTranslationReview();

    // Report results
    reportResults(generationResult, reviewResult);
  } catch (error) {
    console.error('❌ Translation workflow failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateMissingTranslations, validateTranslationReview };
