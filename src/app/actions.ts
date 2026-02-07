/**
 * Server Actions for Two Truths and a Lie game
 */
'use server';

import { Round, RoundAnswer, GameState, RoundResult } from '@/types/game';
import { generateRound, processRoundAnswer, createGameSession, updateGameState, isGameComplete } from '@/lib/game-logic';
import { checkRateLimit } from '@/lib/security';
import { cookies } from 'next/headers';

// Session storage (in production, use database or Redis)
const sessions = new Map<string, GameState>();

/**
 * Start a new game session
 */
export async function startNewGame(totalRounds: number = 10): Promise<GameState> {
  // Rate limiting based on IP or session
  const identifier = 'global'; // In production, use actual IP or user ID
  const rateCheck = checkRateLimit(identifier, 20, 60000);
  
  if (!rateCheck.allowed) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  const gameState = createGameSession(totalRounds);
  sessions.set(gameState.sessionId, gameState);
  
  // Store session ID in cookie
  (await cookies()).set('gameSessionId', gameState.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return gameState;
}

/**
 * Get current game state
 */
export async function getCurrentGame(): Promise<GameState | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('gameSessionId')?.value;
  
  if (!sessionId) {
    return null;
  }
  
  return sessions.get(sessionId) || null;
}

/**
 * Fetch a new round
 */
export async function fetchRound(sessionId?: string): Promise<Round> {
  // Rate limiting
  const identifier = sessionId || 'anonymous';
  const rateCheck = checkRateLimit(identifier, 30, 60000);
  
  if (!rateCheck.allowed) {
    throw new Error('Too many requests. Please slow down.');
  }
  
  try {
    const round = await generateRound();
    return round;
  } catch (error) {
    console.error('Error generating round:', error);
    throw new Error('Failed to generate round. Please try again.');
  }
}

/**
 * Submit an answer for the current round
 */
export async function submitAnswer(
  roundId: string,
  selectedHeadlineId: string,
  timeToAnswer: number
): Promise<{
  result: RoundResult;
  gameState: GameState;
  gameComplete: boolean;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('gameSessionId')?.value;
  
  if (!sessionId) {
    throw new Error('No active game session');
  }
  
  const gameState = sessions.get(sessionId);
  if (!gameState) {
    throw new Error('Game session not found');
  }
  
  // Validate answer
  if (!selectedHeadlineId || timeToAnswer < 0) {
    throw new Error('Invalid answer');
  }
  
  // This is a simplified version - in production, store the round in the session
  // For now, we'll need to regenerate it or store it separately
  // TODO: Store round data in session for verification
  
  const answer: RoundAnswer = {
    roundId,
    selectedHeadlineId,
    timeToAnswer,
  };
  
  // For MVP, we need to fetch the round again to verify
  // In production, store rounds in session or database
  const round = await generateRound(gameState.seed);
  
  const result = processRoundAnswer(round, answer, gameState.streak);
  const updatedState = updateGameState(gameState, result);
  
  sessions.set(sessionId, updatedState);
  
  return {
    result,
    gameState: updatedState,
    gameComplete: isGameComplete(updatedState),
  };
}

/**
 * Get game summary for sharing
 */
export async function getGameSummary(sessionId: string): Promise<{
  score: number;
  rounds: number;
  maxStreak: number;
  seed: string;
} | null> {
  const gameState = sessions.get(sessionId);
  
  if (!gameState) {
    return null;
  }
  
  return {
    score: gameState.score,
    rounds: gameState.rounds.length,
    maxStreak: gameState.maxStreak,
    seed: gameState.seed,
  };
}

/**
 * Clear session data (for testing)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('gameSessionId')?.value;
  
  if (sessionId) {
    sessions.delete(sessionId);
    cookieStore.delete('gameSessionId');
  }
}
