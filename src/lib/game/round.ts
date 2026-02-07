/**
 * Round generation for Two Truths and a Lie game
 * Creates rounds with 2 real headlines and 1 fake headline, shuffled deterministically
 */

import { RealHeadline, FakeHeadline } from '@/types/game';
import { getHeadlines } from '../headlines';
import { generateFakeHeadline } from '../ai-generator';
import { seededSelect, seededShuffle } from './determinism';

/**
 * Item in a round (headline with metadata)
 */
export interface RoundItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  kind: 'real' | 'fake';
}

/**
 * Round object with all game data
 */
export interface Round {
  roundId: string;
  seed: string;
  roundIndex: number;
  startedAt: Date;
  items: RoundItem[];
  correctItemId: string; // ID of the fake headline (server-side only)
}

/**
 * Create a game round with 2 real headlines and 1 fake headline
 * 
 * @param seed - Seed for deterministic selection and shuffling
 * @param roundIndex - Index of this round (0-based)
 * @returns Round object with shuffled headlines
 */
export async function createRound(seed: string, roundIndex: number): Promise<Round> {
  // Combine seed with round index for unique but deterministic selection per round
  const roundSeed = `${seed}-round-${roundIndex}`;
  
  // Fetch all available headlines (uses cache if available)
  const allHeadlines = await getHeadlines();
  
  if (allHeadlines.length < 2) {
    throw new Error('Insufficient headlines available. Need at least 2 real headlines.');
  }
  
  // Step 1: Fetch 2 real headlines (stable via seed)
  const realHeadlines = seededSelect(allHeadlines, 2, roundSeed);
  
  // Step 2: Generate 1 fake headline based on the 2 real ones
  const fakeHeadline = await generateFakeHeadline(realHeadlines, roundSeed);
  
  // Step 3: Convert to RoundItems
  const realItems: RoundItem[] = realHeadlines.map(h => ({
    id: h.id,
    title: h.text,
    source: h.source,
    url: h.url,
    kind: 'real' as const,
  }));
  
  const fakeItem: RoundItem = {
    id: fakeHeadline.id,
    title: fakeHeadline.text,
    source: 'Generated',
    kind: 'fake' as const,
  };
  
  const allItems = [...realItems, fakeItem];
  
  // Step 4: Shuffle order deterministically
  const shuffledItems = seededShuffle(allItems, roundSeed);
  
  // Step 5: Return Round object
  return {
    roundId: `${seed}-${roundIndex}`,
    seed: seed,
    roundIndex: roundIndex,
    startedAt: new Date(),
    items: shuffledItems,
    correctItemId: fakeItem.id, // Keep server-side, do not expose to client
  };
}

/**
 * Get client-safe version of round (without correctItemId)
 * Use this when sending round data to the client
 * 
 * @param round - Full round object
 * @returns Round data safe for client consumption
 */
export function getClientRound(round: Round): Omit<Round, 'correctItemId'> {
  const { correctItemId, ...clientRound } = round;
  return clientRound;
}

/**
 * Check if a selected item is the correct answer (fake headline)
 * 
 * @param round - Round object
 * @param selectedItemId - ID of item user selected
 * @returns True if correct (user identified the fake)
 */
export function isCorrectAnswer(round: Round, selectedItemId: string): boolean {
  return round.correctItemId === selectedItemId;
}
