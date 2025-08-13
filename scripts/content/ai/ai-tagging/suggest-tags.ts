/**
 * Analyze content and suggest additional tags
 * This script suggests tags to ADD to existing ones, doesn't replace them
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ContentAnalyzer, type ContentAnalysis } from './content-analyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TagSuggestionReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    filesWithSuggestions: number;
    totalSuggestedTags: number;
    averageConfidence: number;
    newTagCandidates: number;
  };
  suggestions: ContentAnalysis[];
  newTagRegistry: string[];
}

async function analyzeContentForTags(): Promise<TagSuggestionReport> {
  console.log('🚀 Starting content analysis for tag suggestions...\n');

  // Load the content analyzer
  const registryPath = path.join(__dirname, '../../../src/data/tags/master-tag-registry.json');
  const analyzer = new ContentAnalyzer(registryPath);

  // Analyze all content
  const analyses = analyzer.analyzeAllContent();

  // Filter to only files with suggestions
  const suggestionsOnly = analyses.filter(
    (analysis) => analysis.suggestedTags.length > 0 || analysis.newTagCandidates.length > 0
  );

  // Collect all new tag candidates
  const allNewTags = new Set<string>();
  analyses.forEach((analysis) => {
    analysis.newTagCandidates.forEach((tag) => allNewTags.add(tag));
  });

  // Calculate summary stats
  const totalSuggestedTags = analyses.reduce((sum, analysis) => sum + analysis.suggestedTags.length, 0);

  const averageConfidence =
    analyses.length > 0 ? analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length : 0;

  const report: TagSuggestionReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: analyses.length,
      filesWithSuggestions: suggestionsOnly.length,
      totalSuggestedTags,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      newTagCandidates: allNewTags.size,
    },
    suggestions: suggestionsOnly,
    newTagRegistry: Array.from(allNewTags),
  };

  return report;
}

async function displayReport(report: TagSuggestionReport) {
  console.log('\n📊 Tag Suggestion Analysis Complete!');
  console.log('='.repeat(50));
  console.log(`📁 Files analyzed: ${report.summary.totalFiles}`);
  console.log(`💡 Files with suggestions: ${report.summary.filesWithSuggestions}`);
  console.log(`🏷️  Total tag suggestions: ${report.summary.totalSuggestedTags}`);
  console.log(`📈 Average confidence: ${(report.summary.averageConfidence * 100).toFixed(1)}%`);
  console.log(`🆕 New tag candidates: ${report.summary.newTagCandidates}`);

  if (report.suggestions.length > 0) {
    console.log('\n📋 Detailed Suggestions:');
    console.log('-'.repeat(50));

    report.suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.filePath}`);
      console.log(`   Collection: ${suggestion.collection} | Language: ${suggestion.language}`);
      console.log(`   Existing tags: [${suggestion.existingTags.join(', ')}]`);

      if (suggestion.suggestedTags.length > 0) {
        console.log(`   ➕ Suggested: [${suggestion.suggestedTags.join(', ')}]`);
        console.log(`   📊 Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        console.log(`   💭 Reasoning: ${suggestion.reasoning}`);
      }

      if (suggestion.newTagCandidates.length > 0) {
        console.log(`   🆕 New tag ideas: [${suggestion.newTagCandidates.join(', ')}]`);
      }
    });
  }

  if (report.newTagRegistry.length > 0) {
    console.log('\n🏷️  New Tag Candidates for Registry:');
    console.log('-'.repeat(30));
    report.newTagRegistry.forEach((tag) => {
      console.log(`   • ${tag}`);
    });
    console.log('\nThese could be added to the master tag registry after review.');
  }
}

async function saveReport(report: TagSuggestionReport) {
  const outputPath = path.join(__dirname, '../../../src/data/tags/tag-suggestions-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${outputPath}`);
}

async function main() {
  try {
    const report = await analyzeContentForTags();
    await displayReport(report);
    await saveReport(report);

    console.log('\n✅ Analysis complete! Review suggestions and apply as needed.');
    console.log('\n💡 Next steps:');
    console.log('   1. Review suggested tags for accuracy');
    console.log('   2. Add approved new tags to master registry');
    console.log('   3. Apply suggestions to content files');
    console.log('   4. Update master registry usage stats');
  } catch (error) {
    console.error('❌ Error during tag analysis:', error);
    process.exit(1);
  }
}

// Run the script
main();
