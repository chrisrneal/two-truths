# Two Truths and a Lie: Internet Edition

A Next.js game where players identify fake AI-generated headlines among real news. Test your news literacy and spot the difference between truth and AI-generated fiction!

## 🎮 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📖 About

**Two Truths and a Lie: Internet Edition** presents players with 3 headlines per round:
- 2 real headlines from news sources
- 1 AI-generated fake headline

Can you spot which one is fake? Build streaks, race against time, and challenge your friends!

## ✨ Features

- 🎯 **Smart Scoring**: Base points + time bonuses + streak multipliers
- ⚡ **Time Pressure**: Answer quickly for bonus points (but not too quick!)
- 🔥 **Streak System**: Build consecutive correct answers for bigger scores
- 📱 **Mobile Responsive**: Play on any device
- 🔄 **Smart Caching**: Efficient headline fetching and reuse
- 🔒 **Security First**: Content sanitization and rate limiting
- 🎨 **Modern UI**: Clean, intuitive interface built with Tailwind CSS

## 🏗️ Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [React Server Actions](https://react.dev/reference/rsc/server-actions) - Backend logic

## 📚 Documentation

For detailed implementation documentation, see [IMPLEMENTATION.md](./IMPLEMENTATION.md)

### Key Topics Covered:
- Architecture and directory structure
- Data models and TypeScript interfaces
- Round lifecycle
- Scoring system
- Security considerations (XSS, prompt injection, rate limiting)
- Caching strategy
- MVP acceptance criteria
- Future enhancements

## 🎯 How to Play

1. **Start a game** - Click "Start Game" on the welcome screen
2. **Read headlines** - Carefully examine all 3 headlines
3. **Select the fake** - Click on the headline you think is AI-generated
4. **See results** - Get immediate feedback with explanations
5. **Build streaks** - Answer correctly in a row for bonus points!
6. **Share your score** - Challenge friends after completing all rounds

## 🎨 Game Mechanics

### Scoring
- **Base Points**: 100 per correct answer
- **Time Bonus**: Up to +50 points (answer within 10 seconds)
- **Confidence Penalty**: -30 points (if answered too fast, < 2 seconds)
- **Streak Bonus**: +10% per consecutive correct answer

### Strategy Tips
- Don't rush! Read all headlines carefully
- Look for details that seem too perfect or too vague
- Real headlines often have specific names, dates, and places
- Build your streak for maximum points

## 🔧 Configuration

### Environment Variables
```bash
# Optional - for production deployment
NEXT_PUBLIC_BASE_URL=https://yourapp.com
```

### Headline Sources
Default sources include:
- BBC News
- TechCrunch
- Reuters

Edit `src/lib/headlines.ts` to add more sources.

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🛡️ Security

- **Content Sanitization**: All external content is sanitized
- **Rate Limiting**: 10-30 requests per minute per session
- **Secure Sessions**: HTTP-only, secure cookies
- **Input Validation**: Strict validation on all user inputs
- **Prompt Injection Prevention**: Sanitized AI prompts

## 🔮 Roadmap

### MVP (Current) ✅
- Core gameplay loop
- Rule-based fake headline generation
- Scoring with streaks and time pressure
- Basic share functionality
- RSS feed integration

### Phase 2 (Next)
- Real AI integration (OpenAI/Anthropic)
- Multiple headline sources and categories
- User accounts and persistence
- Leaderboards
- Daily challenges

### Phase 3 (Future)
- Multiplayer mode
- Advanced analytics
- Streaming UI with SSE
- Offline play with service workers

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- RSS feed providers for news content
- Open source community

---

**Built with Next.js, TypeScript, and Tailwind CSS**