import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

interface VersionInfo {
  version: string;
  commitSha: string;
  commitCount: number;
  buildDate: string;
  branch: string;
}

function generateVersion(): VersionInfo {
  try {
    // Get current commit SHA (short)
    const commitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    // Get commit count from initial commit
    const commitCount = parseInt(execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim());

    // Get current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    // Get package version as base
    const packageVersion = process.env.npm_package_version || '1.0.0';

    // Generate version: baseVersion.commitCount+shortSha
    const version = `${packageVersion}.${commitCount}+${commitSha}`;

    const buildDate = new Date().toISOString();

    const versionInfo: VersionInfo = {
      version,
      commitSha,
      commitCount,
      buildDate,
      branch,
    };

    // Write to file for build process
    writeFileSync('src/generated/version.json', JSON.stringify(versionInfo, null, 2));
    console.log(`Generated version: ${version} (${commitSha})`);

    return versionInfo;
  } catch (error) {
    console.error('Error generating version:', error);
    // Fallback version for development
    const fallbackVersion: VersionInfo = {
      version: 'dev',
      commitSha: 'dev',
      commitCount: 0,
      buildDate: new Date().toISOString(),
      branch: 'dev',
    };
    writeFileSync('src/generated/version.json', JSON.stringify(fallbackVersion, null, 2));
    return fallbackVersion;
  }
}

// Export for use in other scripts
export { generateVersion, type VersionInfo };

// Run if called directly
generateVersion();
