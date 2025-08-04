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
import {
  type TranslationTask,
  createTranslationHistoryEntry
} from '../src/utils/translation';

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
  /<[A-Z][a-zA-Z0-9]*\s*[^>]*>/g,  // Component opening tags
  /<\/[A-Z][a-zA-Z0-9]*>/g,        // Component closing tags
  /import\s+.*\s+from\s+['"][^'"]+['"];?/g, // Import statements
  /```[\s\S]*?```/g,                // Code blocks
  /`[^`]+`/g,                       // Inline code
  /\[([^\]]+)\]\(([^)]+)\)/g        // Links (preserve URLs)
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
      completedTasks: 0
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
      completedTasks: 0
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
    preservedElements
  };
}

/**
 * Restore preserved elements back into translated content
 */
function restorePreservedElements(
  translatedContent: string,
  preservedElements: Map<string, string>
): string {
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
    isHallucination
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
  try {
    const { sourcePath, targetLang, sourceSha } = task;
    const srcFile = path.join(CONTENT_BASE_PATH, sourcePath);
    
    if (!fs.existsSync(srcFile)) {
      console.error(`❌ Source file not found: ${srcFile}`);
      return false;
    }

    const raw = fs.readFileSync(srcFile, 'utf-8');
    const parsed = matter(raw);
    
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
      ai_tldr: string;
      ai_textscore: {
        translationQuality: number;
        originalClarity: number;
        timestamp: string;
        notes?: string[];
      };
      review_issues: Array<{
        section: string;
        issue: string;
        suggestion: string;
      }>;
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
          { role: 'user', content: translatableText }
        ]
      });

      const content = response.choices?.[0]?.message?.content || '';
      
      try {
        result = JSON.parse(content);
      } catch {
        console.error('❌ Failed to parse AI response as JSON:', content);
        return false;
      }
      
      // Cache the result
      fs.writeFileSync(cachePath, JSON.stringify(result), 'utf-8');
    }

    const { translated_markdown, ai_tldr, ai_textscore, review_issues } = result;
    
    // Restore preserved elements
    const restoredTranslation = restorePreservedElements(translated_markdown, preservedElements);
    
    // Parse the translated content
    const { data: fm, content: body } = matter(restoredTranslation);
    
    // Analyze content similarity for hallucination detection
    const similarityAnalysis = analyzeContentSimilarity(parsed.content, body);
    
    if (similarityAnalysis.isHallucination) {
      console.error(`🚨 Hallucination detected in translation for ${task.translationKey}:`);
      similarityAnalysis.issues.forEach(issue => console.error(`   - ${issue}`));
      
      // Create GitHub issue for hallucination
      const title = `Translation hallucination detected: ${task.translationKey} → ${targetLang}`;
      const issueBody = `## Hallucination Analysis
      
**Translation Key**: ${task.translationKey}
**Target Language**: ${targetLang}
**Similarity Score**: ${similarityAnalysis.score}/100

**Issues Detected**:
${similarityAnalysis.issues.map(issue => `- ${issue}`).join('\n')}

**Recommendation**: Manual review and retranslation required.`;
      
      try {
        execSync(`gh issue create --title "${title}" --body "${issueBody}" --label hallucination,translation-quality`, { stdio: 'pipe' });
        console.log(`📝 Created hallucination issue: ${title}`);
      } catch (err) {
        console.error('Failed to create hallucination issue:', err);
      }
      
      return false;
    }

    // Update frontmatter with translation metadata
    const historyEntry = createTranslationHistoryEntry({ targetLang, sourceSha });
    fm.language = targetLang;
    fm.translationHistory = [historyEntry, ...(fm.translationHistory || [])];
    fm.ai_tldr = ai_tldr;
    fm.ai_textscore = ai_textscore;
    
    // Preserve original tags (don't translate them)
    if (parsed.data.tags) {
      fm.tags = parsed.data.tags;
    }
    
    // Remove undefined values to prevent YAML serialization errors
    Object.keys(fm).forEach(key => fm[key] === undefined && delete fm[key]);
    
    // Create target directory and write file
    const parts = sourcePath.split(path.sep);
    const collection = parts[0];
    const filename = parts[parts.length - 1];
    const dir = path.join(CONTENT_BASE_PATH, collection, targetLang);
    fs.mkdirSync(dir, { recursive: true });
    const dst = path.join(dir, filename);
    
    fs.writeFileSync(dst, matter.stringify(body, fm), 'utf-8');
    console.log(`✅ Generated translation: ${dst}`);
    
    // Commit the translation immediately
    commitTranslation(task, dst);
    
    // Check for quality issues and create GitHub issues if needed
    const quality = ai_textscore?.translationQuality;
    const issuesList = Array.isArray(review_issues) ? review_issues : [];
    const threshold = Number(process.env.TRANSLATION_QUALITY_THRESHOLD || 70);
    
    if ((quality !== undefined && quality < threshold) || issuesList.length > 0) {
      const title = `Translation quality issues: ${task.translationKey} → ${targetLang}`;
      let issueBody = `## Quality Issues for ${task.translationKey} (${targetLang})\n\n`;
      if (quality !== undefined) issueBody += `**Translation quality score**: ${quality}/100\n\n`;
      for (const rev of issuesList) {
        issueBody += `- **${rev.section}**: ${rev.issue}\n  - Suggestion: ${rev.suggestion}\n`;
      }
      
      try {
        execSync(`gh issue create --title "${title}" --body "${issueBody}" --label translation-quality`, { stdio: 'pipe' });
        console.log(`� Created quality issue: ${title}`);
      } catch (err) {
        console.error('Failed to create quality issue:', err);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to translate task ${task.translationKey} → ${task.targetLang}:`, error);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
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