/**
 * AI Ledger Aggregation System
 * 
 * Processes the append-only AI usage ledger and generates aggregated statistics
 * for sitewide and per-content display in the UI.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { AIUsageLogEntry } from './log-ai-usage.js';

interface ModelConfig {
  usd_per_1k_input: number;
  usd_per_1k_output: number;
  kwh_per_1k_tokens: number;
  provider: string;
  notes?: string;
}

interface GridIntensity {
  g_co2_per_kwh: number;
  zone: string;
  updated_at: string;
  source: string;
}

interface SitewideStats {
  total_tokens: number;
  total_usd: number;
  total_co2_g: number;
  total_operations: number;
  operations_by_type: Record<string, number>;
  models_used: Record<string, number>;
  updated_at: string;
  grid_intensity: GridIntensity;
  sources: string[];
}

interface ContentStats {
  total_tokens: number;
  total_usd: number;
  total_co2_g: number;
  operations: string[];
  models_used: string[];
  first_operation: string;
  last_operation: string;
}

const LEDGER_PATH = 'data/ai-ledger.ndjson';
const MODEL_CONFIG_PATH = 'config/ai-models.json';
const SITEWIDE_OUTPUT = 'src/generated/ai-totals.json';
const BY_CONTENT_OUTPUT = 'src/generated/ai-by-canonical.json';

/**
 * Fetch current grid carbon intensity for electricity
 * Uses EU average as fallback
 */
async function fetchGridIntensity(): Promise<GridIntensity> {
  try {
    // In a real implementation, this would fetch from Electricity Maps API
    // For now, using EU average with transparency about the source
    return {
      g_co2_per_kwh: 485, // EU average 2024
      zone: 'EU',
      updated_at: new Date().toISOString(),
      source: 'EU average (EEA 2024)'
    };
  } catch {
    console.warn('⚠️ Could not fetch real-time grid intensity, using EU average');
    return {
      g_co2_per_kwh: 485,
      zone: 'EU_FALLBACK',
      updated_at: new Date().toISOString(),
      source: 'EU average fallback'
    };
  }
}

/**
 * Load model configuration with pricing and energy data
 */
function loadModelConfig(): Record<string, ModelConfig> {
  if (!existsSync(MODEL_CONFIG_PATH)) {
    console.error(`❌ Model config not found: ${MODEL_CONFIG_PATH}`);
    return {};
  }
  
  try {
    return JSON.parse(readFileSync(MODEL_CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Failed to parse model config:', error);
    return {};
  }
}

/**
 * Load and parse the AI usage ledger
 */
function loadLedger(): AIUsageLogEntry[] {
  if (!existsSync(LEDGER_PATH)) {
    console.log('ℹ️ No AI ledger found, creating empty aggregates');
    return [];
  }
  
  try {
    const content = readFileSync(LEDGER_PATH, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (error) {
    console.error('❌ Failed to parse AI ledger:', error);
    return [];
  }
}

/**
 * Calculate costs and emissions for an event
 */
function calculateMetrics(
  event: AIUsageLogEntry, 
  modelConfig: ModelConfig,
  gridIntensity: GridIntensity
): { usd: number; co2_g: number } {
  const totalTokens = event.input_tokens + event.output_tokens;
  
  // Calculate cost
  const usd = event.usd || (
    (event.input_tokens * modelConfig.usd_per_1k_input + 
     event.output_tokens * modelConfig.usd_per_1k_output) / 1000
  );
  
  // Calculate CO2 emissions
  const kwh = totalTokens * modelConfig.kwh_per_1k_tokens / 1000;
  const co2_g = kwh * gridIntensity.g_co2_per_kwh;
  
  return { usd, co2_g };
}

/**
 * Aggregate AI usage ledger into sitewide and per-content statistics
 */
export async function aggregateLedger(): Promise<void> {
  console.log('🔄 Aggregating AI usage ledger...');
  
  const ledgerData = loadLedger();
  const modelConfig = loadModelConfig();
  const gridIntensity = await fetchGridIntensity();
  
  // Initialize aggregations
  const sitewideStats: SitewideStats = {
    total_tokens: 0,
    total_usd: 0,
    total_co2_g: 0,
    total_operations: 0,
    operations_by_type: {},
    models_used: {},
    updated_at: new Date().toISOString(),
    grid_intensity: gridIntensity,
    sources: [
      'https://openai.com/pricing',
      'https://www.anthropic.com/pricing',
      'EEA Greenhouse Gas Emissions'
    ]
  };
  
  const byCanonical: Record<string, ContentStats> = {};
  
  // Process each ledger entry
  for (const event of ledgerData) {
    const modelCfg = modelConfig[event.model];
    if (!modelCfg) {
      console.warn(`⚠️ Unknown model: ${event.model}, skipping`);
      continue;
    }
    
    const totalTokens = event.input_tokens + event.output_tokens;
    const { usd, co2_g } = calculateMetrics(event, modelCfg, gridIntensity);
    
    // Update sitewide stats
    sitewideStats.total_tokens += totalTokens;
    sitewideStats.total_usd += usd;
    sitewideStats.total_co2_g += co2_g;
    sitewideStats.total_operations += 1;
    
    sitewideStats.operations_by_type[event.op] = 
      (sitewideStats.operations_by_type[event.op] || 0) + 1;
    sitewideStats.models_used[event.model] = 
      (sitewideStats.models_used[event.model] || 0) + 1;
    
    // Update per-content stats
    if (!byCanonical[event.canonicalId]) {
      byCanonical[event.canonicalId] = {
        total_tokens: 0,
        total_usd: 0,
        total_co2_g: 0,
        operations: [],
        models_used: [],
        first_operation: event.ts,
        last_operation: event.ts,
      };
    }
    
    const contentStats = byCanonical[event.canonicalId];
    contentStats.total_tokens += totalTokens;
    contentStats.total_usd += usd;
    contentStats.total_co2_g += co2_g;
    
    if (!contentStats.operations.includes(event.op)) {
      contentStats.operations.push(event.op);
    }
    if (!contentStats.models_used.includes(event.model)) {
      contentStats.models_used.push(event.model);
    }
    
    // Update timestamps
    if (event.ts < contentStats.first_operation) {
      contentStats.first_operation = event.ts;
    }
    if (event.ts > contentStats.last_operation) {
      contentStats.last_operation = event.ts;
    }
  }
  
  // Write aggregated data
  writeFileSync(SITEWIDE_OUTPUT, JSON.stringify(sitewideStats, null, 2));
  writeFileSync(BY_CONTENT_OUTPUT, JSON.stringify(byCanonical, null, 2));
  
  console.log(`✅ AI aggregation complete:`);
  console.log(`   📊 Sitewide: ${sitewideStats.total_tokens} tokens, $${sitewideStats.total_usd.toFixed(4)}, ${sitewideStats.total_co2_g.toFixed(1)}g CO₂`);
  console.log(`   📄 Content: ${Object.keys(byCanonical).length} pieces with AI usage`);
  console.log(`   💾 Written to: ${SITEWIDE_OUTPUT}, ${BY_CONTENT_OUTPUT}`);
}

// Command line execution
if (process.argv[1]?.includes('aggregate-ai-ledger')) {
  aggregateLedger().catch(console.error);
}

export default aggregateLedger;
