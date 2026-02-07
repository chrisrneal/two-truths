# Two Truths and a Lie: Architecture & Design

## Table of Contents
1. [Overview](#overview)
2. [File Tree Structure](#file-tree-structure)
3. [Server vs Client Logic](#server-vs-client-logic)
4. [Caching Strategy](#caching-strategy)
5. [Daily Seed Determinism](#daily-seed-determinism)
6. [Security: Time Pressure & Confidence Penalty](#security-time-pressure--confidence-penalty)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Deployment Considerations](#deployment-considerations)
9. [Code Quality & Developer Experience](#code-quality--developer-experience)

---

## Overview

**Two Truths and a Lie: Internet Edition** is a Next.js 16+ application using the App Router architecture. The game challenges players to identify fake AI-generated headlines among real news headlines.

### Core Principles
- **Server-First**: Maximize server-side rendering and server actions for security and performance
- **No Database**: In-memory session storage for MVP (Vercel KV optional for future)
- **Built-in Caching**: Leverage Next.js fetch caching and revalidation
- **Security**: Never trust client timing or scoring data
- **Deterministic**: Daily seed ensures reproducible gameplay

### Tech Stack
- **Next.js 16+** (App Router, React Server Components, Server Actions)
- **TypeScript** (Strict mode for type safety)
- **Tailwind CSS** (Utility-first styling)
- **ESLint** (Code quality and linting)
- **Prettier** (Code formatting - recommended for consistency)

---

## File Tree Structure

```
two-truths/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── actions.ts                # 🔒 SERVER: Game server actions
│   │   ├── api/                      # 🔒 SERVER: API routes (optional)
│   │   │   └── test-round/
│   │   │       └── route.ts          # Test endpoint for round generation
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # 🔒 SERVER: Root layout (RSC)
│   │   └── page.tsx                  # 🖥️ CLIENT: Main game page
│   │
│   ├── components/                   # React components
│   │   ├── GameRound.tsx             # 🖥️ CLIENT: Headline display & selection
│   │   ├── RoundResult.tsx           # 🖥️ CLIENT: Result display after answer
│   │   ├── ScoreDisplay.tsx          # 🖥️ CLIENT: Score/stats display
│   │   └── GameComplete.tsx          # 🖥️ CLIENT: Final results & sharing
│   │
│   ├── lib/                          # Business logic libraries
│   │   ├── ai-generator.ts           # 🔒 SERVER: Fake headline generation
│   │   ├── game-logic.ts             # 🔒 SERVER: Round lifecycle management
│   │   ├── headlines.ts              # 🔒 SERVER: RSS/API fetching with cache
│   │   ├── mock-headlines.ts         # 🔒 SERVER: Fallback mock data
│   │   ├── scoring.ts                # 🔒 SERVER: Points calculation
│   │   └── security.ts               # 🔒 SERVER: Sanitization & validation
│   │
│   └── types/
│       └── game.ts                   # TypeScript type definitions
│
├── public/                           # Static assets (if needed)
├── .gitignore                        # Git ignore rules
├── .prettierrc.json                  # Prettier formatting configuration
├── .prettierignore                   # Prettier ignore patterns
├── ARCHITECTURE.md                   # This file
├── IMPLEMENTATION.md                 # Implementation guide
├── README.md                         # User-facing documentation
├── eslint.config.mjs                 # ESLint configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies
├── postcss.config.js                 # PostCSS configuration
├── tailwind.config.ts                # Tailwind configuration
└── tsconfig.json                     # TypeScript configuration
```

### Directory Explanations

#### `src/app/` - Next.js App Router
- **`actions.ts`**: Server Actions for game logic (runs only on server)
- **`layout.tsx`**: Server Component providing app-wide layout
- **`page.tsx`**: Client Component for interactive gameplay
- **`api/`**: Optional REST endpoints for testing/debugging

#### `src/components/` - React Components
All components are Client Components (`'use client'`) because they require:
- User interaction (clicks, timers)
- State management (useState, useEffect)
- Real-time updates (countdown timers)

#### `src/lib/` - Business Logic
All library functions run on the server (imported by Server Actions):
- **No client exposure**: Prevents tampering with game logic
- **Secure computation**: Scoring and validation happen server-side
- **External API access**: RSS feeds fetched on server only

#### `src/types/` - Type Definitions
Shared TypeScript interfaces used by both client and server code.

---

## Server vs Client Logic

### Server-Side Logic (Never Exposed to Client)

**What runs on the server:**
```typescript
// src/app/actions.ts - SERVER ACTIONS
'use server';

export async function startNewGame(totalRounds: number = 10): Promise<GameState>
export async function fetchRound(sessionId?: string): Promise<Round>
export async function submitAnswer(
  roundId: string,
  selectedHeadlineId: string,
  timeToAnswer: number  // ⚠️ Client-provided, but re-validated
): Promise<{ result, gameState, gameComplete }>
```

**Why server-side:**
1. **Security**: Scoring logic cannot be manipulated by client
2. **API Keys**: Future AI integration requires secret keys
3. **Rate Limiting**: Prevent abuse with server-side checks
4. **Data Integrity**: Headlines and game state stored on server
5. **Caching**: Shared cache across all users for headlines

**Critical: Time Validation**
```typescript
// Client sends timeToAnswer, but server doesn't fully trust it
// Server stores round start time and validates against it
const serverStartTime = sessions.get(sessionId)?.roundStartTime;
const serverEndTime = Date.now();
const actualTime = serverEndTime - serverStartTime;

// Use server-calculated time if client time is suspicious
if (Math.abs(timeToAnswer - actualTime) > 1000) {
  timeToAnswer = actualTime; // Use server time instead
}
```

### Client-Side Logic (Interactive UI)

**What runs on the client:**
```typescript
// src/app/page.tsx - CLIENT COMPONENT
'use client';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [gameState, setGameState] = useState<GameState | null>(null);
  // ... UI state management
}
```

**Why client-side:**
1. **Interactivity**: Buttons, clicks, selections require client JS
2. **Timers**: Countdown timers for user experience (not for scoring!)
3. **Animations**: Loading states, transitions, visual feedback
4. **State Management**: React state for UI phase transitions

**Important: Client Timers are UX Only**
```typescript
// Client tracks time for display purposes
const [timeElapsed, setTimeElapsed] = useState(0);

// But server re-validates and uses its own timing for scoring
// Client time is only a hint, not trusted for points
```

### Data Flow: Server Action Call

```
┌─────────────┐
│   CLIENT    │
│  (page.tsx) │
└──────┬──────┘
       │ 1. User clicks headline
       │    startTime = performance.now()
       │
       ▼
┌──────────────────────────┐
│  SERVER ACTION           │
│  submitAnswer()          │
│  (actions.ts)            │
│                          │
│  2. Validate session     │
│  3. Re-verify timing*    │
│  4. Calculate score      │
│  5. Update game state    │
│  6. Return result        │
└──────┬───────────────────┘
       │
       ▼
┌─────────────┐
│   CLIENT    │
│  Update UI  │
└─────────────┘
```

**Key Point**: Server Actions provide a secure RPC mechanism. Client code can call them like regular async functions, but they execute entirely on the server with no client exposure of internals.

---

## Caching Strategy

### 1. RSS Headline Caching

**Objective**: Minimize external API calls, reduce costs, improve reliability

**Implementation**:
```typescript
// src/lib/headlines.ts

// In-memory cache (Map)
const headlineCache = new Map<string, CachedHeadlines>();

// Cache configuration
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function getHeadlines(
  sources: HeadlineSource[] = DEFAULT_SOURCES,
  forceRefresh: boolean = false
): Promise<RealHeadline[]> {
  const now = Date.now();
  
  for (const source of sources) {
    const cacheKey = source.url;
    const cached = headlineCache.get(cacheKey);
    
    // Cache hit: return immediately
    if (!forceRefresh && cached && now < cached.expiresAt.getTime()) {
      return cached.headlines;
    }
    
    // Cache miss: fetch and cache
    const headlines = await fetchRSSHeadlines(source);
    headlineCache.set(cacheKey, {
      headlines,
      fetchedAt: new Date(now),
      expiresAt: new Date(now + CACHE_DURATION_MS),
    });
  }
}
```

**Cache Key Strategy**: `source.url` (unique per RSS feed)

**Revalidation Timing**:
- **1 hour** for RSS feeds (news doesn't change that frequently)
- Configurable per source if needed in future

**Deduplication**:
- Map-based cache ensures single fetch per URL per time window
- Multiple concurrent requests wait for first fetch to complete (could be enhanced with Promise deduplication)

### 2. Next.js Fetch Caching

**Built-in Caching**:
```typescript
// src/lib/headlines.ts

async function fetchRSSHeadlines(source: HeadlineSource): Promise<RealHeadline[]> {
  const response = await fetch(source.url, {
    next: { 
      revalidate: 3600  // 1 hour in seconds
    }
  });
  // ...
}
```

**Benefits**:
- Next.js automatically caches fetch responses
- Shared across all users (not per-session)
- Survives page reloads
- Works in Vercel serverless environment

**Alternative: Cache Tags** (for future)
```typescript
await fetch(source.url, {
  next: { 
    revalidate: 3600,
    tags: ['headlines', `source-${source.name}`]
  }
});

// Later: invalidate specific source
revalidateTag(`source-${source.name}`);
```

### 3. Session Storage (In-Memory)

**Current Implementation**:
```typescript
// src/app/actions.ts
const sessions = new Map<string, GameState>();
```

**Session Lifecycle**:
1. **Create**: `startNewGame()` generates sessionId, stores in Map
2. **Store**: sessionId saved in HTTP-only cookie
3. **Retrieve**: Each action reads sessionId from cookie
4. **Update**: Game state updated in Map after each round
5. **Expire**: No automatic expiry (MVP limitation)

**MVP Limitations**:
- ❌ Data lost on server restart
- ❌ Not shared across serverless instances
- ❌ No automatic cleanup of old sessions

**Production Upgrade Path**:
```typescript
// Replace Map with Vercel KV (Redis)
import { kv } from '@vercel/kv';

// Store session
await kv.set(`session:${sessionId}`, gameState, { ex: 86400 }); // 24h TTL

// Retrieve session
const gameState = await kv.get<GameState>(`session:${sessionId}`);
```

### 4. Caching Comparison Table

| Cache Type | Storage | Duration | Scope | Pros | Cons |
|------------|---------|----------|-------|------|------|
| **In-Memory Map** | Server RAM | Until restart | Per-instance | Fast, simple | Not persistent |
| **Next.js fetch** | Filesystem | Configurable | All instances | Built-in, CDN-friendly | Fetch only |
| **Vercel KV** | Redis | TTL-based | All instances | Persistent, fast | Requires paid plan |
| **Session Cookie** | Client | 24 hours | Per-user | No server storage | Limited size (4KB) |

### 5. Cache Invalidation Strategy

**Manual Invalidation** (for testing):
```typescript
// src/lib/headlines.ts
export function clearHeadlineCache(): void {
  headlineCache.clear();
}
```

**Automatic Invalidation**:
- Time-based: Checks `expiresAt` timestamp
- No manual invalidation needed for MVP
- Future: Webhook-triggered invalidation on news updates

---

## Daily Seed Determinism

### Why Determinism Matters

**Goal**: All players see the same rounds on the same day
- Fair comparison of scores
- "Daily challenge" feature potential
- Reproducible gameplay for testing

### Seed Generation

**Date-Based Seed**:
```typescript
// src/lib/security.ts

export function getDailySeed(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;  // Example: "20260207"
}
```

**Benefits**:
- ✅ Same seed all day (UTC timezone)
- ✅ Changes daily at midnight
- ✅ Simple, predictable format
- ✅ No database required

### Seeded Random Number Generation

**Consistent Shuffle**:
```typescript
// src/lib/game-logic.ts

function shuffleArray<T>(array: T[], seed?: string): T[] {
  if (!seed) return randomShuffle(array);
  
  // Deterministic shuffle using seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Linear congruential generator
    hash = (hash * 9301 + 49297) % 233280;
    const j = Math.floor((hash / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
```

**Properties**:
- Same seed → Same shuffle order
- Different seeds → Different orders
- Cryptographically weak (intentional, not for security)

### Headline Selection with Seed

**Deterministic Selection**:
```typescript
// src/lib/headlines.ts

export function selectRandomHeadlines(
  headlines: RealHeadline[],
  count: number,
  seed?: string
): RealHeadline[] {
  const rng = seed ? seededRandom(seed) : (() => Math.random());
  
  // Fisher-Yates shuffle with seeded RNG
  const result = [...headlines];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result.slice(0, count);
}

function seededRandom(seed: string): () => number {
  let hash = hashSeed(seed);
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}
```

### Fake Headline Generation with Seed

**Template Selection**:
```typescript
// src/lib/ai-generator.ts

export async function generateFakeHeadline(
  realHeadlines: RealHeadline[],
  seed?: string
): Promise<FakeHeadline> {
  const templates = [ /* ... */ ];
  
  // Use seed to pick template deterministically
  const templateIndex = seed 
    ? Math.abs(hashCode(seed)) % templates.length
    : Math.floor(Math.random() * templates.length);
  
  const template = templates[templateIndex];
  // ...
}
```

### Daily Seed Flow

```
┌──────────────────────────────────────────────────────┐
│  1. User starts game                                  │
│     → getDailySeed() returns "20260207"              │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  2. Generate Round 1                                  │
│     → selectRandomHeadlines(headlines, 2, "20260207")│
│     → generateFakeHeadline(headlines, "20260207")    │
│     → shuffleArray(combined, "20260207")             │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  3. All players see same headlines in same order     │
│     on the same day                                   │
└──────────────────────────────────────────────────────┘
```

### Testing with Custom Seeds

**Override for Testing**:
```typescript
// In development/testing
const testSeed = "20260207";
const round = await generateRound(testSeed);

// In production
const round = await generateRound(); // Uses today's seed
```

### Future Enhancement: Round Numbers

**Problem**: Current implementation generates same round repeatedly

**Solution**: Combine date + round number
```typescript
export function getRoundSeed(date: Date, roundNumber: number): string {
  const dailySeed = getDailySeed(date);
  return `${dailySeed}_${roundNumber}`; // "20260207_1", "20260207_2", etc.
}
```

This ensures:
- Round 1 is always the same on a given day
- Round 2 is different from Round 1
- All players see same rounds in same order

---

## Security: Time Pressure & Confidence Penalty

### The Problem: Trusting Client Timing

**Client-provided timing is inherently untrustworthy**:
- ❌ User can modify browser DevTools
- ❌ JavaScript execution can be paused
- ❌ Network latency varies
- ❌ System clock can be manipulated

**Bad Approach** (DON'T DO THIS):
```typescript
// ❌ INSECURE: Trusting client time
export async function submitAnswer(timeToAnswer: number) {
  // Client says they answered in 1ms... but did they really?
  const points = calculateScore(timeToAnswer); // EXPLOITABLE!
}
```

### Solution: Server-Side Time Tracking

**Approach 1: Round Start Timestamp** (Current Implementation)

```typescript
// src/app/actions.ts

// Store round start time when fetched
export async function fetchRound(sessionId?: string): Promise<Round> {
  const round = await generateRound();
  
  // Store server time when round was sent
  const session = sessions.get(sessionId);
  if (session) {
    session.roundStartTime = Date.now();
    sessions.set(sessionId, session);
  }
  
  return round;
}

export async function submitAnswer(
  roundId: string,
  selectedHeadlineId: string,
  timeToAnswer: number  // Client hint (not trusted)
) {
  const session = sessions.get(sessionId);
  const serverStartTime = session.roundStartTime;
  const serverEndTime = Date.now();
  
  // Calculate actual time on server
  const actualTimeToAnswer = serverEndTime - serverStartTime;
  
  // Validate client time is reasonable
  const timeDiff = Math.abs(timeToAnswer - actualTimeToAnswer);
  
  if (timeDiff > 2000) {
    // Client time differs by >2 seconds from server time
    // Use server time instead
    console.warn(`Client time mismatch: client=${timeToAnswer}, server=${actualTimeToAnswer}`);
    timeToAnswer = actualTimeToAnswer;
  }
  
  // Now use validated time for scoring
  const result = calculateRoundScore({
    roundId,
    selectedHeadlineId,
    timeToAnswer, // Validated/corrected time
  }, round.correctAnswerId, session.streak);
  
  // ...
}
```

**Approach 2: Challenge-Response** (Alternative, More Secure)

```typescript
// When sending round, include a challenge
export async function fetchRound(sessionId?: string): Promise<Round> {
  const round = await generateRound();
  const challenge = crypto.randomBytes(16).toString('hex');
  
  // Store challenge with timestamp
  sessions.get(sessionId).currentChallenge = {
    value: challenge,
    startTime: Date.now(),
    roundId: round.id,
  };
  
  return { ...round, challenge };
}

// Client must return challenge with answer
export async function submitAnswer(
  roundId: string,
  selectedHeadlineId: string,
  challenge: string
) {
  const session = sessions.get(sessionId);
  const stored = session.currentChallenge;
  
  // Verify challenge matches and wasn't reused
  if (!stored || stored.value !== challenge || stored.roundId !== roundId) {
    throw new Error('Invalid challenge');
  }
  
  // Calculate time on server only
  const timeToAnswer = Date.now() - stored.startTime;
  
  // Clear challenge (one-time use)
  delete session.currentChallenge;
  
  // Score with server-calculated time
  const result = calculateRoundScore({ 
    roundId, 
    selectedHeadlineId, 
    timeToAnswer 
  }, round.correctAnswerId, session.streak);
}
```

### Scoring with Validated Time

**Time Bonus Calculation** (Server-Side):
```typescript
// src/lib/scoring.ts

export function calculateRoundScore(
  answer: RoundAnswer,
  correctAnswerId: string,
  currentStreak: number,
  config: ScoringConfig = DEFAULT_SCORING
): RoundResult {
  const isCorrect = answer.selectedHeadlineId === correctAnswerId;
  
  if (!isCorrect) {
    return { correct: false, points: 0, /* ... */ };
  }
  
  let points = config.basePoints; // 100
  let timeBonus = 0;
  let confidencePenalty = 0;
  let streakBonus = 0;
  
  // Time bonus: Faster = more points (up to 10 seconds)
  if (answer.timeToAnswer < config.timePressureThreshold) { // 10000ms
    const timeRatio = 1 - (answer.timeToAnswer / config.timePressureThreshold);
    timeBonus = Math.floor(config.maxTimeBonus * timeRatio); // Max 50 points
    points += timeBonus;
  }
  
  // Confidence penalty: Too fast = suspicious (under 2 seconds)
  if (answer.timeToAnswer < config.confidencePenaltyThreshold) { // 2000ms
    confidencePenalty = Math.floor(config.basePoints * 0.3); // -30 points
    points -= confidencePenalty;
  }
  
  // Streak bonus: Consecutive correct answers
  if (currentStreak > 0) {
    streakBonus = Math.floor(config.basePoints * (currentStreak * 0.1)); // +10% per streak
    points += streakBonus;
  }
  
  // Ensure minimum points
  points = Math.max(points, 10);
  
  return { correct: true, points, timeBonus, confidencePenalty, streakBonus, /* ... */ };
}
```

### Configuration

**Tunable Parameters**:
```typescript
export const DEFAULT_SCORING: ScoringConfig = {
  basePoints: 100,
  streakMultiplier: 1.5,
  timePressureThreshold: 10000,      // 10 seconds - time bonus window
  confidencePenaltyThreshold: 2000,  // 2 seconds - too fast penalty
  maxTimeBonus: 50,                   // Maximum time bonus points
};
```

**Examples**:

| Time | Base | Time Bonus | Penalty | Streak (2x) | Total |
|------|------|------------|---------|-------------|-------|
| 1s   | 100  | +45        | -30     | +20         | **135** |
| 3s   | 100  | +35        | 0       | +20         | **155** |
| 7s   | 100  | +15        | 0       | +20         | **135** |
| 15s  | 100  | 0          | 0       | +20         | **120** |

### Rate Limiting (Additional Security)

**Prevent Rapid-Fire Answers**:
```typescript
// src/lib/security.ts

const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remainingRequests: number } {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return { allowed: false, remainingRequests: 0 };
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return { allowed: true, remainingRequests: maxRequests - recentRequests.length };
}
```

**Applied to Actions**:
```typescript
// src/app/actions.ts

export async function submitAnswer(/* ... */) {
  // Rate limit: max 30 answers per minute
  const rateCheck = checkRateLimit(sessionId, 30, 60000);
  if (!rateCheck.allowed) {
    throw new Error('Too many requests. Please slow down.');
  }
  
  // ... rest of logic
}
```

### Summary: Trust Nothing from Client

**Server Responsibilities**:
- ✅ Track round start time
- ✅ Calculate actual elapsed time
- ✅ Validate client time is reasonable
- ✅ Use server time for scoring
- ✅ Apply rate limiting
- ✅ Store all game state server-side

**Client Responsibilities**:
- ✅ Display countdown timer (UX only)
- ✅ Send time hint to server (validated)
- ✅ Show loading states
- ✅ Display results from server

**Never Trust Client For**:
- ❌ Scoring calculations
- ❌ Time measurements for points
- ❌ Game state management
- ❌ Validation logic

---

## Data Flow Diagrams

### 1. New Game Flow

```
┌─────────────┐
│   Browser   │
│             │
│  [Start]    │
└──────┬──────┘
       │
       │ (1) User clicks "Start Game"
       │
       ▼
┌──────────────────────────┐
│  Client Component        │
│  (page.tsx)              │
│                          │
│  handleStartGame()       │
└──────┬───────────────────┘
       │
       │ (2) Call server action
       │     await startNewGame(10)
       │
       ▼
┌──────────────────────────────────────┐
│  Server Action (actions.ts)          │
│  'use server'                        │
│                                      │
│  startNewGame(totalRounds) {         │
│    (3) checkRateLimit()              │
│    (4) sessionId = createGameSession()│
│    (5) sessions.set(sessionId, state)│
│    (6) setCookie('gameSessionId')    │
│    (7) return gameState              │
│  }                                   │
└──────┬───────────────────────────────┘
       │
       │ (8) Return gameState
       │
       ▼
┌──────────────────────────┐
│  Client Component        │
│                          │
│  setGameState(newGame)   │
└──────┬───────────────────┘
       │
       │ (9) Call fetchRound(sessionId)
       │
       ▼
┌──────────────────────────────────────┐
│  Server Action                       │
│                                      │
│  fetchRound(sessionId) {             │
│    (10) checkRateLimit()             │
│    (11) headlines = getHeadlines()   │ ─────┐
│         └─> Check cache              │      │ (12) Cache miss?
│         └─> Fetch RSS if needed      │      │      Fetch RSS
│    (13) fake = generateFakeHeadline()│      │
│    (14) shuffle([real, real, fake])  │      │
│    (15) return round                 │      │
│  }                                   │      │
└──────┬───────────────────────────────┘      │
       │                                       │
       │ (16) Return round                    │
       │                                       │
       ▼                                       ▼
┌──────────────────────────┐         ┌──────────────┐
│  Client Component        │         │ RSS Feed     │
│                          │         │ (External)   │
│  setCurrentRound(round)  │         └──────────────┘
│  setPhase('playing')     │
└──────────────────────────┘
```

### 2. Answer Submission Flow

```
┌─────────────┐
│   Browser   │
│             │
│ [User clicks│
│  headline]  │
└──────┬──────┘
       │
       │ (1) Start timer: startTime = now()
       │
       ▼
┌──────────────────────────┐
│  GameRound Component     │
│                          │
│  handleSelect(id) {      │
│    timeToAnswer =        │
│      now() - startTime   │ (2) Calculate client time
│  }                       │
└──────┬───────────────────┘
       │
       │ (3) Call submitAnswer(roundId, headlineId, timeToAnswer)
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Server Action                                  │
│  'use server'                                   │
│                                                 │
│  submitAnswer(roundId, headlineId, clientTime) {│
│    (4) sessionId = getCookie('gameSessionId')  │
│    (5) gameState = sessions.get(sessionId)     │
│    (6) serverTime = now() - gameState.startTime│
│                                                 │
│    (7) Validate clientTime vs serverTime       │
│        if (|clientTime - serverTime| > 2000) { │
│          timeToAnswer = serverTime  // Fix it  │
│        }                                        │
│                                                 │
│    (8) round = generateRound(seed) // Recreate │
│    (9) result = processRoundAnswer()           │ ──┐
│        └─> calculateRoundScore()               │   │ (10) Score calculation
│            - basePoints = 100                  │   │      (server-side only)
│            - timeBonus (if < 10s)              │   │
│            - penalty (if < 2s)                 │   │
│            - streakBonus                       │   │
│                                                 │   │
│   (11) updatedState = updateGameState()        │ ◄─┘
│   (12) sessions.set(sessionId, updatedState)   │
│   (13) return { result, gameState, complete }  │
│  }                                              │
└──────┬──────────────────────────────────────────┘
       │
       │ (14) Return result
       │
       ▼
┌──────────────────────────┐
│  Client Component        │
│                          │
│  setLastResult(result)   │
│  setGameState(updated)   │
│  setPhase('result')      │
└──────────────────────────┘
```

### 3. Caching Layers

```
┌────────────────────────────────────────────────┐
│              REQUEST FLOW                      │
└────────────────────────────────────────────────┘

   User Action
       ↓
┌──────────────┐
│ fetchRound() │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ getHeadlines()                 │
│                                │
│ Check in-memory cache          │
└─┬──────────────────────────────┘
  │
  ├─ (Cache HIT) ──→ Return cached headlines
  │                  ↓
  │                  Skip external fetch
  │
  └─ (Cache MISS) ──→ fetchRSSHeadlines()
                      ↓
              ┌───────────────────┐
              │ fetch(rss.url, {  │
              │   next: {         │
              │     revalidate:   │
              │       3600        │
              │   }               │
              │ })                │
              └─┬─────────────────┘
                │
                ├─ (Next.js Cache HIT) ──→ Return cached response
                │                          (Data Center Cache)
                │
                └─ (Next.js Cache MISS) ──→ External HTTP Request
                                            ↓
                                    ┌──────────────┐
                                    │  RSS Feed    │
                                    │  (bbc.co.uk) │
                                    └──────┬───────┘
                                           │
                                           ↓
                                    Parse & Sanitize
                                           ↓
                                    Store in Map cache
                                           ↓
                                    Return headlines
```

**Cache Layers**:
1. **In-Memory Map**: Fastest, per-instance, 1-hour TTL
2. **Next.js Fetch Cache**: Shared across instances, 1-hour revalidation
3. **External API**: Only hit on cache miss

---

## Deployment Considerations

### Vercel Deployment

**What Works Out of the Box**:
- ✅ Next.js App Router (fully supported)
- ✅ Server Actions (native support)
- ✅ Edge Runtime (optional)
- ✅ Static optimization (for RSC)
- ✅ ISR (Incremental Static Regeneration)

**MVP Limitations**:
- ⚠️ In-memory sessions lost on cold starts
- ⚠️ Each serverless instance has separate cache
- ⚠️ No session persistence across deployments

**Build Configuration**:
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Server Components (default in App Router)
  experimental: {
    // Future flags here
  },
  
  // Optimize for production
  reactStrictMode: true,
  
  // Trailing slashes (optional)
  trailingSlash: false,
};

export default nextConfig;
```

### Environment Variables

**Required for Production**:
```bash
# .env.production
NEXT_PUBLIC_BASE_URL=https://two-truths.vercel.app

# Optional: Future AI integration
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### Vercel KV Upgrade (Post-MVP)

**Replace In-Memory Sessions**:
```typescript
// Before (MVP)
const sessions = new Map<string, GameState>();

// After (Production)
import { kv } from '@vercel/kv';

export async function startNewGame(totalRounds: number = 10): Promise<GameState> {
  const gameState = createGameSession(totalRounds);
  
  // Store in Vercel KV with 24-hour expiration
  await kv.set(`session:${gameState.sessionId}`, gameState, { 
    ex: 86400  // 24 hours
  });
  
  return gameState;
}

export async function getCurrentGame(): Promise<GameState | null> {
  const sessionId = cookies().get('gameSessionId')?.value;
  if (!sessionId) return null;
  
  return await kv.get<GameState>(`session:${sessionId}`);
}
```

**Benefits**:
- ✅ Persistent across deployments
- ✅ Shared across serverless instances
- ✅ Automatic expiration (TTL)
- ✅ Redis-backed for speed

### Performance Optimizations

**1. Server Component Caching**:
```typescript
// Layout is cached by default (Server Component)
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**2. Dynamic Imports** (for heavy components):
```typescript
// Lazy load GameComplete for better initial load
const GameComplete = dynamic(() => import('@/components/GameComplete'), {
  loading: () => <div>Loading...</div>,
});
```

**3. Streaming** (future enhancement):
```typescript
// Stream rounds as they're generated
import { Suspense } from 'react';

<Suspense fallback={<LoadingSpinner />}>
  <RoundContent />
</Suspense>
```

### Monitoring & Debugging

**Server Action Errors**:
```typescript
// src/app/actions.ts
export async function fetchRound(sessionId?: string): Promise<Round> {
  try {
    const round = await generateRound();
    return round;
  } catch (error) {
    console.error('[fetchRound] Error:', error);
    // Log to monitoring service (Sentry, etc.)
    throw new Error('Failed to generate round. Please try again.');
  }
}
```

**Client Error Boundary** (future):
```typescript
// src/app/error.tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Code Quality & Developer Experience

### ESLint Configuration

**Current Setup** (`eslint.config.mjs`):
```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', '*.config.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
  },
];
```

**Linting Command**:
```bash
npm run lint       # Check for issues
npm run lint:fix   # Auto-fix issues (add to package.json)
```

### Prettier Setup (Recommended)

**Install Prettier**:
```bash
npm install --save-dev prettier eslint-config-prettier
```

**Configuration** (`.prettierrc.json`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

**Ignore File** (`.prettierignore`):
```
.next/
node_modules/
out/
build/
dist/
coverage/
*.config.js
*.config.ts
package-lock.json
```

**Package.json Scripts**:
```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

**ESLint + Prettier Integration**:
```javascript
// eslint.config.mjs
import prettier from 'eslint-config-prettier';

export default [
  // ... existing config
  prettier, // Disables ESLint rules that conflict with Prettier
];
```

### Pre-commit Hooks (Optional)

**Install Husky + lint-staged**:
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**Configure** (`.husky/pre-commit`):
```bash
#!/bin/sh
npx lint-staged
```

**lint-staged config** (`package.json`):
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

### TypeScript Configuration

**Strict Mode** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    // ... other Next.js defaults
  }
}
```

**Benefits**:
- Catch more errors at compile time
- Better IntelliSense in VS Code
- Enforce best practices

### VS Code Settings (Recommended)

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### CI/CD Quality Checks

**GitHub Actions** (`.github/workflows/ci.yml`):
```yaml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run build
```

---

## Summary: Key Architectural Decisions

### ✅ What We Did Right (MVP)

1. **Server Actions**: Secure, type-safe backend without API routes
2. **No Database**: Simple in-memory storage for rapid MVP
3. **Built-in Caching**: Leverage Next.js fetch caching for free performance
4. **TypeScript**: Type safety across client and server
5. **Daily Seed**: Deterministic gameplay without complexity
6. **Server-Side Scoring**: Never trust client for game logic

### 🔄 What to Upgrade (Post-MVP)

1. **Vercel KV**: Replace in-memory sessions for persistence
2. **AI Integration**: Replace rule-based fakes with real AI
3. **Database**: Add PostgreSQL for user accounts, leaderboards
4. **Cache Tags**: More granular cache invalidation
5. **Streaming**: Progressive rendering for better UX
6. **Error Tracking**: Sentry or similar for production monitoring

### 📚 Further Reading

- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Data Fetching & Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Author**: Architecture Team
