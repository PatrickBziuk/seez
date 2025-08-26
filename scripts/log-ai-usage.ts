/**
 * AI Usage Logging System
 * 
 * Provides centralized logging of AI operations to an append-only ledger.
 * Separates AI usage tracking from content frontmatter for cleaner architecture.
 */

import { appendFileSync, existsSync } from 'node:fs';

export interface AIUsageEvent {
  /** ISO 8601 timestamp */
  ts: string;
  /** Canonical ID of the content being processed */
  canonicalId: string;
  /** Type of AI operation performed */
  op: 'translation' | 'tldr' | 'tagging' | 'content-generation' | 'summarization';
  /** AI model used (e.g. gpt-4o-mini) */
  model: string;
  /** Number of input tokens */
  input_tokens: number;
  /** Number of output tokens */
  output_tokens: number;
  /** Cost in USD (optional, can be calculated from model config) */
  usd?: number;
  /** Source language for translation operations */
  source_language?: 'en' | 'de';
  /** Target language for translation operations */
  target_language?: 'en' | 'de';
  /** Additional context or metadata */
  context?: string;
}

export interface AIUsageLogEntry extends AIUsageEvent {
  /** Always includes timestamp */
  ts: string;
}

const LEDGER_PATH = 'data/ai-ledger.ndjson';

/**
 * Log an AI usage event to the central ledger
 * @param event AI usage event data
 */
export function logAIUsage(event: Omit<AIUsageEvent, 'ts'>): void {
  const record: AIUsageLogEntry = {
    ts: new Date().toISOString(),
    ...event
  };
  
  try {
    // Ensure ledger file exists
    if (!existsSync(LEDGER_PATH)) {
      appendFileSync(LEDGER_PATH, '', 'utf8');
    }
    
    // Append as NDJSON (newline-delimited JSON)
    appendFileSync(LEDGER_PATH, JSON.stringify(record) + '\n', 'utf8');
    
    console.log(`✅ AI usage logged: ${event.op} for ${event.canonicalId} (${event.input_tokens + event.output_tokens} tokens)`);
  } catch (error) {
    console.error('❌ Failed to log AI usage:', error);
    // Don't throw - logging failure shouldn't break the pipeline
  }
}

/**
 * Log translation operation
 * @param canonicalId Content canonical ID
 * @param model AI model used
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param sourceLanguage Source language
 * @param targetLanguage Target language
 * @param cost Optional cost in USD
 */
export function logTranslation(
  canonicalId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  sourceLanguage: 'en' | 'de',
  targetLanguage: 'en' | 'de',
  cost?: number
): void {
  logAIUsage({
    canonicalId,
    op: 'translation',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    source_language: sourceLanguage,
    target_language: targetLanguage,
    usd: cost,
  });
}

/**
 * Log TLDR generation operation
 * @param canonicalId Content canonical ID
 * @param model AI model used
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param cost Optional cost in USD
 */
export function logTLDR(
  canonicalId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost?: number
): void {
  logAIUsage({
    canonicalId,
    op: 'tldr',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    usd: cost,
  });
}

/**
 * Log content generation operation
 * @param canonicalId Content canonical ID
 * @param model AI model used
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param context Optional context description
 * @param cost Optional cost in USD
 */
export function logContentGeneration(
  canonicalId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  context?: string,
  cost?: number
): void {
  logAIUsage({
    canonicalId,
    op: 'content-generation',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    context,
    usd: cost,
  });
}

export default {
  logAIUsage,
  logTranslation,
  logTLDR,
  logContentGeneration,
};
