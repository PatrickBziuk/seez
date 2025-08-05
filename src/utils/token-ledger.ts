/**
 * Token Usage Ledger System
 * @purpose Track OpenAI API token usage with daily 2M token cap
 * @dependencies fs, path
 * @usedBy Translation generation scripts and GitHub Actions
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Daily token usage cap (2 million tokens)
 */
export const DAILY_TOKEN_CAP = 2_000_000;

/**
 * Token usage entry structure
 */
interface TokenUsageEntry {
  timestamp: string;
  operation: string;
  translationKey: string;
  sourceLang: string;
  targetLang: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
}

/**
 * Daily token usage summary
 */
interface DailyTokenUsage {
  date: string;
  totalTokens: number;
  totalTranslations: number;
  entries: TokenUsageEntry[];
  capReached: boolean;
  capReachedAt?: string;
}

/**
 * Get the path for token usage ledger file
 * @param date - Date in YYYY-MM-DD format
 * @returns File path for the ledger
 */
function getTokenLedgerPath(date: string): string {
  const ledgerDir = 'translation-metrics';
  if (!existsSync(ledgerDir)) {
    mkdirSync(ledgerDir, { recursive: true });
  }
  return join(ledgerDir, `${date}.json`);
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns Current date string
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Load daily token usage from ledger
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Daily usage data
 */
export function loadDailyTokenUsage(date?: string): DailyTokenUsage {
  const targetDate = date || getCurrentDate();
  const ledgerPath = getTokenLedgerPath(targetDate);

  if (!existsSync(ledgerPath)) {
    return {
      date: targetDate,
      totalTokens: 0,
      totalTranslations: 0,
      entries: [],
      capReached: false,
    };
  }

  try {
    const content = readFileSync(ledgerPath, 'utf-8');
    return JSON.parse(content) as DailyTokenUsage;
  } catch (error) {
    console.warn(`Failed to parse token ledger for ${targetDate}:`, error);
    return {
      date: targetDate,
      totalTokens: 0,
      totalTranslations: 0,
      entries: [],
      capReached: false,
    };
  }
}

/**
 * Save daily token usage to ledger
 * @param usage - Daily usage data to save
 */
function saveDailyTokenUsage(usage: DailyTokenUsage): void {
  const ledgerPath = getTokenLedgerPath(usage.date);

  // Ensure directory exists
  const dir = dirname(ledgerPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(ledgerPath, JSON.stringify(usage, null, 2));
}

/**
 * Check if daily token cap has been reached
 * @param date - Date to check (defaults to today)
 * @returns True if cap has been reached
 */
export function isDailyTokenCapReached(date?: string): boolean {
  const usage = loadDailyTokenUsage(date);
  return usage.capReached || usage.totalTokens >= DAILY_TOKEN_CAP;
}

/**
 * Get remaining tokens for the day
 * @param date - Date to check (defaults to today)
 * @returns Number of tokens remaining
 */
export function getRemainingDailyTokens(date?: string): number {
  const usage = loadDailyTokenUsage(date);
  return Math.max(0, DAILY_TOKEN_CAP - usage.totalTokens);
}

/**
 * Record token usage for a translation operation
 * @param params - Token usage parameters
 * @returns Updated daily usage data
 */
export function recordTokenUsage({
  translationKey,
  sourceLang,
  targetLang,
  inputTokens,
  outputTokens,
  model,
  operation = 'translation',
}: {
  translationKey: string;
  sourceLang: string;
  targetLang: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  operation?: string;
}): DailyTokenUsage {
  const date = getCurrentDate();
  const usage = loadDailyTokenUsage(date);

  const totalTokens = inputTokens + outputTokens;
  const entry: TokenUsageEntry = {
    timestamp: new Date().toISOString(),
    operation,
    translationKey,
    sourceLang,
    targetLang,
    inputTokens,
    outputTokens,
    totalTokens,
    model,
  };

  // Update usage data
  usage.entries.push(entry);
  usage.totalTokens += totalTokens;
  usage.totalTranslations += 1;

  // Check if cap is reached
  if (!usage.capReached && usage.totalTokens >= DAILY_TOKEN_CAP) {
    usage.capReached = true;
    usage.capReachedAt = entry.timestamp;
  }

  // Save updated usage
  saveDailyTokenUsage(usage);

  return usage;
}

/**
 * Check if a translation operation would exceed the daily cap
 * @param estimatedTokens - Estimated tokens for the operation
 * @param date - Date to check (defaults to today)
 * @returns True if operation would exceed cap
 */
export function wouldExceedDailyCap(estimatedTokens: number, date?: string): boolean {
  const remaining = getRemainingDailyTokens(date);
  return estimatedTokens > remaining;
}

/**
 * Get token usage summary for a date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of daily usage summaries
 */
export function getTokenUsageSummary(startDate: string, endDate: string): DailyTokenUsage[] {
  const summaries: DailyTokenUsage[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    summaries.push(loadDailyTokenUsage(dateStr));
  }

  return summaries;
}

/**
 * Create token usage report for GitHub Actions summary
 * @param usage - Daily usage data
 * @returns Markdown formatted report
 */
export function createTokenUsageReport(usage: DailyTokenUsage): string {
  const remainingTokens = DAILY_TOKEN_CAP - usage.totalTokens;
  const usagePercentage = ((usage.totalTokens / DAILY_TOKEN_CAP) * 100).toFixed(1);

  let report = `## Token Usage Report - ${usage.date}\n\n`;
  report += `- **Total Tokens Used**: ${usage.totalTokens.toLocaleString()} / ${DAILY_TOKEN_CAP.toLocaleString()} (${usagePercentage}%)\n`;
  report += `- **Remaining Tokens**: ${remainingTokens.toLocaleString()}\n`;
  report += `- **Translations Processed**: ${usage.totalTranslations}\n`;

  if (usage.capReached) {
    report += `- **⚠️ Daily Cap Reached**: ${usage.capReachedAt}\n`;
  }

  if (usage.entries.length > 0) {
    report += `\n### Recent Operations\n\n`;
    report += `| Time | Operation | Key | Tokens |\n`;
    report += `|------|-----------|-----|--------|\n`;

    // Show last 10 operations
    const recentEntries = usage.entries.slice(-10);
    for (const entry of recentEntries) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      report += `| ${time} | ${entry.operation} | ${entry.translationKey} | ${entry.totalTokens} |\n`;
    }
  }

  return report;
}
