/**
 * Content analysis service for AI-powered tag suggestions
 * Analyzes content and suggests relevant tags to ADD to existing ones
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ContentAnalysis {
  filePath: string;
  collection: string;
  language: 'en' | 'de';
  existingTags: string[];
  suggestedTags: string[];
  confidence: number;
  reasoning: string;
  newTagCandidates: string[];
  shouldAddToRegistry: boolean;
}

interface MasterRegistry {
  categories: {
    [category: string]: {
      en: string[];
      de: string[];
    };
  };
  multilingual_pairs: Array<{
    en: string;
    de: string;
    confidence: string;
    category?: string;
  }>;
  aliases: {
    en: Record<string, string>;
    de: Record<string, string>;
  };
  usage_stats: {
    [tag: string]: {
      language: 'en' | 'de';
      count: number;
      collections: string[];
      last_seen: string;
    };
  };
}

class ContentAnalyzer {
  private registry!: MasterRegistry;
  private allTags!: { en: string[]; de: string[] };

  constructor(registryPath: string) {
    this.loadRegistry(registryPath);
    this.buildTagLists();
  }

  private loadRegistry(registryPath: string) {
    if (!fs.existsSync(registryPath)) {
      throw new Error(`Master registry not found at ${registryPath}`);
    }
    this.registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    console.log('📋 Master registry loaded');
  }

  private buildTagLists() {
    this.allTags = { en: [], de: [] };

    // Collect all tags from all categories
    Object.values(this.registry.categories).forEach((category) => {
      this.allTags.en.push(...category.en);
      this.allTags.de.push(...category.de);
    });

    // Add aliases
    this.allTags.en.push(...Object.keys(this.registry.aliases.en));
    this.allTags.de.push(...Object.keys(this.registry.aliases.de));

    // Remove duplicates
    this.allTags.en = [...new Set(this.allTags.en)];
    this.allTags.de = [...new Set(this.allTags.de)];

    console.log(`📊 Tag lists built: ${this.allTags.en.length} EN, ${this.allTags.de.length} DE`);
  }

  /**
   * Extract clean content for analysis (removes frontmatter, MDX components, etc.)
   */
  private extractAnalyzableContent(content: string): string {
    // Remove frontmatter
    const { content: bodyContent } = matter(content);

    // Remove MDX imports
    let cleanContent = bodyContent.replace(/^import .+ from .+;?$/gm, '');

    // Remove MDX components (basic removal - could be more sophisticated)
    cleanContent = cleanContent.replace(/<[A-Z]\w*[^>]*\/?>|<\/[A-Z]\w*>/g, '');

    // Remove code blocks
    cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '');
    cleanContent = cleanContent.replace(/`[^`]+`/g, '');

    // Remove markdown formatting
    cleanContent = cleanContent.replace(/#{1,6}\s/g, ''); // Headers
    cleanContent = cleanContent.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold
    cleanContent = cleanContent.replace(/\*([^*]+)\*/g, '$1'); // Italic
    cleanContent = cleanContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links

    // Clean up whitespace
    cleanContent = cleanContent.replace(/\n\s*\n/g, '\n').trim();

    return cleanContent;
  }

  /**
   * Analyze content semantically and suggest tags
   */
  private analyzeContentSemantics(
    content: string,
    title: string,
    language: 'en' | 'de'
  ): {
    suggestedTags: string[];
    confidence: number;
    reasoning: string;
    newTagCandidates: string[];
  } {
    const words = content.toLowerCase().split(/\s+/);
    const titleWords = title.toLowerCase().split(/\s+/);
    const allWords = [...titleWords, ...words];

    const suggestedTags: string[] = [];
    const reasoningPoints: string[] = [];
    const newTagCandidates: string[] = [];

    // Get available tags for this language
    const availableTags = this.allTags[language];

    // Keyword-based matching
    for (const tag of availableTags) {
      const tagWords = tag.toLowerCase().split(/[-_\s]/);
      let matches = 0;

      for (const tagWord of tagWords) {
        if (tagWord.length < 3) continue; // Skip short words

        // Check direct word matches
        if (allWords.some((word) => word.includes(tagWord) || tagWord.includes(word))) {
          matches++;
        }

        // Check semantic matches (simple keyword expansion)
        const semanticMatches = this.getSemanticMatches(tagWord, language);
        if (semanticMatches.some((match) => allWords.some((word) => word.includes(match)))) {
          matches++;
        }
      }

      // If enough words match, suggest the tag
      if (matches >= Math.min(tagWords.length, 1)) {
        suggestedTags.push(tag);
        reasoningPoints.push(`"${tag}" matches content keywords`);
      }
    }

    // Content pattern analysis
    this.analyzeContentPatterns(content, title, language, suggestedTags, reasoningPoints, newTagCandidates);

    // Calculate confidence based on number of matches and content length
    const contentWordCount = words.length;
    const confidence = Math.min(
      0.95,
      suggestedTags.length * 0.2 +
        (contentWordCount > 50 ? 0.3 : contentWordCount * 0.006) +
        (titleWords.length > 0 ? 0.2 : 0)
    );

    return {
      suggestedTags: [...new Set(suggestedTags)].slice(0, 7), // Max 7 suggestions
      confidence,
      reasoning: reasoningPoints.join('; '),
      newTagCandidates: [...new Set(newTagCandidates)].slice(0, 3), // Max 3 new tag ideas
    };
  }

  private getSemanticMatches(word: string, language: 'en' | 'de'): string[] {
    const semanticMap: Record<'en' | 'de', Record<string, string[]>> = {
      en: {
        programming: ['code', 'coding', 'development', 'dev', 'software'],
        music: ['audio', 'sound', 'song', 'melody', 'composition'],
        ai: ['artificial', 'intelligence', 'machine', 'learning', 'neural'],
        personal: ['individual', 'private', 'own', 'self'],
        creative: ['art', 'artistic', 'design', 'imagination', 'innovative'],
        web: ['website', 'online', 'internet', 'browser'],
        tutorial: ['guide', 'howto', 'instruction', 'lesson'],
        demo: ['demonstration', 'example', 'showcase', 'preview'],
      },
      de: {
        programmierung: ['code', 'coding', 'entwicklung', 'software'],
        musik: ['audio', 'sound', 'lied', 'melodie', 'komposition'],
        ki: ['künstlich', 'intelligenz', 'maschinell', 'lernen'],
        persönlich: ['individuell', 'privat', 'eigen', 'selbst'],
        kreativ: ['kunst', 'künstlerisch', 'design', 'fantasie', 'innovativ'],
        reflexion: ['nachdenken', 'gedanken', 'betrachtung', 'überlegung'],
      },
    };

    return semanticMap[language]?.[word] || [];
  }

  private analyzeContentPatterns(
    content: string,
    title: string,
    language: 'en' | 'de',
    suggestedTags: string[],
    reasoningPoints: string[],
    newTagCandidates: string[]
  ) {
    // Tech patterns
    if (/import .+ from|<[A-Z]\w+|\.tsx?|\.jsx?|npm|yarn|pnpm/.test(content)) {
      if (!suggestedTags.includes('programming')) {
        suggestedTags.push('programming');
        reasoningPoints.push('Code patterns detected');
      }
    }

    // Component patterns
    if (/<[A-Z]\w+/.test(content) || /components?/i.test(content)) {
      const componentTag = language === 'de' ? 'komponenten' : 'components';
      if (!suggestedTags.includes(componentTag)) {
        suggestedTags.push(componentTag);
        reasoningPoints.push('Component usage detected');
      }
    }

    // Tutorial/Demo patterns
    if (/how to|tutorial|guide|example|demo|showcase/i.test(title + ' ' + content)) {
      const tutorialTag = language === 'de' ? 'anleitung' : 'tutorial';
      if (!suggestedTags.includes(tutorialTag) && !suggestedTags.includes('demo')) {
        suggestedTags.push('demo');
        reasoningPoints.push('Educational content detected');
      }
    }

    // Personal/Reflection patterns
    if (
      /I think|I feel|my experience|reflection|personal/i.test(content) ||
      /ich denke|ich fühle|meine erfahrung|reflexion|persönlich/i.test(content)
    ) {
      const personalTag = language === 'de' ? 'persönlich' : 'personal';
      if (!suggestedTags.includes(personalTag)) {
        suggestedTags.push(personalTag);
        reasoningPoints.push('Personal reflection content detected');
      }
    }

    // Extract potential new tags from content
    const words = content.toLowerCase().split(/\s+/);
    const technicalTerms = words.filter(
      (word) =>
        word.length > 4 &&
        /^[a-z-]+$/.test(word) &&
        !this.allTags[language].includes(word) &&
        ['framework', 'library', 'tool', 'platform', 'technology', 'method'].some(
          (tech) =>
            content.toLowerCase().includes(word + ' ' + tech) || content.toLowerCase().includes(tech + ' ' + word)
        )
    );

    newTagCandidates.push(...technicalTerms.slice(0, 2));
  }

  /**
   * Analyze a single content file
   */
  public analyzeFile(filePath: string): ContentAnalysis | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter } = matter(content);

      const language = (frontmatter.language as 'en' | 'de') || 'en';
      const existingTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      const title = frontmatter.title || path.basename(filePath, path.extname(filePath));

      // Extract analyzable content
      const analyzableContent = this.extractAnalyzableContent(content);

      if (analyzableContent.length < 20) {
        console.log(`⚠️  Skipping ${filePath}: content too short for analysis`);
        return null;
      }

      // Analyze content
      const analysis = this.analyzeContentSemantics(analyzableContent, title, language);

      // Filter out tags that already exist
      const newSuggestedTags = analysis.suggestedTags.filter(
        (tag) => !existingTags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      );

      // Determine collection from file path
      const collection =
        filePath.split(path.sep).find((part) => ['books', 'projects', 'lab', 'life', 'pages'].includes(part)) ||
        'unknown';

      return {
        filePath: path.relative(process.cwd(), filePath),
        collection,
        language,
        existingTags,
        suggestedTags: newSuggestedTags,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        newTagCandidates: analysis.newTagCandidates,
        shouldAddToRegistry: analysis.newTagCandidates.length > 0,
      };
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Analyze all content files
   */
  public analyzeAllContent(): ContentAnalysis[] {
    const contentDir = path.join(__dirname, '../../src/content');
    const collections = ['books', 'projects', 'lab', 'life', 'pages'];
    const results: ContentAnalysis[] = [];

    console.log('🔍 Analyzing all content for tag suggestions...');

    for (const collection of collections) {
      const collectionPath = path.join(contentDir, collection);
      if (!fs.existsSync(collectionPath)) continue;

      const files = this.findMarkdownFiles(collectionPath);
      console.log(`📁 Analyzing ${collection}: ${files.length} files`);

      for (const file of files) {
        const analysis = this.analyzeFile(file);
        if (analysis) {
          results.push(analysis);
          console.log(`  📄 ${path.basename(file)}: +${analysis.suggestedTags.length} suggested tags`);
        }
      }
    }

    return results;
  }

  private findMarkdownFiles(dir: string): string[] {
    const result: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        result.push(...this.findMarkdownFiles(fullPath));
      } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.mdx'))) {
        result.push(fullPath);
      }
    }
    return result;
  }
}

export { ContentAnalyzer, type ContentAnalysis };
