/**
 * Simple test harness for determinism functions
 * Run with: node --loader tsx src/lib/game/determinism.test.ts
 * Or with: npx tsx src/lib/game/determinism.test.ts
 */

import { createSeededRNG, seededShuffle, seededSelect, seededRandomIndex } from './determinism';

// ANSI color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let testsPassed = 0;
let testsFailed = 0;

/**
 * Simple assertion helper
 */
function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`${GREEN}✓${RESET} ${message}`);
    testsPassed++;
  } else {
    console.log(`${RED}✗${RESET} ${message}`);
    testsFailed++;
  }
}

/**
 * Test: Seeded RNG produces consistent results
 */
function testSeededRNGConsistency(): void {
  console.log(`\n${BOLD}Test: Seeded RNG Consistency${RESET}`);
  
  const seed = 'test-seed-123';
  const rng1 = createSeededRNG(seed);
  const rng2 = createSeededRNG(seed);
  
  // Generate 10 numbers from each RNG
  const sequence1 = Array.from({ length: 10 }, () => rng1());
  const sequence2 = Array.from({ length: 10 }, () => rng2());
  
  // Check that sequences match
  const allMatch = sequence1.every((val, idx) => val === sequence2[idx]);
  assert(allMatch, 'Same seed produces identical sequences');
  
  // Check that values are in [0, 1) range
  const inRange = sequence1.every(val => val >= 0 && val < 1);
  assert(inRange, 'All values are in [0, 1) range');
}

/**
 * Test: Different seeds produce different sequences
 */
function testSeededRNGUniqueness(): void {
  console.log(`\n${BOLD}Test: Seeded RNG Uniqueness${RESET}`);
  
  const rng1 = createSeededRNG('seed-A');
  const rng2 = createSeededRNG('seed-B');
  
  const sequence1 = Array.from({ length: 10 }, () => rng1());
  const sequence2 = Array.from({ length: 10 }, () => rng2());
  
  // Check that sequences are different
  const anyDifferent = sequence1.some((val, idx) => val !== sequence2[idx]);
  assert(anyDifferent, 'Different seeds produce different sequences');
}

/**
 * Test: Shuffle consistency with same seed
 */
function testShuffleConsistency(): void {
  console.log(`\n${BOLD}Test: Shuffle Consistency${RESET}`);
  
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const seed = 'shuffle-seed';
  
  const shuffled1 = seededShuffle(array, seed);
  const shuffled2 = seededShuffle(array, seed);
  
  // Check that both shuffles are identical
  const allMatch = shuffled1.every((val, idx) => val === shuffled2[idx]);
  assert(allMatch, 'Same seed produces identical shuffle');
  
  // Check that shuffle contains all original elements
  const sorted = [...shuffled1].sort((a, b) => a - b);
  const originalSorted = [...array].sort((a, b) => a - b);
  const hasAllElements = sorted.every((val, idx) => val === originalSorted[idx]);
  assert(hasAllElements, 'Shuffled array contains all original elements');
  
  // Check that original array is not modified
  const originalUnchanged = array.every((val, idx) => val === [1, 2, 3, 4, 5, 6, 7, 8, 9, 10][idx]);
  assert(originalUnchanged, 'Original array is not modified');
}

/**
 * Test: Shuffle produces different results with different seeds
 */
function testShuffleUniqueness(): void {
  console.log(`\n${BOLD}Test: Shuffle Uniqueness${RESET}`);
  
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  const shuffled1 = seededShuffle(array, 'seed-X');
  const shuffled2 = seededShuffle(array, 'seed-Y');
  
  // Check that shuffles are different
  const anyDifferent = shuffled1.some((val, idx) => val !== shuffled2[idx]);
  assert(anyDifferent, 'Different seeds produce different shuffles');
}

/**
 * Test: Seeded select consistency
 */
function testSelectConsistency(): void {
  console.log(`\n${BOLD}Test: Seeded Select Consistency${RESET}`);
  
  const array = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seed = 'select-seed';
  const count = 3;
  
  const selected1 = seededSelect(array, count, seed);
  const selected2 = seededSelect(array, count, seed);
  
  // Check that both selections are identical
  const allMatch = selected1.every((val, idx) => val === selected2[idx]);
  assert(allMatch, 'Same seed produces identical selection');
  
  // Check that count is correct
  assert(selected1.length === count, `Selection has correct count (${count})`);
}

/**
 * Test: Seeded random index consistency
 */
function testRandomIndexConsistency(): void {
  console.log(`\n${BOLD}Test: Seeded Random Index Consistency${RESET}`);
  
  const seed = 'index-seed';
  const max = 100;
  
  const index1 = seededRandomIndex(max, seed);
  const index2 = seededRandomIndex(max, seed);
  
  // Check that indices are identical
  assert(index1 === index2, 'Same seed produces identical index');
  
  // Check that index is in valid range
  assert(index1 >= 0 && index1 < max, `Index is in valid range [0, ${max})`);
}

/**
 * Test: Deterministic behavior across multiple rounds
 */
function testMultiRoundDeterminism(): void {
  console.log(`\n${BOLD}Test: Multi-Round Determinism${RESET}`);
  
  const baseSeed = 'daily-seed-20260207';
  const array = ['Item1', 'Item2', 'Item3', 'Item4', 'Item5'];
  
  // Simulate 3 rounds
  const round1Seed = `${baseSeed}-round-0`;
  const round2Seed = `${baseSeed}-round-1`;
  const round3Seed = `${baseSeed}-round-2`;
  
  // Each round should be deterministic
  const r1_a = seededShuffle(array, round1Seed);
  const r1_b = seededShuffle(array, round1Seed);
  
  const r2_a = seededShuffle(array, round2Seed);
  const r2_b = seededShuffle(array, round2Seed);
  
  // Round 1 should match itself
  const round1Match = r1_a.every((val, idx) => val === r1_b[idx]);
  assert(round1Match, 'Round 1 is deterministic');
  
  // Round 2 should match itself
  const round2Match = r2_a.every((val, idx) => val === r2_b[idx]);
  assert(round2Match, 'Round 2 is deterministic');
  
  // Round 1 and Round 2 should be different
  const roundsDifferent = r1_a.some((val, idx) => val !== r2_a[idx]);
  assert(roundsDifferent, 'Different rounds produce different shuffles');
}

/**
 * Run all tests
 */
function runTests(): void {
  console.log(`${BOLD}=== Determinism Test Suite ===${RESET}`);
  
  testSeededRNGConsistency();
  testSeededRNGUniqueness();
  testShuffleConsistency();
  testShuffleUniqueness();
  testSelectConsistency();
  testRandomIndexConsistency();
  testMultiRoundDeterminism();
  
  console.log(`\n${BOLD}=== Test Results ===${RESET}`);
  console.log(`${GREEN}Passed: ${testsPassed}${RESET}`);
  console.log(`${RED}Failed: ${testsFailed}${RESET}`);
  
  if (testsFailed > 0) {
    console.log(`\n${RED}${BOLD}TESTS FAILED${RESET}`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}ALL TESTS PASSED${RESET}`);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
