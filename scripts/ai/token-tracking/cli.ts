#!/usr/bin/env node

import { tokenTracker } from './tracker.js';
import { formatCost, formatCO2 } from './types.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'summary':
        await showSummary(args[1]);
        break;
      case 'usage':
        await showUsage(args[1], parseInt(args[2]) || 10);
        break;
      case 'export':
        await exportUsage((args[1] as 'json' | 'csv') || 'json');
        break;
      case 'add':
        await addTestUsage();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function showSummary(period?: string) {
  let startDate: Date | undefined;

  if (period === 'today') {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
  }

  const summary = await tokenTracker.getSummary(startDate);

  console.log('\n🤖 Token Usage Summary');
  console.log('='.repeat(50));
  console.log(`📊 Total Tokens: ${summary.totalTokens.toLocaleString()}`);
  console.log(`💰 Total Cost: ${formatCost(summary.totalCost)}`);
  console.log(`🌱 CO₂ Impact: ${formatCO2(summary.totalCO2)}`);

  console.log('\n📈 Operations:');
  Object.entries(summary.operationCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([op, count]) => {
      console.log(`  ${op}: ${count} times`);
    });

  console.log('\n🤖 Models:');
  Object.entries(summary.modelCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([model, tokens]) => {
      console.log(`  ${model}: ${tokens.toLocaleString()} tokens`);
    });

  if (Object.keys(summary.dailyUsage).length > 0) {
    console.log('\n📅 Daily Usage (last 7 days):');
    const recentDays = Object.entries(summary.dailyUsage)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7);

    recentDays.forEach(([day, tokens]) => {
      console.log(`  ${day}: ${tokens.toLocaleString()} tokens`);
    });
  }
}

async function showUsage(operation?: string, limit = 10) {
  const usage = await tokenTracker.getUsage();

  let filtered = usage;
  if (operation) {
    filtered = usage.filter((u) => u.operation === operation);
  }

  console.log(`\n📋 Recent Token Usage (${operation || 'all'}, last ${limit})`);
  console.log('='.repeat(80));

  filtered.slice(0, limit).forEach((u) => {
    const date = new Date(u.timestamp).toLocaleString();
    console.log(`${date} | ${u.operation} | ${u.model}`);
    console.log(`  📄 ${u.fileProcessed || 'N/A'} (${u.language || 'N/A'})`);
    console.log(`  🔢 ${u.totalTokens} tokens | ${formatCost(u.estimatedCost)} | ${formatCO2(u.co2Equivalent)}`);
    console.log('');
  });
}

async function exportUsage(format: 'json' | 'csv') {
  const data = await tokenTracker.exportUsage(format);
  const filename = `token-usage-${new Date().toISOString().split('T')[0]}.${format}`;

  console.log(`\n📤 Exporting usage data to ${filename}...`);

  const fs = await import('fs/promises');
  await fs.writeFile(filename, data);

  console.log(`✅ Export complete: ${filename}`);
}

async function addTestUsage() {
  await tokenTracker.addUsage({
    operation: 'translation',
    model: 'gpt-4o-mini',
    promptTokens: 1000,
    completionTokens: 500,
    totalTokens: 1500,
    fileProcessed: 'test-file.md',
    language: 'de',
  });

  console.log('✅ Test usage added');
}

function showHelp() {
  console.log(`
🤖 Token Usage Tracker

Usage:
  Commands:
  pnpm run tokens:summary [period]     Show usage summary
  pnpm run tokens:usage [operation]    Show recent usage
  pnpm run tokens:export [format]      Export usage data
  pnpm run tokens:add                  Add test usage

Arguments:
  period: today, week, month (default: all time)
  operation: translation, tldr, tagging (default: all)
  format: json, csv (default: json)

Examples:
  pnpm run tokens:summary today
  pnpm run tokens:usage translation
  pnpm run tokens:export csv
`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
