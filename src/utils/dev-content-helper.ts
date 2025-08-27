/**
 * Development Content Helper - Auto-generates canonical IDs for content missing them
 * Simplifies local development workflow while ensuring production readiness
 */

import { randomBytes } from 'crypto';

/**
 * Generate a ULID-like ID for development use
 */
export function generateDevCanonicalId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `DEV_${timestamp}_${random}`;
}

/**
 * Auto-generate canonical ID if missing in development
 */
export function ensureCanonicalId(frontmatter: { canonicalId?: string; title?: string }): string {
  if (frontmatter.canonicalId) {
    return frontmatter.canonicalId;
  }

  // In development, auto-generate if missing
  if (import.meta.env.DEV) {
    const devId = generateDevCanonicalId();
    console.log(`🔧 Auto-generated canonical ID for "${frontmatter.title}": ${devId}`);
    return devId;
  }

  // In production, this should not happen due to schema validation
  throw new Error(`Missing canonical ID for content: ${frontmatter.title}`);
}

/**
 * Get content URL strategy based on environment
 */
export function getContentUrlStrategy() {
  return {
    useCanonicalIds: import.meta.env.PROD && process.env.USE_CANONICAL_URLS === 'true',
    useHumanReadable: true, // Always available
    redirectCanonicalIds: import.meta.env.PROD, // Only redirect in production
  };
}
