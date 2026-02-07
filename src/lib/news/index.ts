/**
 * News Ingestion Module - Main Export
 * Provides clean API for fetching real news headlines
 */

export { getRealHeadlines, clearCache, type HeadlineItem } from './fetchRss';
export { CANADIAN_NEWS_SOURCES, type NewsSource } from './sources';
