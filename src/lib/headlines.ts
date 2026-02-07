/**
 * Headline fetching from RSS feeds and APIs
 * Implements caching to minimize external calls
 */

import { RealHeadline, HeadlineSource, CachedHeadlines } from '@/types/game';
import { sanitizeText, isValidUrl } from './security';
import { MOCK_HEADLINES } from './mock-headlines';

// In-memory cache (in production, use Redis or similar)
const headlineCache = new Map<string, CachedHeadlines>();

// Default headline sources
export const DEFAULT_SOURCES: HeadlineSource[] = [
  {
    type: 'rss',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    category: 'news',
    enabled: true,
  },
  {
    type: 'rss',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
    enabled: true,
  },
  {
    type: 'rss',
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/',
    category: 'news',
    enabled: true,
  },
];

// Cache duration (1 hour)
const CACHE_DURATION_MS = 60 * 60 * 1000;

/**
 * Fetch headlines from RSS feed
 */
async function fetchRSSHeadlines(source: HeadlineSource): Promise<RealHeadline[]> {
  try {
    const response = await fetch(source.url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Failed to fetch RSS from ${source.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const headlines = parseRSS(xml, source);
    
    return headlines;
  } catch (error) {
    console.error(`Error fetching RSS from ${source.name}:`, error);
    return [];
  }
}

/**
 * Parse RSS XML to extract headlines
 * Basic implementation - in production, use a proper RSS parser library
 */
function parseRSS(xml: string, source: HeadlineSource): RealHeadline[] {
  const headlines: RealHeadline[] = [];
  
  // Simple regex-based parsing (use xml2js or similar in production)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  
  let match;
  let count = 0;
  
  while ((match = itemRegex.exec(xml)) !== null && count < 20) {
    const item = match[1];
    
    const titleMatch = item.match(titleRegex);
    const linkMatch = item.match(linkRegex);
    const pubDateMatch = item.match(pubDateRegex);
    
    if (titleMatch && linkMatch) {
      const title = sanitizeText(titleMatch[1] || titleMatch[2] || '');
      const url = linkMatch[1]?.trim() || '';
      
      if (title && isValidUrl(url)) {
        headlines.push({
          id: `${source.name}_${count}_${Date.now()}`,
          text: title,
          source: source.name,
          url: url,
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          category: source.category,
        });
        count++;
      }
    }
  }
  
  return headlines;
}

/**
 * Get cached headlines or fetch new ones
 */
export async function getHeadlines(
  sources: HeadlineSource[] = DEFAULT_SOURCES,
  forceRefresh: boolean = false
): Promise<RealHeadline[]> {
  const now = Date.now();
  const allHeadlines: RealHeadline[] = [];
  
  for (const source of sources.filter(s => s.enabled)) {
    const cacheKey = source.url;
    const cached = headlineCache.get(cacheKey);
    
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && cached && now < cached.expiresAt.getTime()) {
      allHeadlines.push(...cached.headlines);
      continue;
    }
    
    // Fetch new headlines
    let headlines: RealHeadline[] = [];
    
    try {
      if (source.type === 'rss') {
        headlines = await fetchRSSHeadlines(source);
      }
      // Add more source types here (API, etc.)
    } catch (error) {
      console.error(`Failed to fetch from ${source.name}:`, error);
    }
    
    // Update cache if successful
    if (headlines.length > 0) {
      headlineCache.set(cacheKey, {
        source: source.name,
        headlines,
        fetchedAt: new Date(now),
        expiresAt: new Date(now + CACHE_DURATION_MS),
      });
      allHeadlines.push(...headlines);
    }
  }
  
  // Fallback to mock headlines if no real ones available
  if (allHeadlines.length < 2) {
    console.log('Using mock headlines as fallback');
    return MOCK_HEADLINES;
  }
  
  return allHeadlines;
}

/**
 * Get a random selection of headlines
 */
export function selectRandomHeadlines(
  headlines: RealHeadline[],
  count: number,
  seed?: string
): RealHeadline[] {
  if (headlines.length === 0) {
    return [];
  }
  
  // Fisher-Yates shuffle
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

/**
 * Clear cache (for testing or manual refresh)
 */
export function clearHeadlineCache(): void {
  headlineCache.clear();
}
