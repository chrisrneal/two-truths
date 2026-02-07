# Two Truths and a Lie: Internet Edition

A Next.js game where players identify fake AI-generated headlines among real news.

## 🎮 Game Overview

**Two Truths and a Lie: Internet Edition** challenges players to distinguish between real news headlines and AI-generated fakes. Each round presents three headlines:
- 2 real headlines from RSS feeds/news APIs
- 1 AI-generated plausible fake

Players score points by correctly identifying the fake, with bonuses for speed and streaks.

## 🏗️ Architecture

### Tech Stack
- **Next.js 15+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Server Components & Actions** for backend logic
- **In-memory caching** for headline storage (production: Redis)

### Directory Structure
```
src/
├── app/
│   ├── actions.ts          # Server actions (game logic)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main game page
├── components/
│   ├── GameRound.tsx       # Headline display & selection
│   ├── RoundResult.tsx     # Result display after answer
│   ├── ScoreDisplay.tsx    # Current score/stats
│   └── GameComplete.tsx    # Final results & sharing
├── lib/
│   ├── ai-generator.ts     # Fake headline generation
│   ├── game-logic.ts       # Round lifecycle management
│   ├── headlines.ts        # RSS/API fetching with cache
│   ├── scoring.ts          # Points calculation
│   └── security.ts         # Sanitization & validation
└── types/
    └── game.ts             # TypeScript interfaces
```

## 📊 Data Models

### Core Types

```typescript
// Real headline from external source
interface RealHeadline {
  id: string;
  text: string;
  source: string;
  url: string;
  publishedAt: Date;
  category?: string;
}

// AI-generated fake headline
interface FakeHeadline {
  id: string;
  text: string;
  explanation: string;
  basedOn?: string[];
}

// Combined headline for game
interface GameHeadline {
  id: string;
  text: string;
  isFake: boolean;
  source?: string;
  url?: string;
  explanation?: string;
}

// Game round
interface Round {
  id: string;
  seed: string;
  headlines: GameHeadline[];
  correctAnswerId: string;
}

// Game state
interface GameState {
  sessionId: string;
  seed: string;
  currentRound: number;
  totalRounds: number;
  score: number;
  streak: number;
  maxStreak: number;
  rounds: RoundResult[];
  startedAt: Date;
  completedAt?: Date;
}
```

See `src/types/game.ts` for complete type definitions.

## 🔄 Round Lifecycle

1. **Fetch** - Retrieve real headlines from RSS feeds (cached)
2. **Generate** - Create 1 AI-generated fake headline
3. **Render** - Display 3 shuffled headlines to user
4. **Score** - Calculate points based on answer
5. **Next** - Load next round or show final results

### Implementation
```typescript
// 1. Generate round
const round = await generateRound(seed);

// 2. User selects headline
const answer = { roundId, selectedHeadlineId, timeToAnswer };

// 3. Process answer
const result = processRoundAnswer(round, answer, currentStreak);

// 4. Update game state
const updatedState = updateGameState(gameState, result);
```

## 🎯 Scoring System

### Point Calculation
- **Base Points**: 100 per correct answer
- **Time Bonus**: Up to 50 points (faster = more)
  - Applied if answered within 10 seconds
- **Confidence Penalty**: -30% (too fast)
  - Applied if answered within 2 seconds
- **Streak Bonus**: +10% per consecutive correct
  - Multiplies with current streak

### Formula
```
Points = Base + TimeBonus - ConfidencePenalty + StreakBonus
```

### Example
```
Answer time: 5 seconds
Current streak: 2

Base: 100
Time bonus: 25 (50 * 0.5)
Streak bonus: 20 (100 * 0.2)
Total: 145 points
```

## 🛡️ Security Considerations

### 1. Content Sanitization
- **XSS Prevention**: Strip HTML tags from all text
- **Input Validation**: Enforce length limits (10-500 chars)
- **URL Validation**: Verify valid HTTP/HTTPS schemes

```typescript
// All external content is sanitized
const safe = sanitizeText(untrustedInput);
```

### 2. Prompt Injection Prevention
- **Pattern Filtering**: Remove common injection attempts
- **Prompt Structure**: Use strict AI prompt templates
- **Output Validation**: Check for AI self-references

```typescript
// Before sending to AI
const safePrompt = sanitizePromptInput(userInput);
```

### 3. Rate Limiting
- **Request Throttling**: 10 requests/minute per session
- **Cache Strategy**: Minimize external API calls
- **Graceful Degradation**: Fallback to cached data

```typescript
const { allowed } = checkRateLimit(sessionId, 10, 60000);
if (!allowed) throw new Error('Rate limit exceeded');
```

### 4. Session Security
- **HTTP-only Cookies**: Session IDs not accessible to JS
- **Secure Cookies**: HTTPS-only in production
- **SameSite**: Strict to prevent CSRF
- **Short-lived**: 24-hour expiration

### 5. Data Validation
- **Type Checking**: TypeScript interfaces
- **Runtime Validation**: Check all inputs
- **Error Handling**: No sensitive data in errors

## 💾 Caching Strategy

### Headlines Cache
- **Duration**: 1 hour
- **Storage**: In-memory Map (production: Redis)
- **Invalidation**: Time-based expiration
- **Scope**: Per-source caching

```typescript
// Cache hit: return immediately
if (cached && now < cached.expiresAt) {
  return cached.headlines;
}

// Cache miss: fetch and cache
const headlines = await fetchRSSHeadlines(source);
cache.set(key, { headlines, expiresAt: now + 3600000 });
```

### Benefits
- Reduced external API calls
- Faster response times
- Cost savings
- Better resilience

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Open http://localhost:3000

### Build
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

## 📦 Dependencies

### Core
- `next@^16.1.6` - React framework
- `react@^19.2.4` - UI library
- `typescript@^5.9.3` - Type safety

### Dev
- `tailwindcss@^4.1.18` - Styling
- `eslint@^9.39.2` - Linting

## 🎯 MVP Acceptance Criteria

### Must Have (MVP)
- ✅ Display 3 headlines per round (2 real, 1 fake)
- ✅ User can select one headline
- ✅ Show correct/incorrect result
- ✅ Display explanation for fake headline
- ✅ Track score with streak bonuses
- ✅ Time pressure scoring
- ✅ Confidence penalty for too-fast answers
- ✅ RSS feed integration with caching
- ✅ Rule-based fake headline generation
- ✅ Session management
- ✅ Basic share functionality
- ✅ Mobile-responsive UI
- ✅ Content sanitization
- ✅ Rate limiting

### Testing Criteria
1. **Gameplay Flow**
   - Start game → plays 10 rounds → see final results
   - Can select headline and see immediate feedback
   - Score updates correctly

2. **Scoring**
   - Correct answer awards points
   - Streak bonus increases with consecutive correct
   - Time bonus for fast answers
   - Penalty for extremely fast answers

3. **Security**
   - No HTML injection in headlines
   - Rate limiting prevents abuse
   - Session cookies are secure

4. **Caching**
   - Headlines cached for 1 hour
   - Same headlines used within cache window
   - Cache expires and refreshes

## 🔮 Nice-to-Have Next

### Phase 2 Features
- [ ] **Real AI Integration**
  - OpenAI/Anthropic API for better fakes
  - Context-aware generation
  - Difficulty levels

- [ ] **Enhanced Sources**
  - Multiple RSS feeds
  - REST API integrations
  - Category filtering (tech, politics, sports)

- [ ] **Persistence**
  - Database for game history
  - User accounts
  - Leaderboards

- [ ] **Advanced Scoring**
  - Daily challenges
  - Difficulty modifiers
  - Power-ups

- [ ] **Social Features**
  - Friend challenges
  - Share specific rounds
  - Multiplayer mode

- [ ] **Analytics**
  - Track most difficult rounds
  - Success rates by category
  - User improvement over time

### Phase 3 Features
- [ ] **Streaming UI**
  - Server-sent events for real-time updates
  - Suspense boundaries for loading states
  - Progressive enhancement

- [ ] **Advanced Caching**
  - Redis integration
  - CDN for static assets
  - Service worker for offline play

- [ ] **A/B Testing**
  - Different AI prompts
  - UI variations
  - Scoring formula optimization

- [ ] **Accessibility**
  - Screen reader optimization
  - Keyboard navigation
  - High contrast mode

## 🔧 Configuration

### Environment Variables
```bash
# Optional: For production
NEXT_PUBLIC_BASE_URL=https://yourapp.com

# Future: AI API keys
OPENAI_API_KEY=sk-...
```

### Scoring Configuration
Edit `src/lib/scoring.ts`:
```typescript
export const DEFAULT_SCORING: ScoringConfig = {
  basePoints: 100,
  streakMultiplier: 1.5,
  timePressureThreshold: 10000,
  confidencePenaltyThreshold: 2000,
  maxTimeBonus: 50,
};
```

### Headline Sources
Edit `src/lib/headlines.ts`:
```typescript
export const DEFAULT_SOURCES: HeadlineSource[] = [
  {
    type: 'rss',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    enabled: true,
  },
  // Add more sources
];
```

## 🧪 Testing Approach

### Manual Testing Checklist
- [ ] Start new game
- [ ] Select each headline type (real, fake)
- [ ] Complete full game (10 rounds)
- [ ] Test share functionality
- [ ] Verify mobile responsiveness
- [ ] Check error handling (network failures)
- [ ] Validate rate limiting
- [ ] Test session persistence

### Future: Automated Tests
- Unit tests for scoring logic
- Integration tests for server actions
- E2E tests for game flow
- Security tests for sanitization

## 📝 API Documentation

### Server Actions

#### `startNewGame(totalRounds?: number)`
Creates a new game session.
- **Returns**: `GameState`
- **Rate Limit**: 20/minute

#### `fetchRound(sessionId?: string)`
Generates a new round with headlines.
- **Returns**: `Round`
- **Rate Limit**: 30/minute

#### `submitAnswer(roundId, selectedHeadlineId, timeToAnswer)`
Processes user answer and updates score.
- **Returns**: `{ result, gameState, gameComplete }`
- **Validates**: Answer time, headline ID

## 🤝 Contributing

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Add JSDoc comments for public functions
- Keep components focused and small

### Commit Messages
- Use conventional commits
- Be descriptive and clear

## 📄 License

ISC License - See LICENSE file

## 🙏 Acknowledgments

- Next.js team for excellent framework
- RSS feed providers for news content
- Open source community

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
