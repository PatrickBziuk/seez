#!/usr/bin/env tsx

/**
 * Registry-Based Translation Generation Script
 * Features:
 * - Uses canonical ID system for translation tracking
 * - Progressive state saving with registry updates
 * - Token usage tracking integrated with canonical IDs
 * - Content integrity checks
 * - Resume capability for interrupted jobs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import OpenAI from 'openai';
import { createHash } from 'crypto';

// Import the registry-based task interface
type RegistryTranslationTask = {
  canonicalId: string;
  sourcePath: string;
  targetLang: string;
  reason: 'missing' | 'stale';
  sourceSha: string;
  sourceLanguage: string;
  sourceContentHash: string;
  existingTranslationHash?: string;
  translationStatus: 'missing' | 'stale';
  outputPath: string;
  languagePair: string;
  priority: 'high' | 'normal';
};

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
          status: 'current' | 'stale' | 'missing';
          lastTranslated: string;
          translationHash: string;
        }
      >;
    };
  };
}

interface TokenUsage {
  operation: string;
  canonicalId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  co2Impact: number;
  timestamp: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface TokenUsageMetadata {
  translation?: TokenUsage;
  tldr?: TokenUsage;
  total: {
    tokens: number;
    cost: number;
    co2: number;
  };
}

/**
 * Load tasks from stdin (JSON format)
 */
function loadTranslationTasks(): RegistryTranslationTask[] {
  const input = fs.readFileSync(process.stdin.fd, 'utf-8').trim();

  if (!input || input === '[]') {
    console.log('No translation tasks to process');
    return [];
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    console.error('Failed to parse translation tasks:', error);
    process.exit(1);
  }
}

/**
 * Load content registry
 */
function loadRegistry(): ContentRegistry {
  const registryPath = 'data/content-registry.json';
  const content = fs.readFileSync(registryPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save updated registry
 */
function saveRegistry(registry: ContentRegistry): void {
  registry.lastUpdated = new Date().toISOString();
  const registryPath = 'data/content-registry.json';
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

/**
 * Load token usage data
 */
function loadTokenUsage(): TokenUsage[] {
  const tokenPath = 'data/token-usage.json';

  if (!fs.existsSync(tokenPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(tokenPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Save token usage data
 */
function saveTokenUsage(usage: TokenUsage[]): void {
  const tokenPath = 'data/token-usage.json';
  fs.writeFileSync(tokenPath, JSON.stringify(usage, null, 2));
}

/**
 * Calculate token usage cost and CO2 impact
 */
function calculateTokenMetrics(
  model: string,
  inputTokens: number,
  outputTokens: number
): {
  cost: number;
  co2Impact: number;
} {
  // OpenAI pricing (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.15 / 1000000, output: 0.6 / 1000000 }, // $0.15/$0.60 per 1M tokens
    'gpt-4o': { input: 2.5 / 1000000, output: 10 / 1000000 }, // $2.50/$10.00 per 1M tokens
    'gpt-4': { input: 30 / 1000000, output: 60 / 1000000 }, // $30/$60 per 1M tokens
  };

  const rates = pricing[model] || pricing['gpt-4o-mini'];
  const cost = inputTokens * rates.input + outputTokens * rates.output;

  // Estimated CO2 impact: 0.1g CO2 per 1000 tokens (rough estimate)
  const co2Impact = ((inputTokens + outputTokens) / 1000) * 0.1;

  return { cost, co2Impact };
}

/**
 * Track token usage
 */
function trackTokenUsage(
  operation: string,
  canonicalId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  sourceLanguage: string,
  targetLanguage: string
): TokenUsage {
  const totalTokens = inputTokens + outputTokens;
  const { cost, co2Impact } = calculateTokenMetrics(model, inputTokens, outputTokens);

  const usage: TokenUsage = {
    operation,
    canonicalId,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
    co2Impact,
    timestamp: new Date().toISOString(),
    sourceLanguage,
    targetLanguage,
  };

  // Load existing usage data
  const allUsage = loadTokenUsage();
  allUsage.push(usage);
  saveTokenUsage(allUsage);

  console.log(`💰 Token usage: ${totalTokens} tokens ($${cost.toFixed(4)}, ${co2Impact.toFixed(4)}g CO2)`);

  return usage;
}

/**
 * Initialize OpenAI client
 */
function initializeOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  return new OpenAI({ apiKey });
}

/**
 * Extract content for translation (preserve MDX components)
 */
function extractTranslatableContent(content: string): string {
  // For now, just return the content as-is
  // Future enhancement: implement code block preservation
  return content.trim();
}

/**
 * Generate translation using OpenAI
 */
async function generateTranslation(
  openai: OpenAI,
  task: RegistryTranslationTask,
  content: string,
  title: string
): Promise<{
  translatedContent: string;
  translatedTitle: string;
  tokenUsageMetadata: TokenUsageMetadata;
}> {
  console.log(`🔄 Translating ${task.canonicalId}: ${task.sourceLanguage} → ${task.targetLang}`);

  const extractedContent = extractTranslatableContent(content);

  const prompt = `You are a professional translator specializing in technical content and software documentation.

Task: Translate the following content from ${task.sourceLanguage} to ${task.targetLang}.

Important guidelines:
1. Preserve all Markdown formatting exactly
2. Do NOT translate technical terms, code, URLs, or component names
3. Maintain the same tone and style
4. Keep all punctuation and line breaks
5. Preserve any special syntax like frontmatter or MDX components

Source Title: ${title}

Source Content:
${extractedContent}

Please provide ONLY the translated content without any explanation or additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const translatedContent = response.choices[0]?.message?.content?.trim() || '';

    if (!translatedContent) {
      throw new Error('Empty translation response');
    }

    // Track token usage for translation
    const usage = response.usage;
    const translationUsage = trackTokenUsage(
      'translation',
      task.canonicalId,
      'gpt-4o-mini',
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0,
      task.sourceLanguage,
      task.targetLang
    );

    // Generate translated title
    const titleResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Translate this title from ${task.sourceLanguage} to ${task.targetLang}: "${title}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const translatedTitle = titleResponse.choices[0]?.message?.content?.trim() || title;

    // Track token usage for title translation
    const titleUsage = titleResponse.usage;
    const titleTokenUsage = trackTokenUsage(
      'title-translation',
      task.canonicalId,
      'gpt-4o-mini',
      titleUsage?.prompt_tokens || 0,
      titleUsage?.completion_tokens || 0,
      task.sourceLanguage,
      task.targetLang
    );

    const tokenUsageMetadata: TokenUsageMetadata = {
      translation: translationUsage,
      total: {
        tokens: translationUsage.totalTokens + titleTokenUsage.totalTokens,
        cost: translationUsage.cost + titleTokenUsage.cost,
        co2: translationUsage.co2Impact + titleTokenUsage.co2Impact,
      },
    };

    return { translatedContent, translatedTitle, tokenUsageMetadata };
  } catch (error) {
    console.error(`❌ Translation failed for ${task.canonicalId}:`, error);
    throw error;
  }
}

/**
 * Process a single translation task
 */
async function processTranslationTask(
  openai: OpenAI,
  task: RegistryTranslationTask,
  registry: ContentRegistry
): Promise<void> {
  console.log(`\n📝 Processing task: ${task.canonicalId}`);
  console.log(`   Source: ${task.sourcePath}`);
  console.log(`   Target: ${task.outputPath}`);
  console.log(`   Language: ${task.sourceLanguage} → ${task.targetLang}`);

  // Read source file
  const sourceContent = fs.readFileSync(task.sourcePath, 'utf-8');
  const { data: sourceFrontmatter, content: sourceMarkdown } = matter(sourceContent);

  try {
    // Generate translation
    const { translatedContent, translatedTitle, tokenUsageMetadata } = await generateTranslation(
      openai,
      task,
      sourceMarkdown,
      sourceFrontmatter.title
    );

    // Prepare target frontmatter
    const targetFrontmatter = {
      ...sourceFrontmatter,
      title: translatedTitle,
      language: task.targetLang,
      canonicalId: task.canonicalId,
      translationOf: task.canonicalId,
      sourceLanguage: task.sourceLanguage,
      ai_metadata: {
        ...(sourceFrontmatter.ai_metadata || {}),
        tokenUsage: tokenUsageMetadata,
      },
      status: {
        ...sourceFrontmatter.status,
        translation: 'AI',
      },
    };

    // Create target content
    const targetContent = matter.stringify(translatedContent, targetFrontmatter);

    // Ensure target directory exists
    const targetDir = path.dirname(task.outputPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write target file
    fs.writeFileSync(task.outputPath, targetContent);

    // Calculate content hash
    const translationHash = createHash('sha256').update(translatedContent).digest('hex');

    // Update registry
    const registryEntry = registry.entries[task.canonicalId];
    if (registryEntry) {
      registryEntry.translations[task.targetLang] = {
        path: task.outputPath,
        status: 'current',
        lastTranslated: new Date().toISOString(),
        translationHash,
      };
    }

    console.log(`✅ Translation completed: ${task.outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to process task ${task.canonicalId}:`, error);
    throw error;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting registry-based translation generation...');

  // Load translation tasks
  const tasks = loadTranslationTasks();
  console.log(`📋 Loaded ${tasks.length} translation tasks`);

  if (tasks.length === 0) {
    console.log('✅ No translation tasks to process');
    return;
  }

  // Initialize OpenAI
  const openai = initializeOpenAI();

  // Load registry
  const registry = loadRegistry();

  let processed = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      await processTranslationTask(openai, task, registry);
      processed++;

      // Save registry after each successful translation
      saveRegistry(registry);

      // Commit progress
      try {
        execSync(`git add "${task.outputPath}" data/content-registry.json data/token-usage.json`, { stdio: 'pipe' });
        execSync(`git commit -m "feat: translate ${task.canonicalId} (${task.sourceLanguage} → ${task.targetLang})"`, {
          stdio: 'pipe',
        });
        console.log(`📄 Committed translation progress`);
      } catch (gitError) {
        console.warn(`⚠️  Git commit failed (continuing anyway):`, gitError);
      }
    } catch (error) {
      console.error(`❌ Failed to process task:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Translation Summary:`);
  console.log(`   Processed: ${processed}/${tasks.length} tasks`);
  console.log(`   Failed: ${failed} tasks`);

  if (failed > 0) {
    process.exit(1);
  }

  console.log('✅ All translations completed successfully');
}

// Execute
main().catch((error) => {
  console.error('❌ Translation generation failed:', error);
  process.exit(1);
});
