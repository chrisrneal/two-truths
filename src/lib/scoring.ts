/**
 * Scoring system with streak bonuses, time pressure, and confidence penalties
 */

import { RoundAnswer, RoundResult, ScoringConfig, GameHeadline } from '@/types/game';

export const DEFAULT_SCORING: ScoringConfig = {
  basePoints: 100,
  streakMultiplier: 1.5,
  timePressureThreshold: 10000, // 10 seconds
  confidencePenaltyThreshold: 2000, // 2 seconds (too fast)
  maxTimeBonus: 50,
};

/**
 * Calculate score for a round answer
 */
export function calculateRoundScore(
  answer: RoundAnswer,
  correctAnswerId: string,
  currentStreak: number,
  config: ScoringConfig = DEFAULT_SCORING
): RoundResult {
  const isCorrect = answer.selectedHeadlineId === correctAnswerId;
  
  let points = 0;
  let timeBonus = 0;
  let confidencePenalty = 0;
  let streakBonus = 0;
  
  if (isCorrect) {
    // Base points
    points = config.basePoints;
    
    // Time bonus (faster = more points, up to max)
    if (answer.timeToAnswer < config.timePressureThreshold) {
      const timeRatio = 1 - (answer.timeToAnswer / config.timePressureThreshold);
      timeBonus = Math.floor(config.maxTimeBonus * timeRatio);
      points += timeBonus;
    }
    
    // Confidence penalty (too fast = penalty)
    if (answer.timeToAnswer < config.confidencePenaltyThreshold) {
      confidencePenalty = Math.floor(config.basePoints * 0.3);
      points -= confidencePenalty;
    }
    
    // Streak bonus
    if (currentStreak > 0) {
      streakBonus = Math.floor(
        config.basePoints * (currentStreak * 0.1) // 10% per streak
      );
      points += streakBonus;
    }
    
    // Ensure minimum points
    points = Math.max(points, 10);
  }
  
  // Placeholder result - will be populated by game logic
  return {
    correct: isCorrect,
    selectedHeadline: { id: answer.selectedHeadlineId, text: '', isFake: false },
    correctHeadline: { id: correctAnswerId, text: '', isFake: true },
    explanation: '',
    points,
    timeBonus,
    confidencePenalty,
    streakBonus,
  };
}

/**
 * Update game streak
 */
export function updateStreak(currentStreak: number, correct: boolean): number {
  return correct ? currentStreak + 1 : 0;
}

/**
 * Calculate confidence level based on answer time
 */
export function calculateConfidence(
  timeToAnswer: number,
  config: ScoringConfig = DEFAULT_SCORING
): 'low' | 'medium' | 'high' {
  if (timeToAnswer < config.confidencePenaltyThreshold) {
    return 'high';
  } else if (timeToAnswer < config.timePressureThreshold / 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}

/**
 * Calculate total score from round results
 */
export function calculateTotalScore(results: RoundResult[]): number {
  return results.reduce((total, result) => total + result.points, 0);
}

/**
 * Get performance rating based on score and rounds
 */
export function getPerformanceRating(
  score: number,
  totalRounds: number,
  maxStreak: number
): {
  rating: 'excellent' | 'good' | 'average' | 'needs improvement';
  message: string;
} {
  const avgScore = totalRounds > 0 ? score / totalRounds : 0;
  
  if (avgScore >= 120 && maxStreak >= 3) {
    return {
      rating: 'excellent',
      message: 'Outstanding! You have a keen eye for fake news!',
    };
  } else if (avgScore >= 90 && maxStreak >= 2) {
    return {
      rating: 'good',
      message: 'Great job! You can spot most fakes.',
    };
  } else if (avgScore >= 60) {
    return {
      rating: 'average',
      message: 'Not bad! Keep practicing.',
    };
  } else {
    return {
      rating: 'needs improvement',
      message: 'Keep trying! Fake news is tricky.',
    };
  }
}
