import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { TokenUsage, TokenSummary, UsageTracker } from './types.js';
import { calculateCost, calculateCO2 } from './types.js';

const DATA_DIR = join(process.cwd(), 'data');
const USAGE_FILE = join(DATA_DIR, 'token-usage.json');

export class FileBasedTokenTracker implements UsageTracker {
  private usage: TokenUsage[] = [];
  private loaded = false;

  private async ensureDataDir(): Promise<void> {
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
  }

  private async loadUsage(): Promise<void> {
    if (this.loaded) return;

    await this.ensureDataDir();

    if (existsSync(USAGE_FILE)) {
      try {
        const data = await readFile(USAGE_FILE, 'utf-8');
        this.usage = JSON.parse(data);
      } catch (error) {
        console.warn('Failed to load token usage data:', error);
        this.usage = [];
      }
    }

    this.loaded = true;
  }

  private async saveUsage(): Promise<void> {
    await this.ensureDataDir();
    await writeFile(USAGE_FILE, JSON.stringify(this.usage, null, 2));
  }

  async addUsage(usage: Omit<TokenUsage, 'id' | 'timestamp' | 'estimatedCost' | 'co2Equivalent'>): Promise<void> {
    await this.loadUsage();

    const tokenUsage: TokenUsage = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...usage,
      estimatedCost: calculateCost(usage.model, usage.promptTokens, usage.completionTokens),
      co2Equivalent: calculateCO2(usage.totalTokens),
    };

    this.usage.push(tokenUsage);
    await this.saveUsage();

    console.log(
      `Token usage recorded: ${usage.operation} - ${usage.totalTokens} tokens - ${this.formatCost(tokenUsage.estimatedCost)}`
    );
  }

  async getUsage(startDate?: Date, endDate?: Date): Promise<TokenUsage[]> {
    await this.loadUsage();

    let filtered = this.usage;

    if (startDate) {
      filtered = filtered.filter((u) => new Date(u.timestamp) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((u) => new Date(u.timestamp) <= endDate);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getSummary(startDate?: Date, endDate?: Date): Promise<TokenSummary> {
    const usage = await this.getUsage(startDate, endDate);

    const summary: TokenSummary = {
      totalTokens: usage.reduce((sum, u) => sum + u.totalTokens, 0),
      totalCost: usage.reduce((sum, u) => sum + u.estimatedCost, 0),
      totalCO2: usage.reduce((sum, u) => sum + u.co2Equivalent, 0),
      operationCounts: {},
      modelCounts: {},
      dailyUsage: {},
      monthlyUsage: {},
    };

    usage.forEach((u) => {
      // Count operations
      summary.operationCounts[u.operation] = (summary.operationCounts[u.operation] || 0) + 1;

      // Count models
      summary.modelCounts[u.model] = (summary.modelCounts[u.model] || 0) + u.totalTokens;

      // Daily usage
      const day = u.timestamp.split('T')[0];
      summary.dailyUsage[day] = (summary.dailyUsage[day] || 0) + u.totalTokens;

      // Monthly usage
      const month = day.substring(0, 7);
      summary.monthlyUsage[month] = (summary.monthlyUsage[month] || 0) + u.totalTokens;
    });

    return summary;
  }

  async exportUsage(format: 'json' | 'csv'): Promise<string> {
    const usage = await this.getUsage();

    if (format === 'json') {
      return JSON.stringify(usage, null, 2);
    }

    // CSV format
    const headers = [
      'id',
      'timestamp',
      'operation',
      'model',
      'promptTokens',
      'completionTokens',
      'totalTokens',
      'estimatedCost',
      'co2Equivalent',
      'fileProcessed',
      'language',
    ];

    const rows = usage.map((u) => [
      u.id,
      u.timestamp,
      u.operation,
      u.model,
      u.promptTokens,
      u.completionTokens,
      u.totalTokens,
      u.estimatedCost,
      u.co2Equivalent,
      u.fileProcessed || '',
      u.language || '',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private formatCost(cost: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  }
}

// Global tracker instance
export const tokenTracker = new FileBasedTokenTracker();
