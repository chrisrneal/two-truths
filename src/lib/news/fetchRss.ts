/**
 * News Ingestion Module - RSS Fetching and Processing
 * Fetches, parses, deduplicates, and filters news headlines from RSS feeds
 */

import Parser from 'rss-parser';
import { NewsSource, CANADIAN_NEWS_SOURCES } from './sources';

// Normalized headline item structure
export interface HeadlineItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
}

// Cache structure for memoization
interface CacheEntry {
  headlines: HeadlineItem[];
  timestamp: number;
}

// In-memory cache for headlines (key: seed-maxAgeHours)
const headlineCache = new Map<string, CacheEntry>();

// RSS parser instance
const parser = new Parser({
  timeout: 10000, // 10 second timeout
  headers: {
    'User-Agent': 'TwoTruthsAndALie/1.0',
  },
});

/**
 * Fetch and parse RSS feed from a single source
 * Returns empty array on failure (robust error handling)
 */
async function fetchSingleSource(source: NewsSource): Promise<HeadlineItem[]> {
  try {
    // Use Next.js fetch with revalidation for built-in caching
    const response = await fetch(source.rssUrl, {
      next: { 
        revalidate: 3600, // Cache for 1 hour
        tags: ['news-rss'] 
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${source.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    // Parse and normalize items
    const headlines: HeadlineItem[] = [];
    
    for (const item of feed.items || []) {
      const title = item.title?.trim();
      const url = item.link?.trim();
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      if (title && url && isValidHeadline(title)) {
        headlines.push({
          id: generateId(source.name, url),
          title,
          source: source.name,
          url,
          publishedAt,
        });
      }
    }

    return headlines;
  } catch (error) {
    // Robust error handling - log and continue with other sources
    console.error(`Error fetching ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Fetch headlines from all sources with fallback handling
 */
async function fetchAllSources(sources: NewsSource[] = CANADIAN_NEWS_SOURCES): Promise<HeadlineItem[]> {
  // Fetch all sources in parallel for better performance
  const results = await Promise.allSettled(
    sources.map(source => fetchSingleSource(source))
  );

  // Combine all successful results
  const allHeadlines: HeadlineItem[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allHeadlines.push(...result.value);
    }
  }

  return allHeadlines;
}

/**
 * Deduplicate headlines by normalized title and URL
 */
function deduplicateHeadlines(headlines: HeadlineItem[]): HeadlineItem[] {
  const seen = new Set<string>();
  const deduped: HeadlineItem[] = [];

  for (const headline of headlines) {
    // Create deduplication key from normalized title and URL
    const normalizedTitle = normalizeTitle(headline.title);
    const key = `${normalizedTitle}|${headline.url}`;

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(headline);
    }
  }

  return deduped;
}

/**
 * Normalize title for comparison (lowercase, remove punctuation, trim whitespace)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate similarity between two strings using simple word overlap
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeTitle(str1).split(' '));
  const words2 = new Set(normalizeTitle(str2).split(' '));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Remove overly similar headlines (keep first occurrence)
 */
function filterSimilarHeadlines(headlines: HeadlineItem[], threshold: number = 0.7): HeadlineItem[] {
  const filtered: HeadlineItem[] = [];

  for (const headline of headlines) {
    let isSimilar = false;
    
    for (const existing of filtered) {
      const similarity = calculateSimilarity(headline.title, existing.title);
      if (similarity >= threshold) {
        isSimilar = true;
        break;
      }
    }

    if (!isSimilar) {
      filtered.push(headline);
    }
  }

  return filtered;
}

/**
 * Validate headline quality
 * Filter out: very short titles, titles with odd characters, invalid format
 */
function isValidHeadline(title: string): boolean {
  // Remove very short titles (less than 10 characters)
  if (title.length < 10) {
    return false;
  }

  // Remove titles with excessive special characters (more than 30%)
  const specialCharCount = (title.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (specialCharCount / title.length > 0.3) {
    return false;
  }

  // Remove titles with unusual character patterns
  // Check for excessive caps (more than 50% uppercase in titles longer than 20 chars)
  if (title.length > 20) {
    const upperCount = (title.match(/[A-Z]/g) || []).length;
    const letterCount = (title.match(/[a-zA-Z]/g) || []).length;
    if (letterCount > 0 && upperCount / letterCount > 0.5) {
      return false;
    }
  }

  // Remove titles with control characters or non-printable characters
  if (/[\x00-\x1F\x7F-\x9F]/.test(title)) {
    return false;
  }

  return true;
}

/**
 * Filter headlines by age
 */
function filterByAge(headlines: HeadlineItem[], maxAgeHours: number): HeadlineItem[] {
  const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
  
  return headlines.filter(headline => 
    headline.publishedAt.getTime() >= cutoffTime
  );
}

/**
 * Generate stable ID from source and URL
 */
function generateId(source: string, url: string): string {
  // Simple hash function for generating consistent IDs
  let hash = 0;
  const str = `${source}:${url}`;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `headline_${Math.abs(hash)}`;
}

/**
 * Seeded random number generator for deterministic selection
 */
function createSeededRandom(seed: string): () => number {
  let hash = 0;
  
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

/**
 * Fisher-Yates shuffle with seeded random for deterministic results
 */
function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const result = [...array];
  const random = createSeededRandom(seed);
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Get real headlines with caching, deduplication, and filtering
 * 
 * @param count Number of headlines to return
 * @param seed Seed for deterministic randomization (ensures same results for same seed)
 * @param maxAgeHours Maximum age of headlines in hours (default: 24)
 * @returns Array of normalized headline items
 */
export async function getRealHeadlines(
  count: number,
  seed: string,
  maxAgeHours: number = 24
): Promise<HeadlineItem[]> {
  // Check cache first (memoization)
  const cacheKey = `${seed}-${maxAgeHours}`;
  const cached = headlineCache.get(cacheKey);
  const cacheValidityMs = 30 * 60 * 1000; // 30 minutes
  
  if (cached && Date.now() - cached.timestamp < cacheValidityMs) {
    // Return cached results (already shuffled and filtered)
    return cached.headlines.slice(0, count);
  }

  // Fetch from all sources
  const rawHeadlines = await fetchAllSources();

  // Apply filtering pipeline
  let headlines = rawHeadlines;
  
  // 1. Filter by age
  headlines = filterByAge(headlines, maxAgeHours);
  
  // 2. Deduplicate by normalized title and URL
  headlines = deduplicateHeadlines(headlines);
  
  // 3. Filter out similar headlines
  headlines = filterSimilarHeadlines(headlines);
  
  // 4. Sort by published date (newest first)
  headlines.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  
  // 5. Deterministic shuffle based on seed
  const shuffled = shuffleWithSeed(headlines, seed);
  
  // Cache the results
  headlineCache.set(cacheKey, {
    headlines: shuffled,
    timestamp: Date.now(),
  });
  
  // Return requested count
  return shuffled.slice(0, count);
}

/**
 * Clear the headline cache (useful for testing)
 */
export function clearCache(): void {
  headlineCache.clear();
}
