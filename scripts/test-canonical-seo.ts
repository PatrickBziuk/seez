#!/usr/bin/env tsx

/**
 * Canonical SEO Testing and Validation Script
 * @purpose Test canonical URL generation and SEO metadata integration
 * @dependencies canonical-urls.ts, content registry
 * @usedBy Development testing and CI validation
 */

import { 
  getCanonicalUrl, 
  getLanguageVersions, 
  getHreflangData, 
  getCanonicalIdFromPath,
  validateCanonicalUrls 
} from '../src/utils/canonical-urls';
import { readFileSync, existsSync } from 'fs';

interface Translation {
  status: 'current' | 'outdated' | 'pending';
  path: string;
  timestamp?: string;
}

interface RegistryEntry {
  title: string;
  language: 'en' | 'de';
  originalPath: string;
  translations?: { [lang: string]: Translation };
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: { [canonicalId: string]: RegistryEntry };
}

/**
 * Load content registry for testing
 */
function loadRegistry(): ContentRegistry | null {
  const registryPath = 'data/content-registry.json';
  
  if (!existsSync(registryPath)) {
    console.error('❌ Content registry not found:', registryPath);
    return null;
  }
  
  try {
    const content = readFileSync(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to load registry:', error);
    return null;
  }
}

/**
 * Test canonical URL generation for all entries
 */
function testCanonicalUrls(registry: ContentRegistry): boolean {
  console.log('\n🔗 Testing canonical URL generation...');
  
  let allPassed = true;
  
  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    console.log(`\n📄 Testing ${canonicalId}: ${entry.title}`);
    
    // Test original language URL
    const originalUrl = getCanonicalUrl(canonicalId, entry.language);
    if (originalUrl) {
      console.log(`  ✅ Original (${entry.language}): ${originalUrl}`);
    } else {
      console.log(`  ❌ Failed to generate original URL for ${entry.language}`);
      allPassed = false;
    }
    
    // Test translation URLs
    for (const [lang, translation] of Object.entries(entry.translations || {})) {
      if (translation.status === 'current') {
        const translationUrl = getCanonicalUrl(canonicalId, lang as 'en' | 'de');
        if (translationUrl) {
          console.log(`  ✅ Translation (${lang}): ${translationUrl}`);
        } else {
          console.log(`  ❌ Failed to generate translation URL for ${lang}`);
          allPassed = false;
        }
      } else {
        console.log(`  ⚠️  Translation (${lang}): ${translation.status}`);
      }
    }
  }
  
  return allPassed;
}

/**
 * Test hreflang data generation
 */
function testHreflangData(registry: ContentRegistry): boolean {
  console.log('\n🌐 Testing hreflang data generation...');
  
  let allPassed = true;
  
  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    console.log(`\n📄 Testing hreflang for ${canonicalId}: ${entry.title}`);
    
    const hreflangData = getHreflangData(canonicalId);
    
    if (hreflangData.length === 0) {
      console.log('  ⚠️  No hreflang data generated');
      continue;
    }
    
    for (const item of hreflangData) {
      if (item.href && item.hreflang) {
        console.log(`  ✅ ${item.hreflang}: ${item.href}`);
      } else {
        console.log(`  ❌ Invalid hreflang data:`, item);
        allPassed = false;
      }
    }
  }
  
  return allPassed;
}

/**
 * Test language version detection
 */
function testLanguageVersions(registry: ContentRegistry): boolean {
  console.log('\n🔄 Testing language version detection...');
  
  let allPassed = true;
  
  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    console.log(`\n📄 Testing versions for ${canonicalId}: ${entry.title}`);
    
    const versions = getLanguageVersions(canonicalId);
    
    if (versions.length === 0) {
      console.log('  ❌ No language versions detected');
      allPassed = false;
      continue;
    }
    
    for (const version of versions) {
      const status = version.available ? '✅' : '⚠️';
      console.log(`  ${status} ${version.language}: ${version.url} (available: ${version.available})`);
    }
  }
  
  return allPassed;
}

/**
 * Test reverse lookup (path to canonical ID)
 */
function testReverseLookup(registry: ContentRegistry): boolean {
  console.log('\n🔍 Testing reverse lookup (path → canonical ID)...');
  
  let allPassed = true;
  
  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    // Test original path lookup
    const foundId = getCanonicalIdFromPath(entry.originalPath);
    if (foundId === canonicalId) {
      console.log(`  ✅ ${entry.originalPath} → ${canonicalId}`);
    } else {
      console.log(`  ❌ ${entry.originalPath} → ${foundId} (expected: ${canonicalId})`);
      allPassed = false;
    }
    
    // Test translation path lookups
    for (const [_lang, translation] of Object.entries(entry.translations || {})) {
      const translationFoundId = getCanonicalIdFromPath(translation.path);
      if (translationFoundId === canonicalId) {
        console.log(`  ✅ ${translation.path} → ${canonicalId}`);
      } else {
        console.log(`  ❌ ${translation.path} → ${translationFoundId} (expected: ${canonicalId})`);
        allPassed = false;
      }
    }
  }
  
  return allPassed;
}

/**
 * Test SEO metadata completeness
 */
function testSEOMetadata(registry: ContentRegistry): boolean {
  console.log('\n📊 Testing SEO metadata completeness...');
  
  let allPassed = true;
  const missingData: string[] = [];
  
  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    const issues: string[] = [];
    
    // Check required fields
    if (!entry.title) issues.push('missing title');
    if (!entry.language) issues.push('missing language');
    if (!entry.originalPath) issues.push('missing originalPath');
    
    // Check canonical URL generation
    const canonicalUrl = getCanonicalUrl(canonicalId, entry.language);
    if (!canonicalUrl) issues.push('canonical URL generation failed');
    
    // Check hreflang data
    const hreflangData = getHreflangData(canonicalId);
    if (hreflangData.length === 0) issues.push('no hreflang data');
    
    if (issues.length > 0) {
      console.log(`  ❌ ${canonicalId}: ${issues.join(', ')}`);
      missingData.push(`${canonicalId}: ${issues.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${canonicalId}: complete`);
    }
  }
  
  if (missingData.length > 0) {
    console.log('\n🚨 SEO Metadata Issues:');
    missingData.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return allPassed;
}

/**
 * Performance test for canonical URL operations
 */
function testPerformance(registry: ContentRegistry): void {
  console.log('\n⚡ Performance testing...');
  
  const canonicalIds = Object.keys(registry.entries);
  const iterations = 100;
  
  // Test canonical URL generation performance
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    for (const canonicalId of canonicalIds) {
      getCanonicalUrl(canonicalId);
      getHreflangData(canonicalId);
      getLanguageVersions(canonicalId);
    }
  }
  
  const end = performance.now();
  const totalOps = iterations * canonicalIds.length * 3; // 3 operations per canonical ID
  const avgTime = (end - start) / totalOps;
  
  console.log(`  📈 Executed ${totalOps} operations in ${(end - start).toFixed(2)}ms`);
  console.log(`  📈 Average time per operation: ${avgTime.toFixed(4)}ms`);
  
  if (avgTime < 1) {
    console.log('  ✅ Performance: Excellent (< 1ms per operation)');
  } else if (avgTime < 5) {
    console.log('  ✅ Performance: Good (< 5ms per operation)');
  } else {
    console.log('  ⚠️  Performance: Needs optimization (> 5ms per operation)');
  }
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  console.log('🧪 Canonical SEO System Validation\n');
  console.log('='.repeat(50));
  
  // Load registry
  const registry = loadRegistry();
  if (!registry) {
    console.error('❌ Cannot proceed without content registry');
    process.exit(1);
  }
  
  console.log(`📊 Testing ${Object.keys(registry.entries).length} canonical entries`);
  console.log(`📅 Registry last updated: ${registry.lastUpdated}`);
  
  // Run all tests
  const tests = [
    { name: 'Canonical URLs', fn: () => testCanonicalUrls(registry) },
    { name: 'Hreflang Data', fn: () => testHreflangData(registry) },
    { name: 'Language Versions', fn: () => testLanguageVersions(registry) },
    { name: 'Reverse Lookup', fn: () => testReverseLookup(registry) },
    { name: 'SEO Metadata', fn: () => testSEOMetadata(registry) },
  ];
  
  const results: { name: string; passed: boolean }[] = [];
  
  for (const test of tests) {
    const passed = test.fn();
    results.push({ name: test.name, passed });
  }
  
  // Performance test (non-critical)
  testPerformance(registry);
  
  // System integrity validation
  console.log('\n🔧 System integrity validation...');
  const validation = validateCanonicalUrls();
  
  if (validation.valid) {
    console.log('  ✅ System integrity: All checks passed');
  } else {
    console.log('  ❌ System integrity issues found:');
    validation.errors.forEach(error => console.log(`     - ${error}`));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 Test Results Summary:\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total && validation.valid) {
    console.log('🎉 All tests passed! Canonical SEO system is fully operational.');
    process.exit(0);
  } else {
    console.log('🚨 Some tests failed. Please review and fix issues before deployment.');
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}
