/**
 * Reading Statistics Utilities
 * Calculates word count, reading time, and other content metrics
 */

// Average reading speeds (words per minute)
const READING_SPEEDS = {
  slow: 200, // Beginner/careful reader
  average: 250, // Most adults
  fast: 300, // Fast readers
} as const;

/**
 * Removes markdown formatting and extracts plain text for word counting
 */
export function extractPlainText(markdown: string): string {
  return (
    markdown
      // Remove frontmatter
      .replace(/^---[\s\S]*?---\n/m, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove markdown horizontal rules
      .replace(/^---+$/gm, '')
      // Remove blockquotes
      .replace(/^>\s*/gm, '')
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Counts words in text content
 */
export function getWordCount(text: string): number {
  const plainText = extractPlainText(text);
  if (!plainText) return 0;

  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Calculates reading time in minutes
 */
export function getReadingTime(
  wordCount: number,
  speed: keyof typeof READING_SPEEDS = 'average'
): {
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const wordsPerMinute = READING_SPEEDS[speed];
  const totalMinutes = wordCount / wordsPerMinute;
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);

  let formatted: string;
  if (minutes === 0) {
    formatted = '< 1 min';
  } else if (minutes === 1 && seconds < 30) {
    formatted = '1 min';
  } else if (seconds >= 30) {
    formatted = `${minutes + 1} min`;
  } else {
    formatted = `${minutes} min`;
  }

  return {
    minutes,
    seconds,
    formatted,
  };
}

/**
 * Calculates comprehensive reading statistics
 */
export function getReadingStats(content: string) {
  const wordCount = getWordCount(content);
  const readingTime = getReadingTime(wordCount);
  const plainText = extractPlainText(content);

  // Character count (excluding whitespace)
  const charCount = plainText.replace(/\s/g, '').length;

  // Paragraph count (approximate)
  const paragraphCount = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

  // Sentence count (approximate)
  const sentenceCount = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  return {
    wordCount,
    charCount,
    paragraphCount,
    sentenceCount,
    readingTime,
    plainTextLength: plainText.length,
    // Reading time variants
    readingTimes: {
      slow: getReadingTime(wordCount, 'slow'),
      average: getReadingTime(wordCount, 'average'),
      fast: getReadingTime(wordCount, 'fast'),
    },
  };
}

/**
 * Gets reading difficulty estimation based on average sentence and word length
 */
export function getReadingDifficulty(content: string): {
  level: 'easy' | 'medium' | 'hard';
  score: number;
  description: string;
} {
  const stats = getReadingStats(content);
  const avgWordsPerSentence = stats.wordCount / stats.sentenceCount;
  const avgCharsPerWord = stats.charCount / stats.wordCount;

  // Simple difficulty score (lower = easier)
  const score = avgWordsPerSentence * 0.6 + avgCharsPerWord * 2;

  if (score < 12) {
    return {
      level: 'easy',
      score,
      description: 'Easy to read, suitable for all audiences',
    };
  } else if (score < 16) {
    return {
      level: 'medium',
      score,
      description: 'Moderate complexity, standard reading level',
    };
  } else {
    return {
      level: 'hard',
      score,
      description: 'Complex content, requires focused attention',
    };
  }
}
