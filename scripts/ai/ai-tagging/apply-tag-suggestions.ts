/**
 * Interactive tag application script
 * Allows users to review and selectively apply tag suggestions
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TagSuggestion {
  filePath: string;
  collection: string;
  language: 'en' | 'de';
  existingTags: string[];
  suggestedTags: string[];
  confidence: number;
  reasoning: string;
  newTagCandidates: string[];
}

interface ApplicationResult {
  totalFiles: number;
  filesModified: number;
  tagsAdded: number;
  newTagsAddedToRegistry: string[];
  skippedFiles: number;
}

class InteractiveTagApplicator {
  private rl: readline.Interface;
  private results: ApplicationResult;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.results = {
      totalFiles: 0,
      filesModified: 0,
      tagsAdded: 0,
      newTagsAddedToRegistry: [],
      skippedFiles: 0,
    };
  }

  private async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private displaySuggestion(suggestion: TagSuggestion, index: number, total: number) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 File ${index + 1}/${total}: ${suggestion.filePath}`);
    console.log(`📁 Collection: ${suggestion.collection} | 🌐 Language: ${suggestion.language}`);
    console.log(`🏷️  Existing tags: [${suggestion.existingTags.join(', ')}]`);

    if (suggestion.suggestedTags.length > 0) {
      console.log(`➕ Suggested tags: [${suggestion.suggestedTags.join(', ')}]`);
      console.log(`📊 Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
      console.log(`💭 Reasoning: ${suggestion.reasoning.substring(0, 100)}...`);
    }

    if (suggestion.newTagCandidates.length > 0) {
      console.log(`🆕 New tag candidates: [${suggestion.newTagCandidates.join(', ')}]`);
    }
  }

  private async selectTagsToApply(suggestedTags: string[]): Promise<string[]> {
    if (suggestedTags.length === 0) return [];

    console.log('\n🎯 Select tags to apply:');
    suggestedTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. ${tag}`);
    });

    const response = await this.question(`\nEnter numbers (e.g., "1,3,5") or "a" for all, "n" for none: `);

    if (response.toLowerCase() === 'n' || response.trim() === '') {
      return [];
    }

    if (response.toLowerCase() === 'a') {
      return [...suggestedTags];
    }

    // Parse selection
    const selected: string[] = [];
    const numbers = response.split(',').map((n) => parseInt(n.trim()) - 1);

    for (const num of numbers) {
      if (num >= 0 && num < suggestedTags.length) {
        selected.push(suggestedTags[num]);
      }
    }

    return selected;
  }

  private async applyTagsToFile(filePath: string, tagsToAdd: string[]): Promise<boolean> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      // Add new tags to existing tags
      const existingTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      const newTags = [...existingTags];

      for (const tag of tagsToAdd) {
        if (!newTags.includes(tag)) {
          newTags.push(tag);
        }
      }

      // Update frontmatter
      frontmatter.tags = newTags;

      // Reconstruct file content
      const updatedContent = matter.stringify(body, frontmatter);

      // Write back to file
      fs.writeFileSync(filePath, updatedContent);

      console.log(`✅ Applied ${tagsToAdd.length} tags to ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error(`❌ Error applying tags to ${filePath}:`, error);
      return false;
    }
  }

  private async addTagsToRegistry(newTags: string[]) {
    if (newTags.length === 0) return;

    console.log(`\n📋 Adding ${newTags.length} new tags to registry...`);

    const registryPath = path.join(__dirname, '../../../src/data/tags/master-tag-registry.json');
    if (!fs.existsSync(registryPath)) {
      console.log('⚠️  Master registry not found, skipping registry update');
      return;
    }

    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

      // Add new tags to the "other" category for now
      // In a real implementation, you might want to categorize them properly
      for (const tag of newTags) {
        const language = /[äöüß]/.test(tag) ? 'de' : 'en'; // Simple language detection

        if (!registry.categories.other[language].includes(tag)) {
          registry.categories.other[language].push(tag);

          // Add usage stats
          registry.usage_stats[tag] = {
            language,
            count: 1,
            collections: ['manual-addition'],
            last_seen: new Date().toISOString(),
          };
        }
      }

      registry.lastUpdated = new Date().toISOString();
      registry.metadata.totalTags += newTags.length;
      registry.metadata.byLanguage.en += newTags.filter((tag) => !/[äöüß]/.test(tag)).length;
      registry.metadata.byLanguage.de += newTags.filter((tag) => /[äöüß]/.test(tag)).length;

      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
      console.log(`✅ Registry updated with ${newTags.length} new tags`);
    } catch (error) {
      console.error('❌ Error updating registry:', error);
    }
  }

  public async processInteractively() {
    console.log('🎯 Interactive Tag Application\n');
    console.log('This tool will help you review and apply AI-suggested tags to your content.');
    console.log('You can select which tags to apply for each file.\n');

    // Load suggestions report
    const reportPath = path.join(__dirname, '../../../src/data/tags/tag-suggestions-report.json');
    if (!fs.existsSync(reportPath)) {
      console.log('❌ No suggestions report found. Run suggest-tags.ts first.');
      this.rl.close();
      return;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const suggestions = report.suggestions;

    if (suggestions.length === 0) {
      console.log('🎉 No tag suggestions found - all content is already well-tagged!');
      this.rl.close();
      return;
    }

    console.log(`📊 Found ${suggestions.length} files with tag suggestions.\n`);

    const mode = await this.question(
      'Select mode:\n  1. Review each file individually (recommended)\n  2. Auto-apply high-confidence suggestions\n  3. Skip and exit\n\nChoose (1-3): '
    );

    switch (mode.trim()) {
      case '1':
        await this.reviewIndividually(suggestions);
        break;
      case '2':
        await this.autoApply(suggestions);
        break;
      case '3':
        console.log('👋 Exiting without changes.');
        break;
      default:
        console.log('❌ Invalid selection.');
    }

    this.rl.close();
    this.displayFinalResults();
  }

  private async reviewIndividually(suggestions: TagSuggestion[]) {
    console.log('\n🔍 Starting individual review...\n');

    this.results.totalFiles = suggestions.length;
    const allNewTags = new Set<string>();

    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      this.displaySuggestion(suggestion, i, suggestions.length);

      const action = await this.question('\nActions: (a)pply tags, (s)kip, (q)uit: ');

      if (action.toLowerCase() === 'q') {
        console.log('👋 Quitting review process.');
        break;
      }

      if (action.toLowerCase() === 's') {
        console.log('⏭️  Skipping this file.');
        this.results.skippedFiles++;
        continue;
      }

      if (action.toLowerCase() === 'a') {
        // Select tags to apply
        const tagsToApply = await this.selectTagsToApply(suggestion.suggestedTags);

        if (tagsToApply.length > 0) {
          const success = await this.applyTagsToFile(suggestion.filePath, tagsToApply);
          if (success) {
            this.results.filesModified++;
            this.results.tagsAdded += tagsToApply.length;
          }
        }

        // Handle new tag candidates
        if (suggestion.newTagCandidates.length > 0) {
          const addNewTags = await this.question(`\nAdd new tag candidates to registry? (y/n): `);
          if (addNewTags.toLowerCase() === 'y') {
            suggestion.newTagCandidates.forEach((tag) => allNewTags.add(tag));
          }
        }
      }
    }

    // Update registry with new tags
    if (allNewTags.size > 0) {
      await this.addTagsToRegistry(Array.from(allNewTags));
      this.results.newTagsAddedToRegistry = Array.from(allNewTags);
    }
  }

  private async autoApply(suggestions: TagSuggestion[]) {
    console.log('\n🚀 Auto-applying high-confidence suggestions (>80%)...\n');

    this.results.totalFiles = suggestions.length;
    const highConfidenceSuggestions = suggestions.filter((s) => s.confidence > 0.8);

    console.log(`📊 Found ${highConfidenceSuggestions.length} high-confidence suggestions to apply.`);

    const confirm = await this.question('Continue with auto-apply? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('👋 Auto-apply cancelled.');
      return;
    }

    for (const suggestion of highConfidenceSuggestions) {
      // Apply top 3 suggestions only for auto-apply
      const tagsToApply = suggestion.suggestedTags.slice(0, 3);

      if (tagsToApply.length > 0) {
        console.log(`📄 ${path.basename(suggestion.filePath)}: +${tagsToApply.join(', ')}`);
        const success = await this.applyTagsToFile(suggestion.filePath, tagsToApply);
        if (success) {
          this.results.filesModified++;
          this.results.tagsAdded += tagsToApply.length;
        }
      }
    }
  }

  private displayFinalResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Final Results:');
    console.log(`   Files processed: ${this.results.totalFiles}`);
    console.log(`   Files modified: ${this.results.filesModified}`);
    console.log(`   Tags added: ${this.results.tagsAdded}`);
    console.log(`   Files skipped: ${this.results.skippedFiles}`);

    if (this.results.newTagsAddedToRegistry.length > 0) {
      console.log(`   New tags added to registry: ${this.results.newTagsAddedToRegistry.length}`);
      console.log(`   New tags: [${this.results.newTagsAddedToRegistry.join(', ')}]`);
    }

    console.log('\n✅ Tag application complete!');

    if (this.results.filesModified > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Review the applied tags');
      console.log('   2. Commit the changes');
      console.log('   3. Run the tag analysis again to see updated stats');
    }
  }
}

async function main() {
  try {
    const applicator = new InteractiveTagApplicator();
    await applicator.processInteractively();
  } catch (error) {
    console.error('❌ Error during tag application:', error);
    process.exit(1);
  }
}

// Run the script
main();
