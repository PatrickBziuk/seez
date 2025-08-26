/**
 * Project Links Utility - Maps project names to content URLs
 * Provides functionality to link mentioned projects in about pages to actual content
 */

import { getCollection } from 'astro:content';
import { getLocalizedUrl } from '~/utils/i18n';

export interface ProjectLink {
  name: string;
  url: string | null;
  exists: boolean;
  description?: string;
}

// Project mapping - maps common project names to their content slugs
const PROJECT_MAPPINGS: Record<string, { slug: string; emoji: string }> = {
  'cosensai': { slug: 'cosensai', emoji: '🧠' },
  'circles.': { slug: 'circles', emoji: '🫂' },
  'circles': { slug: 'circles', emoji: '🫂' },
  'marken.': { slug: 'marken', emoji: '👕' },
  'marken': { slug: 'marken', emoji: '👕' },
  'leagueoffun': { slug: 'leagueoffun', emoji: '🎮' },
};

/**
 * Get project link for a given project name and language
 */
export async function getProjectLink(
  projectName: string, 
  language: 'en' | 'de' = 'en'
): Promise<ProjectLink> {
  const mapping = PROJECT_MAPPINGS[projectName.toLowerCase()];
  
  if (!mapping) {
    return {
      name: projectName,
      url: null,
      exists: false,
    };
  }

  try {
    // Get all projects
    const projects = await getCollection('projects');
    
    // Find the project in the specified language
    const project = projects.find(p => 
      p.id.includes(mapping.slug) && 
      p.data.language === language
    );

    if (project) {
      const url = getLocalizedUrl(`/projects/${project.id.replace(`${language}/`, '')}`, language);
      return {
        name: `${mapping.emoji} ${projectName}`,
        url,
        exists: true,
        description: project.data.subtitle || project.data.title,
      };
    }

    // If not found in specified language, try the other language
    const fallbackLang = language === 'en' ? 'de' : 'en';
    const fallbackProject = projects.find(p => 
      p.id.includes(mapping.slug) && 
      p.data.language === fallbackLang
    );

    if (fallbackProject) {
      const url = getLocalizedUrl(`/projects/${fallbackProject.id.replace(`${fallbackLang}/`, '')}`, fallbackLang);
      return {
        name: `${mapping.emoji} ${projectName}`,
        url,
        exists: true,
        description: `${fallbackProject.data.subtitle || fallbackProject.data.title} (${fallbackLang.toUpperCase()})`,
      };
    }

    return {
      name: projectName,
      url: null,
      exists: false,
    };
  } catch (error) {
    console.error('Error getting project link:', error);
    return {
      name: projectName,
      url: null,
      exists: false,
    };
  }
}

/**
 * Get all project links for a list of project names
 */
export async function getProjectLinks(
  projectNames: string[], 
  language: 'en' | 'de' = 'en'
): Promise<ProjectLink[]> {
  const links = await Promise.all(
    projectNames.map(name => getProjectLink(name, language))
  );
  return links;
}

/**
 * Replace project names in text with markdown links
 */
export async function enhanceTextWithProjectLinks(
  text: string, 
  language: 'en' | 'de' = 'en'
): Promise<string> {
  let enhancedText = text;
  
  // Extract project names from the mappings
  const projectNames = Object.keys(PROJECT_MAPPINGS);
  
  for (const projectName of projectNames) {
    const link = await getProjectLink(projectName, language);
    
    if (link.exists && link.url) {
      // Create a regex to find project names (case insensitive, word boundaries)
      const regex = new RegExp(`\\b${projectName.replace('.', '\\.')}\\b`, 'gi');
      
      // Replace with markdown link, preserving the original case
      enhancedText = enhancedText.replace(regex, (_match) => {
        return `[${link.name}](${link.url})`;
      });
    }
  }
  
  return enhancedText;
}

/**
 * Extract mentioned projects from about page content
 */
export function extractMentionedProjects(content: string): string[] {
  const projectNames = Object.keys(PROJECT_MAPPINGS);
  const mentioned: string[] = [];
  
  for (const projectName of projectNames) {
    const regex = new RegExp(`\\b${projectName.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(content)) {
      mentioned.push(projectName);
    }
  }
  
  return mentioned;
}
