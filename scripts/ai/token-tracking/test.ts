import { tokenTracker } from './tracker';

async function test() {
  console.log('Testing token tracker...');

  try {
    await tokenTracker.addUsage({
      operation: 'translation',
      model: 'gpt-4o-mini',
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      fileProcessed: 'test-file.md',
      language: 'de',
    });

    console.log('✅ Token usage added successfully');

    const summary = await tokenTracker.getSummary();
    console.log('📊 Summary:', {
      totalTokens: summary.totalTokens,
      totalCost: summary.totalCost.toFixed(4),
      totalCO2: summary.totalCO2.toFixed(2) + 'g',
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
