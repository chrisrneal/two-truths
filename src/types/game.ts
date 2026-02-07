/**
 * Core data models for Two Truths and a Lie: Internet Edition
 */

// Headline from external source (RSS/API)
export interface RealHeadline {
  id: string;
  text: string;
  source: string;
  url: string;
  publishedAt: Date;
  category?: string;
}

// AI-generated fake headline
export interface FakeHeadline {
  id: string;
  text: string;
  explanation: string; // Why it's fake
  basedOn?: string[]; // Sources that inspired it
}

// Combined headline type for game rounds
export interface GameHeadline {
  id: string;
  text: string;
  isFake: boolean;
  source?: string;
  url?: string;
  explanation?: string;
}

// A single game round
export interface Round {
  id: string;
  seed: string; // Daily seed for reproducibility
  headlines: GameHeadline[];
  correctAnswerId: string; // ID of the fake headline
  startedAt?: Date;
}

// User's answer to a round
export interface RoundAnswer {
  roundId: string;
  selectedHeadlineId: string;
  timeToAnswer: number; // milliseconds
  confidence?: 'low' | 'medium' | 'high'; // inferred from speed
}

// Scoring result for a round
export interface RoundResult {
  correct: boolean;
  selectedHeadline: GameHeadline;
  correctHeadline: GameHeadline;
  explanation: string;
  points: number;
  timeBonus: number;
  confidencePenalty: number;
  streakBonus: number;
}

// Overall game state
export interface GameState {
  sessionId: string;
  seed: string; // Today's seed
  currentRound: number;
  totalRounds: number;
  score: number;
  streak: number;
  maxStreak: number;
  rounds: RoundResult[];
  startedAt: Date;
  completedAt?: Date;
}

// Scoring configuration
export interface ScoringConfig {
  basePoints: number;
  streakMultiplier: number;
  timePressureThreshold: number; // ms
  confidencePenaltyThreshold: number; // ms - too fast = penalty
  maxTimeBonus: number;
}

// External API configuration
export interface HeadlineSource {
  type: 'rss' | 'api';
  name: string;
  url: string;
  category?: string;
  enabled: boolean;
}

// Cache entry for fetched headlines
export interface CachedHeadlines {
  source: string;
  headlines: RealHeadline[];
  fetchedAt: Date;
  expiresAt: Date;
}

// Share data structure
export interface ShareData {
  seed: string;
  score: number;
  totalRounds: number;
  maxStreak: number;
  completedAt: Date;
}
