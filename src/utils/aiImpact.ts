/**
 * AI Impact Utilities
 * Provides transparent, range-based environmental impact calculations for AI usage
 */

// Energy consumption estimates per 1k tokens (in Wh)
// Based on various research sources with uncertainty ranges
export const DEFAULT_WH_PER_KTOKENS = {
  low: 2.9, // Conservative estimate
  mid: 4.2, // Best estimate
  high: 6.1, // Upper bound estimate
};

// Grid carbon intensity by region (gCO2/kWh)
// Source: electricityMap.org and regional data
export const GRID_INTENSITY = {
  'us-east-1': { low: 350, mid: 400, high: 450 }, // US East Coast
  'us-west-1': { low: 200, mid: 250, high: 300 }, // US West Coast (more renewable)
  'eu-central-1': { low: 300, mid: 350, high: 400 }, // EU Central
  'eu-west-1': { low: 280, mid: 320, high: 360 }, // EU West
  global: { low: 400, mid: 475, high: 550 }, // Global average
} as const;

// Model-specific pricing (USD per 1k tokens)
export const MODEL_PRICING = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
} as const;

export interface AIUsageItem {
  label: string;
  type: 'generation' | 'revision' | 'summary' | 'translation' | 'analysis';
  input_tokens: number;
  output_tokens: number;
  price_per_1k_input?: number;
  price_per_1k_output?: number;
}

export interface AIMetrics {
  model: string;
  region: keyof typeof GRID_INTENSITY;
  items: AIUsageItem[];
}

export interface EnvironmentalImpact {
  energy: {
    low: number; // Wh
    mid: number;
    high: number;
  };
  co2: {
    low: number; // gCO2
    mid: number;
    high: number;
  };
  cost: number; // USD
  totalTokens: number;
  methodology: string;
}

/**
 * Calculate energy consumption for token usage
 */
export function calculateEnergyConsumption(
  totalTokens: number,
  energyPerKTokens = DEFAULT_WH_PER_KTOKENS
): { low: number; mid: number; high: number } {
  const kTokens = totalTokens / 1000;
  return {
    low: kTokens * energyPerKTokens.low,
    mid: kTokens * energyPerKTokens.mid,
    high: kTokens * energyPerKTokens.high,
  };
}

/**
 * Calculate CO2 emissions from energy consumption
 */
export function calculateCO2Emissions(
  energyWh: { low: number; mid: number; high: number },
  region: keyof typeof GRID_INTENSITY = 'global'
): { low: number; mid: number; high: number } {
  const intensity = GRID_INTENSITY[region];
  const energyKWh = {
    low: energyWh.low / 1000,
    mid: energyWh.mid / 1000,
    high: energyWh.high / 1000,
  };

  return {
    low: energyKWh.low * intensity.low,
    mid: energyKWh.mid * intensity.mid,
    high: energyKWh.high * intensity.high,
  };
}

/**
 * Calculate cost for AI usage
 */
export function calculateCost(items: AIUsageItem[]): number {
  return items.reduce((total, item) => {
    const inputCost = (item.input_tokens / 1000) * (item.price_per_1k_input || 0);
    const outputCost = (item.output_tokens / 1000) * (item.price_per_1k_output || 0);
    return total + inputCost + outputCost;
  }, 0);
}

/**
 * Calculate comprehensive environmental impact
 */
export function calculateEnvironmentalImpact(
  metrics: AIMetrics,
  customEnergyRates?: typeof DEFAULT_WH_PER_KTOKENS
): EnvironmentalImpact {
  const totalTokens = metrics.items.reduce((sum, item) => sum + item.input_tokens + item.output_tokens, 0);

  const energy = calculateEnergyConsumption(totalTokens, customEnergyRates);
  const co2 = calculateCO2Emissions(energy, metrics.region);
  const cost = calculateCost(metrics.items);

  const methodology = `Energy estimates: ${DEFAULT_WH_PER_KTOKENS.low}-${DEFAULT_WH_PER_KTOKENS.high} Wh/1k tokens. Grid intensity for ${metrics.region}: ${GRID_INTENSITY[metrics.region].low}-${GRID_INTENSITY[metrics.region].high} gCO₂/kWh. Ranges reflect measurement uncertainty.`;

  return {
    energy,
    co2,
    cost,
    totalTokens,
    methodology,
  };
}

/**
 * Format energy consumption for display
 */
export function formatEnergy(energyWh: number): string {
  if (energyWh < 1) {
    return `${(energyWh * 1000).toFixed(0)}mWh`;
  } else if (energyWh < 1000) {
    return `${energyWh.toFixed(1)}Wh`;
  } else {
    return `${(energyWh / 1000).toFixed(2)}kWh`;
  }
}

/**
 * Format CO2 emissions for display
 */
export function formatCO2(co2g: number): string {
  if (co2g < 1000) {
    return `${co2g.toFixed(1)}g CO₂`;
  } else {
    return `${(co2g / 1000).toFixed(2)}kg CO₂`;
  }
}

/**
 * Format cost for display
 */
export function formatCost(costUSD: number): string {
  if (costUSD < 0.01) {
    return `$${(costUSD * 100).toFixed(2)}¢`;
  } else {
    return `$${costUSD.toFixed(3)}`;
  }
}

/**
 * Get environmental context for given CO2 amount
 */
export function getCO2Context(co2g: number): string {
  const co2kg = co2g / 1000;

  if (co2kg < 0.001) {
    return '≈ breathing for a few minutes';
  } else if (co2kg < 0.01) {
    return '≈ smartphone charge';
  } else if (co2kg < 0.1) {
    return '≈ cup of coffee';
  } else if (co2kg < 1) {
    return '≈ short email';
  } else if (co2kg < 10) {
    return '≈ driving 100m';
  } else {
    return '≈ driving 1km';
  }
}

/**
 * Load AI metrics from JSON file by canonical ID
 */
export async function loadAIMetrics(_canonicalId: string): Promise<AIMetrics | null> {
  try {
    // In a real implementation, this would be dynamically imported
    // For now, we'll return null and expect the component to handle it
    return null;
  } catch {
    return null;
  }
}
