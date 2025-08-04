#!/usr/bin/env tsx

/**
 * TLDR Generation Script
 * Features:
 * - Generates AI-powered TL;DR summaries for content files
 * - Preserves existing content structure and frontmatter
 * - Uses GPT-4o-mini for cost-effective generation
 * - Batch processing with progress tracking
 * - Respects existing ai_tldr fields (no overwrite by default)
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';

/**
 * Configuration constants
 */
const CONTENT_BASE_PATH = 'src/content';
const CACHE_DIR = '.tldr-cache';
const SUPPORTED_COLLECTIONS = ['books', 'projects', 'lab', 'life'];

/**
 * Progress tracking
 */
interface TldrProgress {
  processedFiles: string[];
  lastProcessedTime: string;
  totalFiles: number;
  completedFiles: number;
}

/**
 * Command line arguments
 */
const args = process.argv.slice(2);
const FORCE_REGENERATE = args.includes('--force');
const TARGET_COLLECTION = args.find(arg => arg.startsWith('--collection='))?.split('=')[1];

/**
 * Initialize OpenAI client
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Load or create progress tracking
 */
function loadProgress(): TldrProgress {
  const progressFile = '.tldr-progress.json';
  if (fs.existsSync(progressFile)) {
    return JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
  }
  return {
    processedFiles: [],
    lastProcessedTime: new Date().toISOString(),
    totalFiles: 0,
    completedFiles: 0
  };
}

/**
 * Save progress tracking
 */
function saveProgress(progress: TldrProgress): void {
  fs.writeFileSync('.tldr-progress.json', JSON.stringify(progress, null, 2));
}

/**
 * Mark a file as processed
 */
function markFileProcessed(filePath: string, progress: TldrProgress): void {
  progress.processedFiles.push(filePath);
  progress.completedFiles++;
  progress.lastProcessedTime = new Date().toISOString();
  saveProgress(progress);
}

/**
 * Discover content files that need TLDR generation
 */
function discoverContentFiles(): string[] {
  const files: string[] = [];
  
  const collections = TARGET_COLLECTION ? [TARGET_COLLECTION] : SUPPORTED_COLLECTIONS;
  
  for (const collection of collections) {
    const collectionPath = path.join(CONTENT_BASE_PATH, collection);
    if (!fs.existsSync(collectionPath)) continue;
    
    // Get all language directories
    const langDirs = fs.readdirSync(collectionPath).filter(item => {
      const itemPath = path.join(collectionPath, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    for (const langDir of langDirs) {
      const langPath = path.join(collectionPath, langDir);
      const contentFiles = fs.readdirSync(langPath).filter(file => 
        file.endsWith('.md') || file.endsWith('.mdx')
      );
      
      for (const file of contentFiles) {
        const fullPath = path.join(langPath, file);
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Extract content for TLDR generation
 */
function extractContentForTldr(content: string): string {
  // Remove frontmatter, import statements, and code blocks
  let cleanContent = content
    .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter
    .replace(/^import\s+.*$/gm, '') // Remove import statements
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/^\s*#+\s*/gm, '') // Remove heading markers but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text, remove URLs
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
    .trim();
  
  // Take first 1500 characters to stay within reasonable token limits
  if (cleanContent.length > 1500) {
    cleanContent = cleanContent.substring(0, 1500) + '...';
  }
  
  return cleanContent;
}

/**
 * Generate TLDR for a single file
 */
async function generateTldrForFile(filePath: string): Promise<boolean> {
  try {
    console.log(`📝 Processing: ${filePath}`);
    
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);
    
    // Skip if TLDR already exists and not forcing regeneration
    if (parsed.data.ai_tldr && !FORCE_REGENERATE) {
      console.log(`⏭️  Skipping (TLDR exists): ${filePath}`);
      return true;
    }
    
    // Extract content for TLDR generation
    const contentForTldr = extractContentForTldr(parsed.content);
    
    if (contentForTldr.length < 100) {
      console.log(`⏭️  Skipping (content too short): ${filePath}`);
      return true;
    }
    
    // Detect language from frontmatter or path
    const language = parsed.data.language || 
      (filePath.includes('/en/') ? 'en' : 'de');
    
    // Generate TLDR using OpenAI
    console.log(`🤖 Generating TLDR for ${path.basename(filePath)} (${language})`);
    
    const systemPrompt = `You are a content summarizer. Generate a concise 2-3 sentence TL;DR summary in ${language} that captures the main points of the content. The summary should be informative and engaging.

Requirements:
- Write in ${language === 'de' ? 'German' : 'English'}
- 2-3 sentences maximum
- Focus on key takeaways and main points
- Use clear, accessible language
- No markdown formatting in the output`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 150,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please generate a TL;DR for this content:\n\n${contentForTldr}` }
      ]
    });

    const tldr = response.choices?.[0]?.message?.content?.trim();
    
    if (!tldr) {
      console.error(`❌ Failed to generate TLDR for ${filePath}`);
      return false;
    }
    
    // Update frontmatter with generated TLDR
    parsed.data.ai_tldr = tldr;
    
    // Reconstruct file with new frontmatter
    const newContent = matter.stringify(parsed.content, parsed.data);
    
    // Write back to file
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    console.log(`✅ Generated TLDR: ${tldr.substring(0, 60)}...`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting TLDR generation...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  // Create cache directory
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  
  // Load progress
  const progress = loadProgress();
  
  // Discover content files
  const contentFiles = discoverContentFiles();
  console.log(`📁 Found ${contentFiles.length} content files`);
  
  if (TARGET_COLLECTION) {
    console.log(`🎯 Processing collection: ${TARGET_COLLECTION}`);
  }
  
  if (FORCE_REGENERATE) {
    console.log('🔄 Force regeneration enabled - will overwrite existing TLDRs');
  }
  
  // Update progress totals
  progress.totalFiles = contentFiles.length;
  saveProgress(progress);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each file
  for (const filePath of contentFiles) {
    // Skip if already processed (unless forcing)
    if (!FORCE_REGENERATE && progress.processedFiles.includes(filePath)) {
      console.log(`⏭️  Already processed: ${filePath}`);
      continue;
    }
    
    const success = await generateTldrForFile(filePath);
    
    if (success) {
      successCount++;
      markFileProcessed(filePath, progress);
    } else {
      errorCount++;
    }
    
    // Add small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 TLDR generation completed!');
  console.log(`✅ Successfully processed: ${successCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  
  if (errorCount === 0) {
    console.log('\n💡 Usage tips:');
    console.log('- TLDRs are now available in your content metadata');
    console.log('- Use --force to regenerate existing TLDRs');
    console.log('- Use --collection=books to target specific collection');
  }
}

// Execute if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { generateTldrForFile, discoverContentFiles };
