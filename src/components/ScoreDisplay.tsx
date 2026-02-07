/**
 * ScoreDisplay component - shows current game stats
 */
'use client';

import { GameState } from '@/types/game';

interface ScoreDisplayProps {
  gameState: GameState;
}

export function ScoreDisplay({ gameState }: ScoreDisplayProps) {
  const { score, streak, maxStreak, currentRound, totalRounds } = gameState;
  
  const progress = (currentRound / totalRounds) * 100;
  
  return (
    <div className="w-full max-w-3xl mb-8">
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{streak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{maxStreak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{currentRound}/{totalRounds}</div>
            <div className="text-sm text-gray-600">Rounds</div>
          </div>
        </div>
        
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-center mt-2 text-sm text-gray-600">
          Progress: {currentRound} of {totalRounds} rounds
        </div>
      </div>
    </div>
  );
}
