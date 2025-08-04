/**
 * Feature flags for controlled rollout of new features
 */
export const FEATURE_FLAGS = {
  SERVER_SIDE_LANGUAGE_DETECTION: true,
  LEGACY_CLIENT_REDIRECT: false,
  ENHANCED_SEO: true,
  GIT_METADATA: true
} as const;

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
