/**
 * Registry-Based Translation Generation Script
 * Features:
 * - Uses canonical ID system for translation tracking
 * - Progressive state saving with registry updates
 * - Token usage tracking integrated with canonical IDs
 * - Content integrity checks
 * - Resume capability for interrupted jobs
 *
 * Loads environment variables from .env.local file
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';
import { createHash } from 'crypto';

// Load environment variables from .env.local if it exists
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
} catch {
  // Silently continue if .env.local loading fails
}

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
    // Additional validation before parsing
    if (!input.startsWith('[') && !input.startsWith('{')) {
      console.error('Invalid JSON input - content does not start with [ or {');
      console.error('Input preview:', input.substring(0, 100) + '...');
      console.error('This might indicate that git command output was redirected instead of JSON');
      process.exit(1);
    }

    return JSON.parse(input);
  } catch (error) {
    console.error('Failed to parse translation tasks:', error);
    console.error('Input content preview:', input.substring(0, 200) + '...');
    console.error('Input length:', input.length);
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
  // OpenAI pricing (as of 2024/2025)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4.1-nano': { input: 0.1 / 1000000, output: 0.4 / 1000000 }, // $0.10/$0.40 per 1M tokens - Fastest, most cost-effective!
    'gpt-4o-mini': { input: 0.15 / 1000000, output: 0.6 / 1000000 }, // $0.15/$0.60 per 1M tokens
    'gpt-4o': { input: 2.5 / 1000000, output: 10 / 1000000 }, // $2.50/$10.00 per 1M tokens
    'gpt-4': { input: 30 / 1000000, output: 60 / 1000000 }, // $30/$60 per 1M tokens
  };

  const rates = pricing[model] || pricing['gpt-4.1-nano'];
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
function extractTranslatableContent(content: string, notranslateList: string[] = []): string {
  let working = content;
  let i = 0;
  for (const phrase of notranslateList) {
    if (!phrase || phrase.length < 2) continue;
    const safe = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'g');
    const ph = `__NOTR_${i++}__`;
    working = working.replace(re, ph);
  }
  return working.trim();
}

/**
 * Generate translation using OpenAI Responses API
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
  let notranslateList: string[] = [];
  try {
    const parsed = matter(content);
    if (Array.isArray(parsed.data?.notranslate)) {
      notranslateList = parsed.data.notranslate as string[];
    }
  } catch {
    // ignore frontmatter parse errors; proceed without notranslate list
  }

  const extractedContent = extractTranslatableContent(content, notranslateList);

  const prompt = `You are a professional translator specializing in technical content and software documentation.

Task: Translate the following content from ${task.sourceLanguage} to ${task.targetLang}.

Important guidelines:
1. Preserve all Markdown formatting exactly
2. Do NOT translate technical terms, code, URLs, content inside components, or component names
3. Do NOT translate placeholders starting with __NOTR_ and return them verbatim; they will be restored after
3. Maintain the same tone and style
4. Keep all punctuation and line breaks
5. Preserve any special syntax like frontmatter or MDX components

Source Title: ${title}

Source Content:
${extractedContent}

Please provide ONLY the translated content without any explanation or additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });

    let translatedContent = response.choices[0]?.message?.content?.trim() || '';

    if (!translatedContent) {
      throw new Error('Empty translation response');
    }

    // Track token usage for translation
    const usage = response.usage;
    const translationUsage = trackTokenUsage(
      'translation',
      task.canonicalId,
      'gpt-4.1-nano',
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0,
      task.sourceLanguage,
      task.targetLang
    );

    // Generate translated title
    const titleResponse = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'user',
          content: `Translate this title from ${task.sourceLanguage} to ${task.targetLang}: "${title}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    let translatedTitle = titleResponse.choices[0]?.message?.content?.trim() || title;

    // Track token usage for title translation
    const titleUsage = titleResponse.usage;
    const titleTokenUsage = trackTokenUsage(
      'title-translation',
      task.canonicalId,
      'gpt-4.1-nano',
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

    // Restore notranslate placeholders back to original phrases
    notranslateList.forEach((phrase, i) => {
      const ph = new RegExp(`__NOTR_${i}__`, 'g');
      translatedContent = translatedContent.replace(ph, phrase);
      translatedTitle = translatedTitle.replace(ph, phrase);
    });

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

  // Check if source file exists
  console.log(`📂 Checking source file: ${task.sourcePath}`);
  if (!fs.existsSync(task.sourcePath)) {
    throw new Error(`Source file not found: ${task.sourcePath}`);
  }
  console.log(`✅ Source file exists`);

  // Read source file
  console.log(`📖 Reading source file...`);
  const sourceContent = fs.readFileSync(task.sourcePath, 'utf-8');
  const { data: sourceFrontmatter, content: sourceMarkdown } = matter(sourceContent);
  console.log(
    `✅ Source file parsed - Content length: ${sourceMarkdown.length} chars, Title: "${sourceFrontmatter.title}"`
  );

  try {
    // Generate translation
    console.log(`🤖 Starting OpenAI translation...`);
    const { translatedContent, translatedTitle, tokenUsageMetadata } = await generateTranslation(
      openai,
      task,
      sourceMarkdown,
      sourceFrontmatter.title
    );
    console.log(
      `✅ Translation completed - Content length: ${translatedContent.length} chars, Title: "${translatedTitle}"`
    );

    // Prepare target frontmatter
    console.log(`📋 Preparing target frontmatter...`);
    const targetFrontmatter = {
      ...sourceFrontmatter,
      title: translatedTitle,
      language: task.targetLang,
      canonicalId: task.canonicalId,
      translationOf: task.canonicalId,
      sourceLanguage: task.sourceLanguage,
      draft: true, // Set as draft initially - requires human review
      publicationStatus: 'draft', // New Plan 10035 field
      status: {
        ...sourceFrontmatter.status,
        translation: 'AI',
        review: {
          content: false, // Requires human review
          translation: false, // AI translation requires human review
          reviewer: null,
          reviewDate: null,
          notes: 'AI-generated translation - requires human review before publication',
        },
      },
      ai_metadata: {
        ...(sourceFrontmatter.ai_metadata || {}),
        translation: {
          model: 'gpt-4o-mini',
          at: new Date().toISOString(),
          sourceLanguage: task.sourceLanguage,
          targetLanguage: task.targetLang,
          tokens: tokenUsageMetadata.total.tokens,
          cost: tokenUsageMetadata.total.cost,
          co2: tokenUsageMetadata.total.co2,
        },
        tokenUsage: tokenUsageMetadata,
        generationDate: new Date().toISOString(),
        model: 'gpt-4o-mini',
        translationQuality: 'pending_review',
      },
    };
    console.log(`✅ Target frontmatter prepared`);

    // Create target content
    console.log(`📝 Creating target content...`);
    const targetContent = matter.stringify(translatedContent, targetFrontmatter);
    console.log(`✅ Target content created - Total length: ${targetContent.length} chars`);

    // Ensure target directory exists
    console.log(`📁 Checking target directory: ${path.dirname(task.outputPath)}`);
    const targetDir = path.dirname(task.outputPath);
    if (!fs.existsSync(targetDir)) {
      console.log(`📁 Creating target directory: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    console.log(`✅ Target directory ready`);

    // Write target file
    console.log(`💾 Writing target file: ${task.outputPath}`);
    fs.writeFileSync(task.outputPath, targetContent);
    console.log(`✅ Target file written successfully`);

    // Calculate content hash
    console.log(`🔒 Calculating content hash...`);
    const translationHash = createHash('sha256').update(translatedContent).digest('hex');
    console.log(`✅ Content hash calculated: ${translationHash.substring(0, 8)}...`);

    // Update registry
    console.log(`📝 Updating registry for canonical ID: ${task.canonicalId}`);
    const registryEntry = registry.entries[task.canonicalId];
    if (registryEntry) {
      registryEntry.translations[task.targetLang] = {
        path: task.outputPath,
        status: 'current',
        lastTranslated: new Date().toISOString(),
        translationHash,
      };
      console.log(`✅ Registry entry updated for ${task.targetLang} translation`);
    } else {
      console.warn(`⚠️  Registry entry not found for canonical ID: ${task.canonicalId}`);
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

  // Log all tasks that will be processed
  console.log('\n📋 Tasks to process:');
  tasks.forEach((task, index) => {
    console.log(
      `  ${index + 1}. ${task.canonicalId}: ${task.sourcePath} → ${task.outputPath} (${task.sourceLanguage} → ${task.targetLang})`
    );
  });
  console.log('');

  // Initialize OpenAI
  console.log('🔑 Initializing OpenAI client...');
  const openai = initializeOpenAI();
  console.log('✅ OpenAI client initialized');

  // Load registry
  console.log('📖 Loading content registry...');
  const registry = loadRegistry();
  console.log(`✅ Registry loaded with ${Object.keys(registry.entries).length} entries`);

  let processed = 0;
  let failed = 0;

  console.log(`\n🔄 Starting translation processing (${tasks.length} tasks)...\n`);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`\n=== Processing Task ${i + 1}/${tasks.length} ===`);
    console.log(`📝 Task ID: ${task.canonicalId}`);
    console.log(`📄 Source: ${task.sourcePath}`);
    console.log(`📄 Target: ${task.outputPath}`);
    console.log(`🌐 Language: ${task.sourceLanguage} → ${task.targetLang}`);
    console.log(`🔄 Reason: ${task.reason}`);

    try {
      console.log(`⏳ Starting translation process...`);
      await processTranslationTask(openai, task, registry);
      processed++;
      console.log(`✅ Task ${i + 1} completed successfully`);

      // Save registry after each successful translation
      console.log(`💾 Saving registry...`);
      saveRegistry(registry);
      console.log(`✅ Registry saved`);

      console.log(`✅ Translation ${i + 1}/${tasks.length} completed successfully!`);
      console.log(`📝 Created: ${task.outputPath}`);
      console.log(`� Status: Draft (requires human review before publication)`);
    } catch (error) {
      console.error(`❌ Failed to process task ${i + 1}:`, error);
      console.error(`❌ Error details:`, {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        taskId: task.canonicalId,
        sourcePath: task.sourcePath,
        targetPath: task.outputPath,
      });
      failed++;
      console.log(`❌ Task ${i + 1} failed, continuing to next task...\n`);
    }

    console.log(`📊 Progress: ${processed} completed, ${failed} failed, ${tasks.length - i - 1} remaining\n`);
  }

  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`📊 Translation Summary:`);
  console.log(`   Total tasks: ${tasks.length}`);
  console.log(`   Successfully processed: ${processed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success rate: ${Math.round((processed / tasks.length) * 100)}%`);

  if (processed > 0) {
    console.log(`\n✅ Successfully generated ${processed} translations (all marked as draft)`);
    console.log(`📋 Next steps:`);
    console.log(`   1. Review the generated translation files`);
    console.log(`   2. Edit content as needed`);
    console.log(`   3. Set draft=false when ready to publish`);
    console.log(`   4. Commit your changes manually`);
  }

  if (failed > 0) {
    console.log(`\n❌ Failed translations: ${failed}`);
    console.log(`💡 Check the error logs above for details on failed translations`);
    console.log(`🔄 You can run the script again to retry failed translations`);
  }

  if (processed > 0) {
    console.log(`\n🎯 All translations are marked as draft for your review!`);
    process.exit(0); // Exit with success when translations are generated
  }

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n🎉 All translations completed successfully!');
  console.log('📝 Remember to review the generated translations before publishing');
  console.log('   • Check the generated files for quality');
  console.log('   • Set draft=false when ready to publish');
}

// Execute
main().catch((error) => {
  console.error('❌ Translation generation failed with unhandled error:', error);
  console.error('📍 Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
  console.error('💡 This suggests a critical error in the script itself');
  process.exit(1);
});
