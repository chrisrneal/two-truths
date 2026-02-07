/**
 * GameComplete component - final results and sharing
 */
'use client';

import { GameState } from '@/types/game';
import { getPerformanceRating } from '@/lib/scoring';
import { useState } from 'react';

interface GameCompleteProps {
  gameState: GameState;
  onRestart: () => void;
}

export function GameComplete({ gameState, onRestart }: GameCompleteProps) {
  const [copied, setCopied] = useState(false);
  
  const { score, rounds, maxStreak, seed } = gameState;
  const correctAnswers = rounds.filter(r => r.correct).length;
  const accuracy = rounds.length > 0 ? (correctAnswers / rounds.length) * 100 : 0;
  
  const performance = getPerformanceRating(score, rounds.length, maxStreak);
  
  const shareText = `🎯 I scored ${score} points in Two Truths and a Lie: Internet Edition!
📊 ${correctAnswers}/${rounds.length} correct (${accuracy.toFixed(0)}% accuracy)
🔥 Max streak: ${maxStreak}
📅 Today's seed: ${seed}

Can you beat my score?`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Two Truths and a Lie: My Score',
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className="text-center bg-gradient-to-br from-blue-500 to-purple-600 text-white p-12 rounded-lg">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold mb-2">Game Complete!</h1>
        <p className="text-xl opacity-90">{performance.message}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Results</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-4xl font-bold text-blue-600 mb-1">{score}</div>
            <div className="text-sm text-gray-600">Total Score</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-4xl font-bold text-green-600 mb-1">{accuracy.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-4xl font-bold text-purple-600 mb-1">{maxStreak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-4xl font-bold text-yellow-600 mb-1">{correctAnswers}/{rounds.length}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Performance Rating</h3>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              performance.rating === 'excellent' ? 'bg-green-100 text-green-700' :
              performance.rating === 'good' ? 'bg-blue-100 text-blue-700' :
              performance.rating === 'average' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {performance.rating.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p>Today's seed: <span className="font-mono font-semibold">{seed}</span></p>
          <p className="mt-1 text-xs">Share this seed to challenge friends to the same headlines!</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleShare}
          className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          {copied ? '✓ Copied to Clipboard!' : '📤 Share Results'}
        </button>
        
        <button
          onClick={onRestart}
          className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-200 transition-colors border-2 border-gray-300"
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
