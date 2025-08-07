export interface TokenUsage {
  id: string;
  timestamp: string;
  operation: 'translation' | 'tldr' | 'tagging' | 'other';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  co2Equivalent: number;
  fileProcessed?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface TokenSummary {
  totalTokens: number;
  totalCost: number;
  totalCO2: number;
  operationCounts: Record<string, number>;
  modelCounts: Record<string, number>;
  dailyUsage: Record<string, number>;
  monthlyUsage: Record<string, number>;
}

export interface UsageTracker {
  addUsage(usage: Omit<TokenUsage, 'id' | 'timestamp' | 'estimatedCost' | 'co2Equivalent'>): Promise<void>;
  getUsage(startDate?: Date, endDate?: Date): Promise<TokenUsage[]>;
  getSummary(startDate?: Date, endDate?: Date): Promise<TokenSummary>;
  exportUsage(format: 'json' | 'csv'): Promise<string>;
}

// OpenAI Pricing (as of December 2024)
export const MODEL_PRICING = {
  'gpt-4o': {
    input: 2.5 / 1_000_000, // $2.50 per 1M tokens
    output: 10.0 / 1_000_000, // $10.00 per 1M tokens
  },
  'gpt-4o-mini': {
    input: 0.15 / 1_000_000, // $0.15 per 1M tokens
    output: 0.6 / 1_000_000, // $0.60 per 1M tokens
  },
  'gpt-3.5-turbo': {
    input: 0.5 / 1_000_000, // $0.50 per 1M tokens
    output: 1.5 / 1_000_000, // $1.50 per 1M tokens
  },
} as const;

// CO2 estimates based on research from "Carbon Emissions and Large Neural Network Training"
// Approximating ~0.5g CO2 per 1000 tokens for modern GPT models
export const CO2_PER_1000_TOKENS = 0.5; // grams

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  if (!pricing) {
    console.warn(`Unknown model pricing for: ${model}, using gpt-4o-mini as fallback`);
    return calculateCost('gpt-4o-mini', promptTokens, completionTokens);
  }

  return promptTokens * pricing.input + completionTokens * pricing.output;
}

export function calculateCO2(totalTokens: number): number {
  return (totalTokens / 1000) * CO2_PER_1000_TOKENS;
}

export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
  }).format(cost);
}

export function formatCO2(co2: number): string {
  if (co2 < 1) {
    return `${(co2 * 1000).toFixed(1)}mg CO₂`;
  } else if (co2 < 1000) {
    return `${co2.toFixed(2)}g CO₂`;
  } else {
    return `${(co2 / 1000).toFixed(2)}kg CO₂`;
  }
}
