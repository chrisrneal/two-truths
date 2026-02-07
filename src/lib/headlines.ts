/**
 * Headline fetching from RSS feeds and APIs
 * Implements caching to minimize external calls
 * 
 * This module now uses the new news ingestion system (lib/news/)
 * for improved Canadian news source coverage with robust RSS parsing
 */

import { RealHeadline } from '@/types/game';
import { MOCK_HEADLINES } from './mock-headlines';
import { getRealHeadlines as getNewsHeadlines, HeadlineItem } from './news/fetchRss';

// Re-export for backward compatibility
export { clearCache as clearHeadlineCache } from './news/fetchRss';

/**
 * Convert HeadlineItem from news module to RealHeadline for game use
 */
function convertToRealHeadline(item: HeadlineItem): RealHeadline {
  return {
    id: item.id,
    text: item.title,
    source: item.source,
    url: item.url,
    publishedAt: item.publishedAt,
    category: 'news',
  };
}

/**
 * Get headlines using the new news ingestion system
 * Fetches from Canadian news sources with deduplication and filtering
 * 
 * @param count Number of headlines to fetch (default: 20)
 * @param seed Seed for deterministic selection (default: current date)
 * @param maxAgeHours Maximum age of headlines in hours (default: 24)
 * @returns Array of real headlines with fallback to mock data
 */
export async function getHeadlines(
  count: number = 20,
  seed?: string,
  maxAgeHours: number = 24
): Promise<RealHeadline[]> {
  try {
    // Use today's date as seed if not provided
    const headlineSeed = seed || new Date().toISOString().split('T')[0];
    
    // Fetch headlines using new news ingestion module
    const newsItems = await getNewsHeadlines(count, headlineSeed, maxAgeHours);
    
    // Convert to RealHeadline format
    const headlines = newsItems.map(convertToRealHeadline);
    
    // Fallback to mock headlines if insufficient real ones
    if (headlines.length < 2) {
      console.log('Using mock headlines as fallback');
      return MOCK_HEADLINES;
    }
    
    return headlines;
  } catch (error) {
    console.error('Error fetching headlines:', error);
    // Fallback to mock headlines on error
    return MOCK_HEADLINES;
  }
}

/**
 * Get a random selection of headlines
 * This function is kept for backward compatibility
 */
export function selectRandomHeadlines(
  headlines: RealHeadline[],
  count: number,
  seed?: string
): RealHeadline[] {
  if (headlines.length === 0) {
    return [];
  }
  
  // Fisher-Yates shuffle with optional seed
  const result = [...headlines];
  const rng = seed ? seededRandom(seed) : (() => Math.random());
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result.slice(0, Math.min(count, result.length));
}

/**
 * Simple seeded random number generator for reproducibility
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}
