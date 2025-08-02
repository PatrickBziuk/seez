#!/usr/bin/env tsx

/**
 * Translation Generation Script
 * Generates translations, summaries, and quality scores via OpenAI
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';
import {
  type TranslationTask,
  type SupportedLanguage,
  createTranslationHistoryEntry
} from '../src/utils/translation';

async function translateTask(task: TranslationTask) {
  const { sourcePath, targetLang, sourceSha } = task;
  const srcFile = path.join('src/content', sourcePath);
  const raw = fs.readFileSync(srcFile, 'utf-8');
  const parsed = matter(raw);
  const openai = new OpenAI();
  const system = `You are a precise translator, summarizer, and reviewer. Given a markdown document in ${parsed.data.language}, perform the following in one pass:\n` +
    '1. Translate the content into ' + targetLang + ', preserving all markdown structure.\n' +
    '2. Produce a 3-4 sentence TLDR of the original document.\n' +
    '3. Evaluate clarity of the original and quality of the translation; provide numeric scores (0-100).\n' +
    '4. Identify problematic segments with descriptions and suggestions.\n' +
    '5. Output exactly one JSON object with fields: translated_markdown, ai_tldr, ai_textscore, review_issues.';
  const user = raw;
  // Caching to avoid redundant OpenAI calls
  const CACHE_DIR = '.translation-cache';
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${sourceSha}-${targetLang}.json`);
  let result: any;
  if (fs.existsSync(cachePath)) {
    result = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    console.log(`🔄 Using cached translation for ${sourceSha}-${targetLang}`);
  } else {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    });
    const content = response.choices?.[0]?.message?.content || '';
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      throw e;
    }
    fs.writeFileSync(cachePath, JSON.stringify(result), 'utf-8');
  }
  const { translated_markdown, ai_tldr, ai_textscore, review_issues } = result;
  const { data: fm, content: body } = matter(translated_markdown);
  const historyEntry = createTranslationHistoryEntry({ targetLang, sourceSha });
  fm.translationHistory = [historyEntry, ...(fm.translationHistory || [])];
  fm.ai_tldr = ai_tldr;
  fm.ai_textscore = ai_textscore;
  const parts = sourcePath.split(path.sep);
  const collection = parts[0];
  const filename = parts[parts.length - 1];
  const dir = path.join('src/content', collection, targetLang);
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, filename);
  fs.writeFileSync(dst, matter.stringify(body, fm), 'utf-8');
  console.log(`✅ Generated translation: ${dst}`);
  // If quality or review issues indicate poor translation, open GitHub Issue
  const quality = ai_textscore?.translationQuality;
  const issuesList = Array.isArray(review_issues) ? review_issues : [];
  const threshold = Number(process.env.TRANSLATION_QUALITY_THRESHOLD || 70);
  if ((quality !== undefined && quality < threshold) || issuesList.length > 0) {
    const title = `Translation quality issues: ${fm.translationKey} → ${targetLang}`;
    let body = `## Issues for ${fm.translationKey} (${targetLang})\n\n`;
    if (quality !== undefined) body += `**Translation quality score**: ${quality}\n\n`;
    for (const rev of issuesList) {
      body += `- **${rev.section}**: ${rev.issue}\n  - Suggestion: ${rev.suggestion}\n`;
    }
    try {
      require('child_process').execSync(
        `gh issue create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}"`
      );
      console.log(`🚨 Created GitHub issue for poor translation: ${title}`);
    } catch (err) {
      console.error('Failed to create GitHub issue:', err);
    }
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: generate_translations.ts <tasks.json>');
    process.exit(1);
  }
  const tasks: TranslationTask[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  for (const task of tasks) {
    await translateTask(task);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { translateTask };