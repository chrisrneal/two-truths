/**
 * Determinism utilities for reproducible gameplay
 * Provides seeded random number generation and deterministic shuffling
 */

/**
 * Seeded Random Number Generator (Linear Congruential Generator)
 * Uses LCG algorithm for reproducible random sequences
 * 
 * @param seed - String seed for reproducibility
 * @returns Function that generates next random number [0, 1)
 */
export function createSeededRNG(seed: string): () => number {
  // Hash the seed to get initial state
  let hash = hashSeed(seed);
  
  return function next(): number {
    // Linear Congruential Generator: Xn+1 = (a * Xn + c) mod m
    // Parameters from Numerical Recipes (good distribution properties)
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

/**
 * Hash a string seed into a numeric value
 * 
 * @param seed - String to hash
 * @returns 32-bit integer hash
 */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Deterministically shuffle an array using Fisher-Yates algorithm with seeded RNG
 * 
 * @param array - Array to shuffle (not modified)
 * @param seed - Seed for reproducible shuffle
 * @returns New shuffled array
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];
  const rng = createSeededRNG(seed);
  
  // Fisher-Yates shuffle with seeded RNG
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Select random elements from array using seeded RNG
 * 
 * @param array - Array to select from
 * @param count - Number of elements to select
 * @param seed - Seed for reproducible selection
 * @returns Array of selected elements
 */
export function seededSelect<T>(array: T[], count: number, seed: string): T[] {
  if (array.length === 0) {
    return [];
  }
  
  // Shuffle first, then take first N elements
  const shuffled = seededShuffle(array, seed);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Generate random index using seeded RNG
 * 
 * @param max - Maximum value (exclusive)
 * @param seed - Seed for reproducibility
 * @returns Random index [0, max)
 */
export function seededRandomIndex(max: number, seed: string): number {
  const rng = createSeededRNG(seed);
  return Math.floor(rng() * max);
}
