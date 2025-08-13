#!/usr/bin/env node

/**
 * TLDR Generation Pipeline Script
 *
 * Features:
 * - Uses registry-based canonical ID system for content tracking
 * - Generates AI-powered TLDR for content files
 * - Token usage tracking and cost calculation
 * - Content integrity checks with SHA validation
 * - Supports both English and German content
 * - Progressive state saving with resume capability
 *
 * Usage:
 *   pnpm run tldr:generate
 *   pnpm run tldr:generate --force  # Regenerate existing TLDRs
 *   pnpm run tldr:generate --lang=en # Only English content
 *   pnpm run tldr:generate --lang=de # Only German content
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';

// Load environment variables from .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  }
}

// Types
interface ContentRegistry {
  entries: ContentEntry[];
  metadata: {
    generatedAt: string;
    totalEntries: number;
    version: string;
  };
}

interface ContentEntry {
  canonicalId: string;
  title: string;
  language: 'en' | 'de';
  filePath: string;
  contentSha: string;
  isOriginal: boolean;
  originalCanonicalId?: string;
  translations?: {
    en?: string;
    de?: string;
  };
  lastModified: string;
  category: string;
}

interface TLDRTask {
  canonicalId: string;
  contentPath: string;
  title: string;
  language: 'en' | 'de';
  contentSha: string;
  category: string;
}

interface TokenUsageEntry {
  id: string;
  timestamp: string;
  operation: string;
  canonicalId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  co2Impact: number;
  language?: string;
  category?: string;
}

interface TLDRMetadata {
  content: string;
  wordCount: number;
  generatedAt: string;
  model: string;
  language: 'en' | 'de';
  canonicalId: string;
  sourceContentSha: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
    co2Impact: number;
  };
}

// Configuration
const CONTENT_REGISTRY_PATH = 'data/content-registry.json';
const TOKEN_USAGE_PATH = 'data/token-usage.json';
const TLDR_DATA_DIR = 'data/tldr';

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in environment variables or .env.local file');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

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

  // Rough CO2 estimation: ~0.5g CO2 per 1000 tokens (conservative estimate)
  const co2Impact = ((inputTokens + outputTokens) / 1000) * 0.5;

  return { cost, co2Impact };
}

/**
 * Track token usage in the global ledger
 */
function trackTokenUsage(
  operation: string,
  canonicalId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  language?: string,
  category?: string
): TokenUsageEntry {
  const { cost, co2Impact } = calculateTokenMetrics(model, inputTokens, outputTokens);

  const entry: TokenUsageEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    operation,
    canonicalId,
    model,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cost,
    co2Impact,
    language,
    category,
  };

  // Load existing token usage data
  let tokenData: { entries: TokenUsageEntry[] } = { entries: [] };
  if (fs.existsSync(TOKEN_USAGE_PATH)) {
    try {
      tokenData = JSON.parse(fs.readFileSync(TOKEN_USAGE_PATH, 'utf8'));
    } catch (error) {
      console.warn(`⚠️ Warning: Could not parse existing token usage data: ${error}`);
    }
  }

  // Add new entry
  tokenData.entries.push(entry);

  // Save updated data
  fs.writeFileSync(TOKEN_USAGE_PATH, JSON.stringify(tokenData, null, 2));

  return entry;
}

/**
 * Load content registry
 */
function loadContentRegistry(): ContentRegistry {
  if (!fs.existsSync(CONTENT_REGISTRY_PATH)) {
    console.error(`❌ Content registry not found at ${CONTENT_REGISTRY_PATH}`);
    console.error('💡 Run "pnpm run content:sync" to generate the registry first');
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(CONTENT_REGISTRY_PATH, 'utf8'));
  } catch (error) {
    console.error(`❌ Failed to parse content registry: ${error}`);
    process.exit(1);
  }
}

/**
 * Load existing TLDR data
 */
function loadExistingTLDRData(): Map<string, TLDRMetadata> {
  const tldrs = new Map<string, TLDRMetadata>();

  if (!fs.existsSync(TLDR_DATA_DIR)) {
    fs.mkdirSync(TLDR_DATA_DIR, { recursive: true });
    return tldrs;
  }

  const files = fs.readdirSync(TLDR_DATA_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const filePath = path.join(TLDR_DATA_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const canonicalId = file.replace('.json', '');
        tldrs.set(canonicalId, data);
      } catch (error) {
        console.warn(`⚠️ Warning: Could not load TLDR data from ${file}: ${error}`);
      }
    }
  }

  return tldrs;
}

/**
 * Generate TLDR for content using OpenAI
 */
async function generateTLDR(task: TLDRTask): Promise<TLDRMetadata> {
  console.log(`🧠 Generating TLDR for: ${task.title} (${task.language})`);

  // Read content file
  const fullPath = path.join(process.cwd(), task.contentPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Content file not found: ${fullPath}`);
  }

  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const { content } = matter(fileContent);

  // Create TLDR generation prompt
  const languageInstructions =
    task.language === 'en'
      ? 'Generate a concise TLDR summary in English'
      : 'Generiere eine prägnante TLDR-Zusammenfassung auf Deutsch';

  const prompt = `${languageInstructions} for the following article.

Requirements:
- Maximum 2-3 sentences
- Capture the main point and key insights
- Use clear, engaging language
- Match the tone of the original content
- Language: ${task.language === 'en' ? 'English' : 'German'}

Title: ${task.title}

Content:
${content}

TLDR:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    const tldrContent = response.choices[0]?.message?.content?.trim() || '';
    const usage = response.usage;

    if (!tldrContent) {
      throw new Error('Empty TLDR response from OpenAI');
    }

    // Track token usage
    const tokenUsageEntry = trackTokenUsage(
      'tldr-generation',
      task.canonicalId,
      'gpt-4.1-nano',
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0,
      task.language,
      task.category
    );

    // Create TLDR metadata
    const tldruData: TLDRMetadata = {
      content: tldrContent,
      wordCount: tldrContent.split(' ').length,
      generatedAt: new Date().toISOString(),
      model: 'gpt-4.1-nano',
      language: task.language,
      canonicalId: task.canonicalId,
      sourceContentSha: task.contentSha,
      tokenUsage: {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        cost: tokenUsageEntry.cost,
        co2Impact: tokenUsageEntry.co2Impact,
      },
    };

    // Save TLDR data to file
    const tldrFilePath = path.join(TLDR_DATA_DIR, `${task.canonicalId}.json`);
    fs.writeFileSync(tldrFilePath, JSON.stringify(tldruData, null, 2));

    console.log(`✅ TLDR generated: ${tldrContent.substring(0, 80)}...`);
    console.log(`📊 Token usage: ${usage?.prompt_tokens || 0} input, ${usage?.completion_tokens || 0} output`);
    console.log(`💰 Cost: $${tokenUsageEntry.cost.toFixed(6)}, CO2: ${tokenUsageEntry.co2Impact.toFixed(3)}g`);

    return tldruData;
  } catch (error) {
    console.error(`❌ Failed to generate TLDR: ${error}`);
    throw error;
  }
}

/**
 * Main TLDR generation workflow
 */
async function main() {
  console.log('🚀 Starting TLDR Generation Pipeline');
  console.log(`⚡ Using GPT-4.1 nano model ($0.10/$0.40 per 1M tokens)`);

  // Parse command line arguments
  const args = process.argv.slice(2);
  const forceRegenerate = args.includes('--force');
  const langFilter = args.find((arg) => arg.startsWith('--lang='))?.split('=')[1] as 'en' | 'de' | undefined;

  // Load content registry
  const registry = loadContentRegistry();
  console.log(`📋 Loaded content registry with ${registry.entries.length} entries`);

  // Load existing TLDR data
  const existingTLDRs = loadExistingTLDRData();
  console.log(`📁 Found ${existingTLDRs.size} existing TLDR files`);

  // Filter entries based on criteria
  let eligibleEntries = registry.entries;

  // Apply language filter if specified
  if (langFilter) {
    eligibleEntries = eligibleEntries.filter((entry) => entry.language === langFilter);
    console.log(`🔍 Filtered to ${langFilter.toUpperCase()} content: ${eligibleEntries.length} entries`);
  }

  // Build TLDR tasks
  const tasks: TLDRTask[] = [];

  for (const entry of eligibleEntries) {
    const existingTLDR = existingTLDRs.get(entry.canonicalId);

    // Skip if TLDR exists and force regeneration is not requested
    if (existingTLDR && !forceRegenerate) {
      // Check if content has changed
      if (existingTLDR.sourceContentSha === entry.contentSha) {
        console.log(`⏭️  Skipping ${entry.canonicalId}: TLDR up to date`);
        continue;
      } else {
        console.log(`🔄 Content changed for ${entry.canonicalId}: will regenerate TLDR`);
      }
    }

    tasks.push({
      canonicalId: entry.canonicalId,
      contentPath: entry.filePath,
      title: entry.title,
      language: entry.language,
      contentSha: entry.contentSha,
      category: entry.category,
    });
  }

  if (tasks.length === 0) {
    console.log('✅ No TLDR generation needed. All TLDRs are up to date!');
    console.log('💡 Use --force flag to regenerate existing TLDRs');
    return;
  }

  console.log(`\n📝 Found ${tasks.length} content files needing TLDR generation:`);
  tasks.forEach((task, index) => {
    console.log(`   ${index + 1}. ${task.title} (${task.language.toUpperCase()}) - ${task.canonicalId}`);
  });

  console.log(`\n🔄 Starting TLDR generation...`);

  // Process tasks sequentially
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`\n[${i + 1}/${tasks.length}] Processing: ${task.title}`);

    try {
      await generateTLDR(task);
      processed++;
      console.log(`✅ TLDR ${i + 1} completed successfully`);
    } catch (error) {
      console.error(`❌ Failed to process task ${i + 1}:`, error);
      console.error(`❌ Error details:`, {
        message: error instanceof Error ? error.message : String(error),
        canonicalId: task.canonicalId,
        contentPath: task.contentPath,
      });
      failed++;
      console.log(`❌ Task ${i + 1} failed, continuing to next task...\n`);
    }

    console.log(`📊 Progress: ${processed} completed, ${failed} failed, ${tasks.length - i - 1} remaining\n`);
  }

  // Final summary
  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`📊 TLDR Generation Summary:`);
  console.log(`   Total tasks: ${tasks.length}`);
  console.log(`   Successfully processed: ${processed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success rate: ${Math.round((processed / tasks.length) * 100)}%`);

  if (processed > 0) {
    console.log(`\n✅ Successfully generated ${processed} TLDRs`);
    console.log(`📁 TLDR data saved to: ${TLDR_DATA_DIR}/`);
  }

  if (failed > 0) {
    console.log(`\n❌ Failed TLDRs: ${failed}`);
    console.log(`💡 Check the error logs above for details on failed generations`);
    console.log(`🔄 You can run the script again to retry failed TLDRs`);
    process.exit(1);
  }

  console.log('\n🎉 All TLDR generation completed successfully!');
  console.log('💡 TLDRs are now available for use in your content system');
  console.log(`📊 Check token usage with: pnpm run tokens:summary`);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
