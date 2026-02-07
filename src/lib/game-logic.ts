/**
 * Round generation and game lifecycle management
 */

import { Round, GameHeadline, GameState, RoundAnswer, RoundResult } from '@/types/game';
import { getHeadlines, selectRandomHeadlines } from './headlines';
import { generateFakeHeadline } from './ai-generator';
import { calculateRoundScore, updateStreak } from './scoring';
import { getDailySeed, generateSessionId } from './security';

/**
 * Generate a new game round
 */
export async function generateRound(seed?: string): Promise<Round> {
  const gameSeed = seed || getDailySeed();
  
  // Fetch real headlines (will use cache if available)
  const allHeadlines = await getHeadlines();
  
  if (allHeadlines.length < 2) {
    throw new Error('Insufficient headlines available. Please try again later.');
  }
  
  // Select 2 random real headlines
  const realHeadlines = selectRandomHeadlines(allHeadlines, 2, gameSeed);
  
  // Generate 1 fake headline
  const fakeHeadline = await generateFakeHeadline(realHeadlines, gameSeed);
  
  // Combine into game headlines
  const gameHeadlines: GameHeadline[] = [
    ...realHeadlines.map(h => ({
      id: h.id,
      text: h.text,
      isFake: false,
      source: h.source,
      url: h.url,
    })),
    {
      id: fakeHeadline.id,
      text: fakeHeadline.text,
      isFake: true,
      explanation: fakeHeadline.explanation,
    },
  ];
  
  // Shuffle headlines
  const shuffled = shuffleArray(gameHeadlines, gameSeed);
  
  return {
    id: `round_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    seed: gameSeed,
    headlines: shuffled,
    correctAnswerId: fakeHeadline.id,
  };
}

/**
 * Process a user's answer to a round
 */
export function processRoundAnswer(
  round: Round,
  answer: RoundAnswer,
  currentStreak: number
): RoundResult {
  const selectedHeadline = round.headlines.find(h => h.id === answer.selectedHeadlineId);
  const correctHeadline = round.headlines.find(h => h.id === round.correctAnswerId);
  
  if (!selectedHeadline || !correctHeadline) {
    throw new Error('Invalid headline selection');
  }
  
  const result = calculateRoundScore(answer, round.correctAnswerId, currentStreak);
  
  // Populate headline details
  result.selectedHeadline = selectedHeadline;
  result.correctHeadline = correctHeadline;
  result.explanation = correctHeadline.explanation || 'This headline was the fabricated one.';
  
  return result;
}

/**
 * Initialize a new game session
 */
export function createGameSession(totalRounds: number = 10): GameState {
  const seed = getDailySeed();
  
  return {
    sessionId: generateSessionId(),
    seed,
    currentRound: 0,
    totalRounds,
    score: 0,
    streak: 0,
    maxStreak: 0,
    rounds: [],
    startedAt: new Date(),
  };
}

/**
 * Update game state after a round
 */
export function updateGameState(
  state: GameState,
  result: RoundResult
): GameState {
  const newStreak = updateStreak(state.streak, result.correct);
  const maxStreak = Math.max(state.maxStreak, newStreak);
  
  return {
    ...state,
    currentRound: state.currentRound + 1,
    score: state.score + result.points,
    streak: newStreak,
    maxStreak,
    rounds: [...state.rounds, result],
    completedAt: state.currentRound + 1 >= state.totalRounds ? new Date() : undefined,
  };
}

/**
 * Check if game is complete
 */
export function isGameComplete(state: GameState): boolean {
  return state.currentRound >= state.totalRounds;
}

/**
 * Shuffle array with optional seed for reproducibility
 */
function shuffleArray<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array];
  
  if (seed) {
    // Seeded shuffle
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = (hash * 9301 + 49297) % 233280;
      const j = Math.floor((hash / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } else {
    // Random shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  
  return shuffled;
}

/**
 * Generate shareable game summary
 */
export function generateShareData(state: GameState): {
  url: string;
  text: string;
  title: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/share?seed=${state.seed}&score=${state.score}`;
  
  const emoji = state.score > 800 ? '🎯' : state.score > 500 ? '👍' : '🤔';
  
  const shareText = `${emoji} I scored ${state.score} points in Two Truths and a Lie!
Max streak: ${state.maxStreak}
Rounds: ${state.rounds.length}

Can you beat my score?`;

  return {
    url: shareUrl,
    text: shareText,
    title: 'Two Truths and a Lie: My Score',
  };
}
