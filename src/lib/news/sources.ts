/**
 * Canadian News Sources Configuration
 * Reputable sources with RSS feeds for reliable news ingestion
 */

export interface NewsSource {
  name: string;
  rssUrl: string;
  category?: string;
}

/**
 * List of reputable Canadian news sources with RSS feeds
 * Selected for reliability, consistent RSS format, and comprehensive coverage
 */
export const CANADIAN_NEWS_SOURCES: NewsSource[] = [
  {
    name: 'CBC News',
    rssUrl: 'https://www.cbc.ca/webfeed/rss/rss-topstories',
    category: 'general',
  },
  {
    name: 'CBC News - World',
    rssUrl: 'https://www.cbc.ca/webfeed/rss/rss-world',
    category: 'world',
  },
  {
    name: 'Global News',
    rssUrl: 'https://globalnews.ca/feed/',
    category: 'general',
  },
  {
    name: 'CTV News',
    rssUrl: 'https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009',
    category: 'general',
  },
  {
    name: 'The Globe and Mail',
    rssUrl: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/',
    category: 'canada',
  },
  {
    name: 'Toronto Star',
    rssUrl: 'https://www.thestar.com/search/?f=rss&t=article&c=news*&l=50&s=start_time&sd=desc',
    category: 'news',
  },
];
