#!/usr/bin/env tsx

/**
 * Translation Generation Script - Enhanced Robustness Version
 * Features:
 * - Progressive state saving with incremental commits
 * - Smart content filtering (preserves MDX components, code blocks, tags)
 * - Hallucination detection and content integrity checks
 * - Resume capability for interrupted jobs
 * - Content-only file processing
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import OpenAI from 'openai';
import { type TranslationTask, createTranslationHistoryEntry } from '../../src/utils/translation';

/**
 * Configuration constants
 */
const CONTENT_BASE_PATH = 'src/content';
const CACHE_DIR = '.translation-cache';
const PROGRESS_FILE = '.translation-progress.json';

/**
 * MDX component patterns to preserve during translation
 */
const MDX_COMPONENT_PATTERNS = [
  /<[A-Z][a-zA-Z0-9]*\s*[^>]*>/g, // Component opening tags
  /<\/[A-Z][a-zA-Z0-9]*>/g, // Component closing tags
  /import\s+.*\s+from\s+['"][^'"]+['"];?/g, // Import statements
  /```[\s\S]*?```/g, // Code blocks
  /`[^`]+`/g, // Inline code
  /\[([^\]]+)\]\(([^)]+)\)/g, // Links (preserve URLs)
];

/**
 * Translation progress tracking
 */
interface TranslationProgress {
  processedTasks: string[];
  lastProcessedTime: string;
  totalTasks: number;
  completedTasks: number;
}

/**
 * Content similarity analysis result
 */
interface SimilarityAnalysis {
  score: number;
  issues: string[];
  isHallucination: boolean;
}

/**
 * Recursively remove all undefined values from an object
 * This ensures YAML serialization won't fail due to undefined values
 */
function deepCleanUndefined(obj: unknown): unknown {
  if (obj === undefined || obj === null) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepCleanUndefined(item)).filter((item) => item !== null && item !== undefined);
  }

  if (typeof obj === 'object' && obj !== null) {
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const cleanedValue = deepCleanUndefined(value);
      if (cleanedValue !== undefined && cleanedValue !== null) {
        cleaned[key] = cleanedValue;
      }
    }

    return cleaned;
  }

  return obj;
}

/**
 * Validate and clean AI response structure
 */
function validateAndCleanAIResponse(response: unknown): {
  valid: boolean;
  cleaned?: {
    translated_markdown: string;
    ai_tldr?: string;
    ai_textscore?: Record<string, unknown>;
    review_issues?: Array<Record<string, unknown>>;
  };
  errors: string[];
} {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    errors.push('AI response is not a valid object');
    return { valid: false, errors };
  }

  const resp = response as Record<string, unknown>;

  // Check required field
  if (!resp.translated_markdown || typeof resp.translated_markdown !== 'string') {
    errors.push('Missing or invalid translated_markdown field');
  }

  // Validate ai_tldr if present
  if (resp.ai_tldr !== undefined && typeof resp.ai_tldr !== 'string') {
    errors.push('ai_tldr must be a string if present');
  }

  // Validate ai_textscore if present
  if (resp.ai_textscore !== undefined && typeof resp.ai_textscore !== 'object') {
    errors.push('ai_textscore must be an object if present');
  }

  // Validate review_issues if present
  if (resp.review_issues !== undefined && !Array.isArray(resp.review_issues)) {
    errors.push('review_issues must be an array if present');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Deep clean the response to remove undefined values
  const cleaned = deepCleanUndefined(resp) as {
    translated_markdown: string;
    ai_tldr?: string;
    ai_textscore?: Record<string, unknown>;
    review_issues?: Array<Record<string, unknown>>;
  };

  return { valid: true, cleaned, errors: [] };
}

/**
 * Check if a translation task has already been processed
 */
function isTaskAlreadyProcessed(task: TranslationTask, progress: TranslationProgress): boolean {
  const taskId = `${task.sourcePath}-${task.targetLang}-${task.sourceSha}`;
  return progress.processedTasks.includes(taskId);
}

/**
 * Load translation progress from file
 */
function loadProgress(): TranslationProgress {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return {
      processedTasks: [],
      lastProcessedTime: '',
      totalTasks: 0,
      completedTasks: 0,
    };
  }

  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch (error) {
    console.warn('Failed to load progress file, starting fresh:', error);
    return {
      processedTasks: [],
      lastProcessedTime: '',
      totalTasks: 0,
      completedTasks: 0,
    };
  }
}

/**
 * Save translation progress to file
 */
function saveProgress(progress: TranslationProgress): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Mark a task as completed in progress tracking
 */
function markTaskCompleted(task: TranslationTask, progress: TranslationProgress): void {
  const taskId = `${task.sourcePath}-${task.targetLang}-${task.sourceSha}`;
  progress.processedTasks.push(taskId);
  progress.completedTasks++;
  progress.lastProcessedTime = new Date().toISOString();
  saveProgress(progress);
}

/**
 * Extract translatable content, preserving components and technical elements
 */
function extractTranslatableContent(content: string): {
  translatableText: string;
  preservedElements: Map<string, string>;
} {
  let workingContent = content;
  const preservedElements = new Map<string, string>();
  let placeholderIndex = 0;

  // Preserve MDX components and technical elements
  for (const pattern of MDX_COMPONENT_PATTERNS) {
    workingContent = workingContent.replace(pattern, (match) => {
      const placeholder = `__PRESERVED_${placeholderIndex}__`;
      preservedElements.set(placeholder, match);
      placeholderIndex++;
      return placeholder;
    });
  }

  return {
    translatableText: workingContent,
    preservedElements,
  };
}

/**
 * Restore preserved elements back into translated content
 */
function restorePreservedElements(translatedContent: string, preservedElements: Map<string, string>): string {
  let restoredContent = translatedContent;

  for (const [placeholder, originalElement] of preservedElements) {
    restoredContent = restoredContent.replace(placeholder, originalElement);
  }

  return restoredContent;
}

/**
 * Analyze content similarity between original and translated versions
 */
function analyzeContentSimilarity(original: string, translated: string): SimilarityAnalysis {
  const issues: string[] = [];
  let score = 100;

  // Check if major structural elements are preserved
  const originalHeadings = original.match(/^#+\s+.+$/gm) || [];
  const translatedHeadings = translated.match(/^#+\s+.+$/gm) || [];

  if (originalHeadings.length !== translatedHeadings.length) {
    issues.push(`Heading count mismatch: ${originalHeadings.length} vs ${translatedHeadings.length}`);
    score -= 20;
  }

  // Check for code blocks preservation
  const originalCodeBlocks = original.match(/```[\s\S]*?```/g) || [];
  const translatedCodeBlocks = translated.match(/```[\s\S]*?```/g) || [];

  if (originalCodeBlocks.length !== translatedCodeBlocks.length) {
    issues.push(`Code block count mismatch: ${originalCodeBlocks.length} vs ${translatedCodeBlocks.length}`);
    score -= 15;
  }

  // Check for links preservation
  const originalLinks = original.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  const translatedLinks = translated.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

  if (originalLinks.length !== translatedLinks.length) {
    issues.push(`Link count mismatch: ${originalLinks.length} vs ${translatedLinks.length}`);
    score -= 10;
  }

  // Check for excessive length differences (potential hallucination)
  const lengthRatio = translated.length / original.length;
  if (lengthRatio > 1.5) {
    issues.push(`Translation is suspiciously longer than original (${lengthRatio.toFixed(2)}x)`);
    score -= 25;
  } else if (lengthRatio < 0.5) {
    issues.push(`Translation is suspiciously shorter than original (${lengthRatio.toFixed(2)}x)`);
    score -= 25;
  }

  const isHallucination = score < 60 || issues.length > 2;

  return {
    score: Math.max(0, score),
    issues,
    isHallucination,
  };
}

/**
 * Create a git commit for a successful translation
 */
function commitTranslation(task: TranslationTask, targetFile: string): void {
  try {
    execSync(`git add "${targetFile}"`, { stdio: 'pipe' });
    const commitMessage = `AI: translate ${task.translationKey} to ${task.targetLang} (${task.sourceSha.substring(0, 7)})`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
    console.log(`✅ Committed translation: ${targetFile}`);
  } catch (error) {
    console.warn(`⚠️ Failed to commit translation ${targetFile}:`, error);
  }
}

/**
 * Translate a single task with comprehensive error handling and validation
 */
async function translateTask(task: TranslationTask): Promise<boolean> {
  console.log(`🔍 Starting translation task: ${task.translationKey} → ${task.targetLang}`);
  console.log(`   Source path: ${task.sourcePath}`);
  console.log(`   Source SHA: ${task.sourceSha}`);
  console.log(`   Reason: ${task.reason}`);

  try {
    const { sourcePath, targetLang, sourceSha } = task;
    const srcFile = path.join(CONTENT_BASE_PATH, sourcePath);

    console.log(`📂 Checking source file: ${srcFile}`);
    if (!fs.existsSync(srcFile)) {
      console.error(`❌ Source file not found: ${srcFile}`);
      return false;
    }

    console.log(`📖 Reading source file...`);
    const raw = fs.readFileSync(srcFile, 'utf-8');
    console.log(`   Raw content length: ${raw.length} characters`);

    console.log(`🔧 Parsing frontmatter...`);
    const parsed = matter(raw);
    console.log(`   Frontmatter keys: ${Object.keys(parsed.data).join(', ')}`);
    console.log(`   Content length: ${parsed.content.length} characters`);
    console.log(`   Detected language: ${parsed.data.language}`);

    // Validate essential frontmatter
    if (!parsed.data.title) {
      console.error(`❌ Missing title in frontmatter for ${srcFile}`);
      return false;
    }

    console.log(`🔄 Extracting translatable content...`);

    // Extract translatable content while preserving components
    const { translatableText, preservedElements } = extractTranslatableContent(raw);

    const openai = new OpenAI();

    // Enhanced system prompt for better content preservation
    const system = `You are a precise translator. Given a markdown document in ${parsed.data.language}:

1. Translate ONLY the human-readable text content into ${targetLang}
2. NEVER translate: import statements, component tags, code blocks, URLs, technical terms, or tag arrays
3. PRESERVE ALL markdown structure exactly (headings, lists, formatting)
4. Preserve placeholders like __PRESERVED_X__ exactly as they are
5. Generate a 3-4 sentence TLDR in ${targetLang}
6. Evaluate translation quality (0-100) and original clarity (0-100)
7. Flag any problematic segments

Output exactly one JSON object:
{
  "translated_markdown": "...full markdown with preserved placeholders...",
  "ai_tldr": "...3-4 sentence summary...",
  "ai_textscore": {
    "translationQuality": 0,
    "originalClarity": 0,
    "timestamp": "${new Date().toISOString()}",
    "notes": []
  },
  "review_issues": []
}`;

    // Check cache first
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const cachePath = path.join(CACHE_DIR, `${sourceSha}-${targetLang}.json`);

    let result: {
      translated_markdown: string;
      ai_tldr?: string;
      ai_textscore?: Record<string, unknown>;
      review_issues?: Array<Record<string, unknown>>;
    };

    if (fs.existsSync(cachePath)) {
      result = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      console.log(`🔄 Using cached translation for ${sourceSha.substring(0, 7)}-${targetLang}`);
    } else {
      console.log(`🤖 Generating translation for ${task.translationKey} (${targetLang})`);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: translatableText },
        ],
      });

      const content = response.choices?.[0]?.message?.content || '';
      console.log(`📤 AI response length: ${content.length} characters`);

      if (!content.trim()) {
        console.error('❌ Empty AI response');
        return false;
      }

      try {
        console.log(`🔍 Parsing AI response as JSON...`);
        const parsedResponse = JSON.parse(content);
        console.log(`✅ JSON parsing successful`);

        // Validate and clean the AI response
        const validation = validateAndCleanAIResponse(parsedResponse);

        if (!validation.valid) {
          console.error('❌ AI response validation failed:');
          validation.errors.forEach((error) => console.error(`   - ${error}`));
          console.error('📄 Raw AI response:', content);
          return false;
        }

        if (!validation.cleaned) {
          console.error('❌ AI response cleaning failed');
          return false;
        }

        result = validation.cleaned;
        console.log(`📋 Validated AI response fields: ${Object.keys(result).join(', ')}`);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.error('📄 Raw AI response:', content);
        return false;
      }

      // Cache the result
      fs.writeFileSync(cachePath, JSON.stringify(result), 'utf-8');
    }

    const { translated_markdown, ai_tldr, ai_textscore, review_issues } = result;

    console.log(`📊 Extracted AI response fields:`);
    console.log(`   translated_markdown: ${translated_markdown ? `${translated_markdown.length} chars` : 'undefined'}`);
    console.log(`   ai_tldr: ${ai_tldr ? `"${ai_tldr.substring(0, 50)}..."` : 'undefined'}`);
    console.log(`   ai_textscore: ${ai_textscore ? 'present' : 'undefined'}`);
    console.log(`   review_issues: ${Array.isArray(review_issues) ? `${review_issues.length} items` : 'undefined'}`);

    if (!translated_markdown) {
      console.error('❌ No translated markdown in AI response');
      return false;
    }

    // Restore preserved elements
    const restoredTranslation = restorePreservedElements(translated_markdown, preservedElements);

    // Parse the translated content
    const { data: fm, content: body } = matter(restoredTranslation);

    // Analyze content similarity for hallucination detection
    const similarityAnalysis = analyzeContentSimilarity(parsed.content, body);

    if (similarityAnalysis.isHallucination) {
      console.error(`🚨 Hallucination detected in translation for ${task.translationKey}:`);
      similarityAnalysis.issues.forEach((issue) => console.error(`   - ${issue}`));

      // Create GitHub issue for hallucination
      const title = `Translation hallucination detected: ${task.translationKey} → ${targetLang}`;
      const issueBody = `## Hallucination Analysis
      
**Translation Key**: ${task.translationKey}
**Target Language**: ${targetLang}
**Similarity Score**: ${similarityAnalysis.score}/100

**Issues Detected**:
${similarityAnalysis.issues.map((issue) => `- ${issue}`).join('\n')}

**Recommendation**: Manual review and retranslation required.`;

      try {
        execSync(`gh issue create --title "${title}" --body "${issueBody}" --label hallucination,translation-quality`, {
          stdio: 'pipe',
        });
        console.log(`📝 Created hallucination issue: ${title}`);
      } catch (err) {
        console.error('Failed to create hallucination issue:', err);
      }

      return false;
    }

    // Update frontmatter with translation metadata
    console.log(`📝 Updating frontmatter for ${task.translationKey} → ${targetLang}`);

    try {
      const historyEntry = createTranslationHistoryEntry({ targetLang, sourceSha });
      console.log(`   ✓ Created history entry: ${JSON.stringify(historyEntry, null, 2)}`);

      // Start with original frontmatter and update specific fields
      const updatedFm: Record<string, unknown> = { ...parsed.data };

      updatedFm.language = targetLang;
      updatedFm.translationHistory = [historyEntry, ...((updatedFm.translationHistory as Array<unknown>) || [])];

      // Only add ai_tldr and ai_textscore if they have valid values
      if (ai_tldr && typeof ai_tldr === 'string' && ai_tldr.trim()) {
        updatedFm.ai_tldr = ai_tldr.trim();
        console.log(`   ✓ Added ai_tldr: ${ai_tldr.substring(0, 50)}...`);
      }

      if (ai_textscore && typeof ai_textscore === 'object') {
        // Ensure all required fields are present
        const validTextScore: Record<string, unknown> = {
          translationQuality:
            typeof ai_textscore.translationQuality === 'number' ? ai_textscore.translationQuality : undefined,
          originalClarity: typeof ai_textscore.originalClarity === 'number' ? ai_textscore.originalClarity : undefined,
          timestamp: ai_textscore.timestamp || new Date().toISOString(),
          notes: Array.isArray(ai_textscore.notes) ? ai_textscore.notes : [],
        };

        // Remove undefined values from textScore
        Object.keys(validTextScore).forEach((key) => {
          if (validTextScore[key] === undefined) {
            delete validTextScore[key];
          }
        });

        if (Object.keys(validTextScore).length > 1) {
          // More than just timestamp
          updatedFm.ai_textscore = validTextScore;
          console.log(`   ✓ Added ai_textscore: ${JSON.stringify(validTextScore, null, 2)}`);
        }
      }

      // Preserve original tags (don't translate them)
      if (parsed.data.tags) {
        updatedFm.tags = parsed.data.tags;
        console.log(`   ✓ Preserved ${parsed.data.tags.length} tags`);
      }

      // Comprehensive cleanup of undefined, null, and empty values
      const cleanFrontmatter: Record<string, unknown> = {};
      Object.keys(updatedFm).forEach((key) => {
        const value = updatedFm[key];
        if (value !== undefined && value !== null) {
          // Handle nested objects
          if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            const cleanedObject: Record<string, unknown> = {};
            Object.keys(value as Record<string, unknown>).forEach((nestedKey) => {
              const nestedValue = (value as Record<string, unknown>)[nestedKey];
              if (nestedValue !== undefined && nestedValue !== null) {
                cleanedObject[nestedKey] = nestedValue;
              }
            });
            if (Object.keys(cleanedObject).length > 0) {
              cleanFrontmatter[key] = cleanedObject;
            }
          } else {
            cleanFrontmatter[key] = value;
          }
        }
      });

      // Update the frontmatter object
      Object.keys(fm).forEach((key) => delete fm[key]);
      Object.assign(fm, cleanFrontmatter);
      console.log(`   ✓ Cleaned frontmatter keys: ${Object.keys(fm).join(', ')}`);

      // Final deep clean to ensure no undefined values remain
      const finalCleanedFm = deepCleanUndefined(fm) as Record<string, unknown>;
      Object.keys(fm).forEach((key) => delete fm[key]);
      Object.assign(fm, finalCleanedFm);
      console.log(`   ✓ Final deep clean completed`);
    } catch (fmError) {
      console.error(`❌ Error updating frontmatter for ${task.translationKey}:`, fmError);
      throw fmError;
    }

    // Create target directory and write file
    console.log(`📁 Preparing target file...`);
    const parts = sourcePath.split(path.sep);
    const collection = parts[0];
    const filename = parts[parts.length - 1];
    const dir = path.join(CONTENT_BASE_PATH, collection, targetLang);
    const dst = path.join(dir, filename);

    console.log(`   Collection: ${collection}`);
    console.log(`   Target directory: ${dir}`);
    console.log(`   Target file: ${dst}`);

    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✓ Directory ensured`);

    console.log(`📝 Generating final content with matter.stringify...`);
    console.log(`   Frontmatter keys to serialize: ${Object.keys(fm).join(', ')}`);

    // Debug: Check for problematic values before serialization
    const problematicKeys: string[] = [];
    Object.keys(fm).forEach((key) => {
      const value = fm[key];
      if (value === undefined) {
        problematicKeys.push(`${key}=undefined`);
      } else if (value === null) {
        problematicKeys.push(`${key}=null`);
      } else if (typeof value === 'object' && value !== null) {
        Object.keys(value as Record<string, unknown>).forEach((nestedKey) => {
          const nestedValue = (value as Record<string, unknown>)[nestedKey];
          if (nestedValue === undefined) {
            problematicKeys.push(`${key}.${nestedKey}=undefined`);
          }
        });
      }
    });

    if (problematicKeys.length > 0) {
      console.warn(`⚠️ Found potentially problematic values: ${problematicKeys.join(', ')}`);
    }

    try {
      console.log(`📝 Pre-validation: Testing YAML serialization...`);

      // Pre-validate by attempting to serialize a minimal version
      const testFm = { title: 'test', language: targetLang };
      matter.stringify('test content', testFm);
      console.log(`   ✓ Basic YAML serialization works`);

      // Validate each field that we're going to add
      const fieldsToTest: Array<[string, unknown]> = [
        ['language', targetLang],
        ['translationHistory', []],
      ];

      if (ai_tldr && typeof ai_tldr === 'string' && ai_tldr.trim()) {
        fieldsToTest.push(['ai_tldr', ai_tldr.trim()]);
      }

      if (ai_textscore && typeof ai_textscore === 'object') {
        fieldsToTest.push(['ai_textscore', ai_textscore]);
      }

      // Test each field individually
      for (const [fieldName, fieldValue] of fieldsToTest) {
        try {
          const testObj: Record<string, unknown> = {};
          testObj[fieldName] = fieldValue;
          matter.stringify('test', testObj);
          console.log(`   ✓ Field "${fieldName}" validates OK`);
        } catch (fieldError) {
          console.error(`   ❌ Field "${fieldName}" causes YAML error:`, fieldError);
          console.error(`   Field value:`, JSON.stringify(fieldValue, null, 2));
          throw new Error(`Invalid field: ${fieldName}`);
        }
      }

      const finalContent = matter.stringify(body, fm);
      console.log(`   ✓ Content stringified successfully (${finalContent.length} characters)`);

      fs.writeFileSync(dst, finalContent, 'utf-8');
      console.log(`✅ Generated translation: ${dst}`);
    } catch (stringifyError) {
      console.error(`❌ Failed to stringify content for ${task.translationKey}:`, stringifyError);
      console.error(`❌ Frontmatter keys: ${Object.keys(fm).join(', ')}`);

      // Debug each frontmatter field
      for (const [key, value] of Object.entries(fm)) {
        console.error(`❌ Field "${key}":`, typeof value, JSON.stringify(value, null, 2));
      }

      throw stringifyError;
    }

    // Commit the translation immediately
    commitTranslation(task, dst);

    // Check for quality issues and create GitHub issues if needed
    const aiTextscore = ai_textscore as Record<string, unknown> | undefined;
    const quality = aiTextscore?.translationQuality as number | undefined;
    const issuesList = Array.isArray(review_issues) ? review_issues : [];
    const threshold = Number(process.env.TRANSLATION_QUALITY_THRESHOLD || 70);

    if ((quality !== undefined && typeof quality === 'number' && quality < threshold) || issuesList.length > 0) {
      const title = `Translation quality issues: ${task.translationKey} → ${targetLang}`;
      let issueBody = `## Quality Issues for ${task.translationKey} (${targetLang})\n\n`;
      if (quality !== undefined && typeof quality === 'number')
        issueBody += `**Translation quality score**: ${quality}/100\n\n`;
      for (const rev of issuesList) {
        const reviewItem = rev as Record<string, unknown>;
        const section = (reviewItem.section as string) || 'Unknown';
        const issue = (reviewItem.issue as string) || 'Unknown issue';
        const suggestion = (reviewItem.suggestion as string) || 'No suggestion';
        issueBody += `- **${section}**: ${issue}\n  - Suggestion: ${suggestion}\n`;
      }

      try {
        execSync(`gh issue create --title "${title}" --body "${issueBody}" --label translation-quality`, {
          stdio: 'pipe',
        });
        console.log(`� Created quality issue: ${title}`);
      } catch (err) {
        console.error('Failed to create quality issue:', err);
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to translate task ${task.translationKey} → ${task.targetLang}:`, error);

    // Add detailed error context
    console.error(`📊 Error Context:`);
    console.error(`   Task: ${JSON.stringify(task, null, 2)}`);
    console.error(`   Source file exists: ${fs.existsSync(path.join(CONTENT_BASE_PATH, task.sourcePath))}`);
    console.error(`   Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);

    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack: ${error.stack}`);
    }

    return false;
  }
}

/**
 * Main translation function with progressive processing
 */
async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: generate_translations.ts <tasks.json>');
    process.exit(1);
  }

  const tasks: TranslationTask[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log(`🚀 Starting translation of ${tasks.length} tasks`);
  console.log(`📋 Tasks breakdown:`);

  // Log task summary
  const tasksByLang = tasks.reduce(
    (acc, task) => {
      acc[task.targetLang] = (acc[task.targetLang] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(tasksByLang).forEach(([lang, count]) => {
    console.log(`   ${lang.toUpperCase()}: ${count} tasks`);
  });

  const missingCount = tasks.filter((t) => t.reason === 'missing').length;
  const staleCount = tasks.filter((t) => t.reason === 'stale').length;
  console.log(`   Missing: ${missingCount}, Stale: ${staleCount}`);
  console.log(``);

  // Load or initialize progress
  const progress = loadProgress();
  progress.totalTasks = tasks.length;
  saveProgress(progress);

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskNumber = i + 1;

    console.log(`\n[${taskNumber}/${tasks.length}] Processing: ${task.translationKey} → ${task.targetLang}`);

    // Check if already processed
    if (isTaskAlreadyProcessed(task, progress)) {
      console.log(`⏭️ Skipping already processed task`);
      skippedCount++;
      continue;
    }

    // Process the translation
    const success = await translateTask(task);

    if (success) {
      markTaskCompleted(task, progress);
      successCount++;
      console.log(`✅ Task ${taskNumber}/${tasks.length} completed successfully`);
    } else {
      failedCount++;
      console.log(`❌ Task ${taskNumber}/${tasks.length} failed`);
    }

    // Brief pause between translations to avoid rate limiting
    if (i < tasks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Final summary
  console.log(`\n📊 Translation Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⏭️ Skipped: ${skippedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📁 Total: ${tasks.length}`);

  // Clean up progress file if all tasks completed
  if (successCount + skippedCount === tasks.length) {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
      console.log(`🧹 Cleaned up progress file`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Translation pipeline failed:', error);
    process.exit(1);
  });
}

export { translateTask };
