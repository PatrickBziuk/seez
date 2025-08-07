#!/usr/bin/env node

/**
 * Simplified Canonical Registry Validation Script (JavaScript)
 * @purpose Test content registry integrity and structure
 * @dependencies content registry data
 * @usedBy Development testing and CI validation
 */

import fs from 'fs';
import path from 'path';

/**
 * Validate canonical ID format
 */
function validateCanonicalIdFormat(canonicalId) {
  // Format: slug-YYYYMMDD-hash8
  const pattern = /^[a-z0-9-]+-\d{8}-[a-f0-9]{8}$/;
  return pattern.test(canonicalId);
}

/**
 * Load content registry for testing
 */
function loadRegistry() {
  const registryPath = path.join(process.cwd(), 'data', 'content-registry.json');

  if (!fs.existsSync(registryPath)) {
    console.error('❌ Content registry not found:', registryPath);
    return null;
  }

  try {
    const content = fs.readFileSync(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to load registry:', error.message);
    return null;
  }
}

/**
 * Test registry structure and integrity
 */
function testRegistryStructure(registry) {
  console.log('\n📋 Testing registry structure...');

  let allPassed = true;

  // Test top-level structure
  if (!registry.version) {
    console.log('  ❌ Missing version field');
    allPassed = false;
  } else {
    console.log(`  ✅ Version: ${registry.version}`);
  }

  if (!registry.lastUpdated) {
    console.log('  ❌ Missing lastUpdated field');
    allPassed = false;
  } else {
    console.log(`  ✅ Last updated: ${registry.lastUpdated}`);
  }

  if (!registry.entries || typeof registry.entries !== 'object') {
    console.log('  ❌ Missing or invalid entries object');
    allPassed = false;
  } else {
    console.log(`  ✅ Entries: ${Object.keys(registry.entries).length} canonical IDs`);
  }

  return allPassed;
}

/**
 * Test canonical ID formats
 */
function testCanonicalIds(registry) {
  console.log('\n🔗 Testing canonical ID formats...');

  let allPassed = true;

  for (const canonicalId of Object.keys(registry.entries)) {
    if (validateCanonicalIdFormat(canonicalId)) {
      console.log(`  ✅ ${canonicalId}: valid format`);
    } else {
      console.log(`  ❌ ${canonicalId}: invalid format`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test entry completeness
 */
function testEntryCompleteness(registry) {
  console.log('\n📄 Testing entry completeness...');

  let allPassed = true;

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    const issues = [];

    if (!entry.title) issues.push('missing title');
    if (!entry.originalLanguage) issues.push('missing originalLanguage');
    if (entry.originalLanguage && !['en', 'de'].includes(entry.originalLanguage)) {
      issues.push(`invalid originalLanguage: ${entry.originalLanguage}`);
    }
    if (!entry.originalPath) issues.push('missing originalPath');

    // Check translation structure
    if (entry.translations) {
      for (const [lang, translation] of Object.entries(entry.translations)) {
        if (!translation.status) issues.push(`translation ${lang}: missing status`);
        if (!translation.path) issues.push(`translation ${lang}: missing path`);
        if (translation.status && !['current', 'outdated', 'pending', 'missing'].includes(translation.status)) {
          issues.push(`translation ${lang}: invalid status ${translation.status}`);
        }
      }
    }

    if (issues.length > 0) {
      console.log(`  ❌ ${canonicalId}: ${issues.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${canonicalId}: complete`);
    }
  }

  return allPassed;
}

/**
 * Test path consistency
 */
function testPathConsistency(registry) {
  console.log('\n📁 Testing path consistency...');

  let allPassed = true;
  const usedPaths = new Set();

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    // Check original path uniqueness
    if (usedPaths.has(entry.originalPath)) {
      console.log(`  ❌ ${canonicalId}: duplicate path ${entry.originalPath}`);
      allPassed = false;
    } else {
      usedPaths.add(entry.originalPath);
      console.log(`  ✅ ${canonicalId}: unique original path`);
    }

    // Check translation path uniqueness
    if (entry.translations) {
      for (const [lang, translation] of Object.entries(entry.translations)) {
        if (usedPaths.has(translation.path)) {
          console.log(`  ❌ ${canonicalId}: duplicate translation path ${translation.path} (${lang})`);
          allPassed = false;
        } else {
          usedPaths.add(translation.path);
        }
      }
    }
  }

  return allPassed;
}

/**
 * Test translation relationships
 */
function testTranslationRelationships(registry) {
  console.log('\n🌐 Testing translation relationships...');

  let allPassed = true;

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    if (!entry.translations || Object.keys(entry.translations).length === 0) {
      console.log(`  ⚠️  ${canonicalId}: no translations`);
      continue;
    }

    const translationCount = Object.keys(entry.translations).length;
    const currentCount = Object.values(entry.translations).filter((t) => t.status === 'current').length;

    console.log(`  ✅ ${canonicalId}: ${currentCount}/${translationCount} current translations`);

    // Check for language conflicts
    if (entry.translations[entry.originalLanguage]) {
      console.log(`  ❌ ${canonicalId}: self-translation detected (${entry.originalLanguage})`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Generate registry statistics
 */
function generateStatistics(registry) {
  console.log('\n📊 Registry Statistics:');

  const totalEntries = Object.keys(registry.entries).length;
  const languageDistribution = {};
  const statusDistribution = {};
  let totalTranslations = 0;

  for (const entry of Object.values(registry.entries)) {
    // Language distribution
    languageDistribution[entry.originalLanguage] = (languageDistribution[entry.originalLanguage] || 0) + 1;

    // Translation statistics
    if (entry.translations) {
      for (const translation of Object.values(entry.translations)) {
        totalTranslations++;
        statusDistribution[translation.status] = (statusDistribution[translation.status] || 0) + 1;
      }
    }
  }

  console.log(`  📈 Total entries: ${totalEntries}`);
  console.log(`  📈 Total translations: ${totalTranslations}`);

  console.log('  📈 Language distribution:');
  for (const [lang, count] of Object.entries(languageDistribution)) {
    console.log(`     ${lang}: ${count} entries`);
  }

  console.log('  📈 Translation status distribution:');
  for (const [status, count] of Object.entries(statusDistribution)) {
    console.log(`     ${status}: ${count} translations`);
  }
}

/**
 * Main validation execution
 */
function main() {
  console.log('🧪 Content Registry Validation\n');
  console.log('='.repeat(50));

  // Load registry
  const registry = loadRegistry();
  if (!registry) {
    console.error('❌ Cannot proceed without content registry');
    process.exit(1);
  }

  // Run all tests
  const tests = [
    { name: 'Registry Structure', fn: () => testRegistryStructure(registry) },
    { name: 'Canonical ID Formats', fn: () => testCanonicalIds(registry) },
    { name: 'Entry Completeness', fn: () => testEntryCompleteness(registry) },
    { name: 'Path Consistency', fn: () => testPathConsistency(registry) },
    { name: 'Translation Relationships', fn: () => testTranslationRelationships(registry) },
  ];

  const results = [];

  for (const test of tests) {
    const passed = test.fn();
    results.push({ name: test.name, passed });
  }

  // Generate statistics
  generateStatistics(registry);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 Validation Results Summary:\n');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.name}`);
  });

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All validation tests passed! Registry is healthy.');
    process.exit(0);
  } else {
    console.log('🚨 Some validation tests failed. Please review and fix issues.');
    process.exit(1);
  }
}

// Execute
main();
