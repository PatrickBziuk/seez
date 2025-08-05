#!/usr/bin/env tsx

/**
 * Translation Detection Script
 * @purpose Detect missing and stale translations across content collections
 * @dependencies gray-matter, fs, path
 * @usedBy GitHub Actions workflow for translation pipeline
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';
import {
  computeContentSha,
  getLanguagePairs,
  generateTranslationKey,
  validateTranslationFrontmatter,
  type TranslationTask,
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '../src/utils/translation';
import { shouldSkipTranslation, getSkipReason } from '../src/utils/translation-override';

/**
 * Simple content language detection based on heuristics
 * @param content - Content to analyze
 * @param title - Title to analyze
 * @returns Detected language or null if uncertain
 */
function detectContentLanguage(content: string, title: string = ''): SupportedLanguage | null {
  const textToAnalyze = (title + ' ' + content).toLowerCase();

  // German indicators (more specific patterns first)
  const germanIndicators = [
    // Common German words
    /\b(und|oder|der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|ist|sind|war|waren|wird|werden|wurde|wurden|haben|hat|hatte|hatten|sein|seine|seiner|seinen|ihrer|ihres|ihren|nicht|aber|auch|wenn|dann|noch|nur|schon|sehr|kann|können|konnte|konnten|soll|sollte|wollen|wollte|muss|musste|darf|durfte|mag|mögen|lassen|macht|machen|gehen|geht|ging|gingen|kommen|kommt|kam|kamen|sehen|sieht|sah|sahen|wissen|weiß|wusste|wussten|denken|dachte|dachten|fühlen|fühlt|fühlte|fühlten|leben|lebt|lebte|lebten|sprechen|spricht|sprach|sprachen|arbeiten|arbeitet|arbeitete|arbeiteten|spielen|spielt|spielte|spielten|lernen|lernt|lernte|lernten|verstehen|versteht|verstand|verstanden|beginnen|beginnt|begann|begannen|nehmen|nimmt|nahm|nahmen|geben|gibt|gab|gaben|finden|findet|fand|fanden|zeigen|zeigt|zeigte|zeigten|werden|wird|wurde|wurden|bleiben|bleibt|blieb|blieben|stehen|steht|stand|standen|liegen|liegt|lag|lagen|setzen|setzt|setzte|setzten|legen|legt|legte|legten|bringen|bringt|brachte|brachten|halten|hält|hielt|hielten|führen|führt|führte|führten|erreichen|erreicht|erreichte|erreichten|schaffen|schafft|schaffte|schafften|erhalten|erhält|erhielt|erhielten|entwickeln|entwickelt|entwickelte|entwickelten|entstehen|entsteht|entstand|entstanden|bedeuten|bedeutet|bedeutete|bedeuteten|bestehen|besteht|bestand|bestanden|betreffen|betrifft|betraf|betrafen|behandeln|behandelt|behandelte|behandelten|verwenden|verwendet|verwendete|verwendeten|erscheinen|erscheint|erschien|erschienen|gehören|gehört|gehörte|gehörten|erwarten|erwartet|erwartete|erwarteten|erkennen|erkennt|erkannte|erkannten|entscheiden|entscheidet|entschied|entschieden|vorstellen|stellt vor|stellte vor|stellten vor|darstellen|stellt dar|stellte dar|stellten dar|herstellen|stellt her|stellte her|stellten her|aufstellen|stellt auf|stellte auf|stellten auf|feststellen|stellt fest|stellte fest|stellten fest|anstellen|stellt an|stellte an|stellten an|einstellen|stellt ein|stellte ein|stellten ein)\b/g,
    // German-specific characters and patterns
    /[äöüßÄÖÜ]/g,
    // Common German phrases
    /\b(ich bin|du bist|er ist|sie ist|es ist|wir sind|ihr seid|sie sind|das ist|dies ist|hier ist|dort ist|es gibt|gibt es|zum beispiel|beispielsweise|das heißt|das bedeutet|im gegensatz|im vergleich|auf diese weise|auf jeden fall|meiner meinung nach)\b/gi,
  ];

  // English indicators
  const englishIndicators = [
    // Common English words
    /\b(the|and|or|of|to|in|for|with|on|at|by|from|about|into|through|during|before|after|above|below|between|among|within|without|against|under|over|upon|across|around|behind|beside|beyond|toward|towards|inside|outside|inside|outside|this|that|these|those|what|which|who|whom|whose|when|where|why|how|can|could|will|would|shall|should|may|might|must|ought|need|dare|used|going|been|being|have|has|had|do|does|did|done|am|is|are|was|were|being|been|get|got|gotten|give|gave|given|take|took|taken|make|made|come|came|go|went|gone|know|knew|known|think|thought|see|saw|seen|say|said|tell|told|find|found|feel|felt|seem|seemed|look|looked|appear|appeared|become|became|turn|turned|grow|grew|grown|keep|kept|leave|left|move|moved|live|lived|work|worked|play|played|run|ran|walk|walked|talk|talked|speak|spoke|spoken|write|wrote|written|read|hear|heard|listen|listened|watch|watched|learn|learned|teach|taught|study|studied|understand|understood|believe|believed|remember|remembered|forget|forgot|forgotten|hope|hoped|want|wanted|like|liked|love|loved|hate|hated|enjoy|enjoyed|help|helped|try|tried|start|started|begin|began|begun|stop|stopped|end|ended|finish|finished|continue|continued|change|changed|stay|stayed|remain|remained|follow|followed|lead|led|meet|met|join|joined|include|included|contain|contained|hold|held|carry|carried|bring|brought|send|sent|receive|received|open|opened|close|closed|show|showed|shown|hide|hid|hidden|put|placed|set|cut|built|break|broke|broken|fix|fixed|use|used|wear|wore|worn|buy|bought|sell|sold|pay|paid|cost|spend|spent|save|saved|win|won|lose|lost|choose|chose|chosen|decide|decided|plan|planned|expect|expected|happen|happened|occur|occurred|exist|existed|appear|appeared|disappear|disappeared|arrive|arrived|return|returned|visit|visited|travel|traveled|drive|drove|driven|ride|rode|ridden|fly|flew|flown|fall|fell|fallen|rise|rose|risen|climb|climbed|jump|jumped|sit|sat|stand|stood|lie|lay|lain|sleep|slept|wake|woke|woken|eat|ate|eaten|drink|drank|drunk|cook|cooked|clean|cleaned|wash|washed|dress|dressed)\b/g,
    // English-specific contractions
    /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't|mustn't|haven't|hasn't|hadn't|aren't|isn't|wasn't|weren't|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|that's|what's|who's|where's|when's|how's|why's|there's|here's)\b/gi,
    // Common English phrases
    /\b(in order to|in addition to|as well as|such as|for example|for instance|that is|in other words|on the other hand|in contrast|in comparison|in this way|in any case|in my opinion|it seems that|it appears that|it is important|it is necessary|it is possible|it is likely|there is|there are|this is|that is)\b/gi,
  ];

  let germanScore = 0;
  let englishScore = 0;

  // Count German indicators
  germanIndicators.forEach((pattern) => {
    const matches = textToAnalyze.match(pattern);
    if (matches) {
      germanScore += matches.length;
    }
  });

  // Count English indicators
  englishIndicators.forEach((pattern) => {
    const matches = textToAnalyze.match(pattern);
    if (matches) {
      englishScore += matches.length;
    }
  });

  // Need clear majority to make a decision
  const total = germanScore + englishScore;
  if (total < 5) return null; // Not enough text to determine

  const germanRatio = germanScore / total;
  const englishRatio = englishScore / total;

  // Need at least 60% confidence
  if (germanRatio >= 0.6) return 'de';
  if (englishRatio >= 0.6) return 'en';

  return null; // Unclear
}

/**
 * Validate that frontmatter language matches content language
 * @param content - File content
 * @param frontmatter - Parsed frontmatter
 * @returns Validation result
 */
function validateLanguageConsistency(
  content: string,
  frontmatter: Record<string, unknown>
): {
  valid: boolean;
  detectedLang: SupportedLanguage | null;
  frontmatterLang: SupportedLanguage;
  warnings: string[];
} {
  const frontmatterLang = (frontmatter.language as SupportedLanguage) || 'en';
  const detectedLang = detectContentLanguage(content, frontmatter.title as string);
  const warnings: string[] = [];

  if (detectedLang && detectedLang !== frontmatterLang) {
    warnings.push(`Content appears to be in ${detectedLang} but frontmatter says ${frontmatterLang}`);
  }

  return {
    valid: !detectedLang || detectedLang === frontmatterLang,
    detectedLang,
    frontmatterLang,
    warnings,
  };
}

/**
 * Content collection configuration
 */
const CONTENT_COLLECTIONS = ['books', 'projects', 'lab', 'life'] as const;
const CONTENT_BASE_PATH = 'src/content';

/**
 * Content file information
 */
interface ContentFile {
  path: string;
  relativePath: string;
  language: SupportedLanguage;
  translationKey: string;
  frontmatter: Record<string, unknown>;
  content: string;
  sourceSha: string;
}

/**
 * Translation pair information
 */
interface TranslationPair {
  translationKey: string;
  files: Map<SupportedLanguage, ContentFile>;
}

/**
 * Get all content files from a collection
 * @param collection - Collection name
 * @returns Array of content files
 */
function getContentFiles(collection: string): ContentFile[] {
  const collectionPath = join(CONTENT_BASE_PATH, collection);

  if (!existsSync(collectionPath)) {
    console.warn(`Collection path does not exist: ${collectionPath}`);
    return [];
  }

  const files: ContentFile[] = [];

  function scanDirectory(dirPath: string) {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const entryPath = join(dirPath, entry);
      const stat = statSync(entryPath);

      if (stat.isDirectory()) {
        scanDirectory(entryPath);
      } else if (entry.match(/\.(md|mdx)$/)) {
        try {
          const content = readFileSync(entryPath, 'utf-8');
          const parsed = matter(content);
          const relativePath = relative(CONTENT_BASE_PATH, entryPath);

          // Determine language from frontmatter or file path
          let language: SupportedLanguage = parsed.data.language || 'en';
          if (!SUPPORTED_LANGUAGES.includes(language)) {
            // Try to infer from path
            const pathLang = entryPath.match(/[/\\](en|de)[/\\]/)?.[1];
            language = (pathLang as SupportedLanguage) || 'en';
          }

          // Validate language consistency between frontmatter and content
          const languageValidation = validateLanguageConsistency(parsed.content, parsed.data);
          if (!languageValidation.valid && languageValidation.warnings.length > 0) {
            console.warn(`Language mismatch in ${relativePath}:`, languageValidation.warnings);

            // If we have high confidence in detected language, use it instead
            if (languageValidation.detectedLang && languageValidation.detectedLang !== language) {
              console.warn(
                `  Using detected language ${languageValidation.detectedLang} instead of frontmatter ${language}`
              );
              language = languageValidation.detectedLang;
            }
          }

          // Generate or extract translation key
          const translationKey = parsed.data.translationKey || generateTranslationKey(relativePath);

          // Validate frontmatter
          const validation = validateTranslationFrontmatter(parsed.data);
          if (!validation.valid) {
            console.warn(`Invalid frontmatter in ${relativePath}:`, validation.errors);
          }

          const sourceSha = computeContentSha(content);

          files.push({
            path: entryPath,
            relativePath,
            language,
            translationKey,
            frontmatter: parsed.data,
            content: parsed.content,
            sourceSha,
          });
        } catch (error) {
          console.error(`Error processing ${entryPath}:`, error);
        }
      }
    }
  }

  scanDirectory(collectionPath);
  return files;
}

/**
 * Group content files by translation key
 * @param files - Array of content files
 * @returns Map of translation pairs
 */
function groupByTranslationKey(files: ContentFile[]): Map<string, TranslationPair> {
  const pairs = new Map<string, TranslationPair>();

  for (const file of files) {
    if (!pairs.has(file.translationKey)) {
      pairs.set(file.translationKey, {
        translationKey: file.translationKey,
        files: new Map(),
      });
    }

    const pair = pairs.get(file.translationKey)!;
    pair.files.set(file.language, file);
  }

  return pairs;
}

/**
 * Detect translation tasks for a translation pair
 * @param pair - Translation pair to analyze
 * @returns Array of translation tasks
 */
function detectTranslationTasks(pair: TranslationPair): TranslationTask[] {
  const tasks: TranslationTask[] = [];

  for (const [sourceLang, sourceFile] of pair.files) {
    const targetLangs = getLanguagePairs(sourceLang);

    for (const targetLang of targetLangs) {
      // CRITICAL: Skip if source and target languages are the same
      if (sourceLang === targetLang) {
        console.warn(`Skipping same-language translation: ${pair.translationKey} ${sourceLang}->${targetLang}`);
        continue;
      }

      // Check if translation should be skipped
      if (shouldSkipTranslation(pair.translationKey, sourceFile.relativePath)) {
        const reason = getSkipReason(pair.translationKey, sourceFile.relativePath);
        console.error(`Skipping translation ${pair.translationKey} ${sourceLang}->${targetLang}: ${reason}`);
        continue;
      }

      const targetFile = pair.files.get(targetLang);

      if (!targetFile) {
        // Missing translation
        tasks.push({
          sourcePath: sourceFile.relativePath,
          targetLang,
          translationKey: pair.translationKey,
          reason: 'missing',
          sourceSha: sourceFile.sourceSha,
        });
      } else {
        // Check if translation is stale
        const translationHistory = targetFile.frontmatter.translationHistory as
          | Array<{
              sourceSha: string;
            }>
          | undefined;

        const lastTranslationSha = translationHistory?.[0]?.sourceSha;

        if (!lastTranslationSha || lastTranslationSha !== sourceFile.sourceSha) {
          tasks.push({
            sourcePath: sourceFile.relativePath,
            targetLang,
            translationKey: pair.translationKey,
            reason: 'stale',
            sourceSha: sourceFile.sourceSha,
          });
        }
      }
    }
  }

  return tasks;
}

/**
 * Main detection function
 * @returns Array of all translation tasks
 */
async function detectTranslations(): Promise<TranslationTask[]> {
  const allTasks: TranslationTask[] = [];

  console.error('🔍 Scanning content collections for translation tasks...');

  for (const collection of CONTENT_COLLECTIONS) {
    console.error(`📁 Processing collection: ${collection}`);
    const files = getContentFiles(collection);
    console.error(`   Found ${files.length} content files`);

    const pairs = groupByTranslationKey(files);
    console.error(`   Found ${pairs.size} translation groups`);

    let collectionTasks = 0;
    for (const pair of pairs.values()) {
      const tasks = detectTranslationTasks(pair);
      allTasks.push(...tasks);
      collectionTasks += tasks.length;
    }

    console.error(`   Generated ${collectionTasks} translation tasks`);
  }

  return allTasks;
}

/**
 * CLI execution
 */
async function main() {
  console.error('🚀 Starting translation detection script...');
  console.error(`📁 Working directory: ${process.cwd()}`);
  console.error(`📋 Script arguments: ${process.argv.join(' ')}`);

  try {
    console.error('⏳ Calling detectTranslations function...');
    const tasks = await detectTranslations();

    console.error(`\n📋 Translation Detection Summary:`);
    console.error(`   Total tasks: ${tasks.length}`);
    console.error(`   Missing translations: ${tasks.filter((t) => t.reason === 'missing').length}`);
    console.error(`   Stale translations: ${tasks.filter((t) => t.reason === 'stale').length}`);

    // Output as JSON for consumption by GitHub Actions
    console.log(JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error('❌ Error detecting translations:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    process.exit(1);
  }
}

// Always run main function when this script is executed
main().catch((error) => {
  console.error('❌ Fatal error in main function:', error);
  process.exit(1);
});

export { detectTranslations };
