#!/usr/bin/env tsx

/**
 * Conflict Detection Script
 * Opens a GitHub issue for stale translation tasks (source SHA mismatch).
 */

import fs from 'fs';
// import path from 'path';
import { Octokit } from 'octokit';
import type { TranslationTask } from '../../src/utils/translation';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: detect_conflicts.ts <tasks.json>');
    process.exit(1);
  }
  const tasks: TranslationTask[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const stale = tasks.filter((t) => t.reason === 'stale');
  if (!stale.length) {
    console.log('No stale translations/conflicts detected.');
    return;
  }
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/');
  for (const t of stale) {
    const title = `Translation conflict: ${t.translationKey} → ${t.targetLang}`;
    const body =
      `Detected stale translation for **${t.translationKey}** (lang=${t.targetLang}).\n\n` +
      `Source SHA has changed to \`${t.sourceSha}\`. Please review and resolve.\n`;
    await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: ['translation', 'conflict'],
    });
    console.log('Opened issue:', title);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
