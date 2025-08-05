/**
 * Translation Override Utilities
 * @purpose Handle translation pause and override mechanisms
 * @dependencies yaml, fs
 * @usedBy Translation detection scripts
 */

import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';

/**
 * Override configuration structure
 */
interface TranslationOverrideConfig {
  global_pause: boolean;
  skip_translation_keys: string[];
  skip_file_paths: string[];
  temporary_overrides: {
    translation_key: string;
    expires: string;
    reason?: string;
  }[];
}

/**
 * Check if a global translation pause is active
 * @returns True if global pause is enabled
 */
export function isGlobalTranslationPaused(): boolean {
  // Check for TRANSLATION_PAUSE file
  if (existsSync('TRANSLATION_PAUSE')) {
    return true;
  }

  // Check override configuration
  const config = loadOverrideConfig();
  return config?.global_pause || false;
}

/**
 * Check if a specific translation key should be skipped
 * @param translationKey - The translation key to check
 * @param filePath - Optional file path to check
 * @returns True if translation should be skipped
 */
export function shouldSkipTranslation(translationKey: string, filePath?: string): boolean {
  if (isGlobalTranslationPaused()) {
    return true;
  }

  const config = loadOverrideConfig();
  if (!config) return false;

  // Check specific translation keys
  if (config.skip_translation_keys.includes(translationKey)) {
    return true;
  }

  // Check specific file paths
  if (
    filePath &&
    config.skip_file_paths.some((skipPath) => filePath.includes(skipPath) || filePath.endsWith(skipPath))
  ) {
    return true;
  }

  // Check temporary overrides
  const now = new Date();
  const activeOverride = config.temporary_overrides.find((override) => {
    const expires = new Date(override.expires);
    return override.translation_key === translationKey && expires > now;
  });

  return !!activeOverride;
}

/**
 * Load override configuration from file
 * @returns Parsed configuration or null if file doesn't exist
 */
function loadOverrideConfig(): TranslationOverrideConfig | null {
  const configPath = 'translation.override.yml';

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return parseYaml(content) as TranslationOverrideConfig;
  } catch (error) {
    console.warn(`Failed to parse ${configPath}:`, error);
    return null;
  }
}

/**
 * Get skip reason for a translation key
 * @param translationKey - The translation key to check
 * @param filePath - Optional file path to check
 * @returns Reason string if skipped, null otherwise
 */
export function getSkipReason(translationKey: string, filePath?: string): string | null {
  if (isGlobalTranslationPaused()) {
    return 'Global translation pause is active';
  }

  const config = loadOverrideConfig();
  if (!config) return null;

  if (config.skip_translation_keys.includes(translationKey)) {
    return `Translation key '${translationKey}' is in skip list`;
  }

  if (
    filePath &&
    config.skip_file_paths.some((skipPath) => filePath.includes(skipPath) || filePath.endsWith(skipPath))
  ) {
    return `File path '${filePath}' is in skip list`;
  }

  const now = new Date();
  const activeOverride = config.temporary_overrides.find((override) => {
    const expires = new Date(override.expires);
    return override.translation_key === translationKey && expires > now;
  });

  if (activeOverride) {
    return activeOverride.reason || `Temporary override until ${activeOverride.expires}`;
  }

  return null;
}
