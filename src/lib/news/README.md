# News Ingestion Module

This module provides robust RSS feed ingestion from reputable Canadian news sources.

## Features

- **6 Canadian News Sources**: CBC News (2 feeds), Global News, CTV News, The Globe and Mail, Toronto Star
- **RSS Parsing**: Uses `rss-parser` library for reliable XML parsing
- **Deduplication**: Removes duplicate headlines by normalized title and URL
- **Filtering**: Removes short titles, odd characters, and similar headlines
- **Deterministic Selection**: Same seed always returns same results
- **Caching**: Next.js fetch cache + internal memoization
- **Error Handling**: Failed sources don't stop processing
- **Age Filtering**: Filter headlines by maximum age in hours

## Usage

```typescript
import { getRealHeadlines } from '@/lib/news';

// Fetch 10 recent headlines with a specific seed
const headlines = await getRealHeadlines(10, 'daily-seed-2026-02-07', 24);

// Each headline has:
// {
//   id: string,
//   title: string,
//   source: string,
//   url: string,
//   publishedAt: Date
// }
```

## API

### `getRealHeadlines(count, seed, maxAgeHours)`

Fetches real news headlines with filtering and deduplication.

**Parameters:**
- `count` (number): Number of headlines to return
- `seed` (string): Seed for deterministic randomization
- `maxAgeHours` (number, default: 24): Maximum age of headlines in hours

**Returns:** `Promise<HeadlineItem[]>`

### `clearCache()`

Clears the internal headline cache (useful for testing).

## Implementation Details

### RSS Sources

All sources are configured in `sources.ts` with:
- Name (display name)
- RSS URL (feed endpoint)
- Category (general, world, canada, news)

### Processing Pipeline

1. **Fetch**: Parallel fetch from all sources (Promise.allSettled)
2. **Age Filter**: Remove headlines older than maxAgeHours
3. **Deduplicate**: Remove duplicates by normalized title and URL
4. **Similarity Filter**: Remove overly similar headlines (70% threshold)
5. **Sort**: Order by published date (newest first)
6. **Shuffle**: Deterministic shuffle using seed
7. **Cache**: Store results for 30 minutes

### Filtering Rules

Headlines are filtered out if they:
- Are less than 10 characters long
- Have more than 30% special characters
- Have excessive uppercase (>50% in titles >20 chars)
- Contain control or non-printable characters
- Are too similar to already selected headlines

### Caching Strategy

**Two-level caching:**
1. **Next.js fetch cache**: 1 hour revalidation on RSS fetch
2. **Internal memoization**: 30 minutes on processed results

Cache key format: `{seed}-{maxAgeHours}`

## Error Handling

- Individual source failures don't stop processing
- All errors are logged but don't throw
- Graceful degradation to available sources
- Fallback to mock headlines in parent module if needed

## Notes

- All Canadian news sources provide public RSS feeds (no scraping)
- Sources were selected for reliability and consistent RSS format
- Deduplication handles variations in title formatting
- Similarity detection prevents repetitive headlines
- Seeded randomization ensures reproducible results for testing
