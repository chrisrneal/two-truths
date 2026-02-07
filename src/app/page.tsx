/**
 * Main game page - Two Truths and a Lie: Internet Edition
 */
'use client';

import { useState, useEffect } from 'react';
import { Round, GameState, RoundResult } from '@/types/game';
import { startNewGame, fetchRound, submitAnswer } from './actions';
import { GameRound } from '@/components/GameRound';
import { RoundResultDisplay } from '@/components/RoundResult';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameComplete } from '@/components/GameComplete';

type GamePhase = 'welcome' | 'playing' | 'result' | 'complete' | 'loading';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = async () => {
    setPhase('loading');
    setError(null);
    
    try {
      const newGame = await startNewGame(10);
      setGameState(newGame);
      
      const round = await fetchRound(newGame.sessionId);
      setCurrentRound(round);
      setPhase('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      setPhase('welcome');
    }
  };

  const handleSelectHeadline = async (headlineId: string, timeToAnswer: number) => {
    if (!currentRound || !gameState) return;
    
    setPhase('loading');
    
    try {
      const response = await submitAnswer(currentRound.id, headlineId, timeToAnswer);
      setLastResult(response.result);
      setGameState(response.gameState);
      
      if (response.gameComplete) {
        setPhase('complete');
      } else {
        setPhase('result');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
      setPhase('playing');
    }
  };

  const handleNextRound = async () => {
    setPhase('loading');
    
    try {
      const round = await fetchRound(gameState?.sessionId);
      setCurrentRound(round);
      setPhase('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load next round');
      setPhase('result');
    }
  };

  const handleRestart = () => {
    setGameState(null);
    setCurrentRound(null);
    setLastResult(null);
    setError(null);
    setPhase('welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Two Truths and a Lie
          </h1>
          <p className="text-xl text-gray-600">Internet Edition</p>
        </header>

        <main className="flex flex-col items-center">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 max-w-2xl w-full">
              <strong>Error:</strong> {error}
            </div>
          )}

          {phase === 'welcome' && (
            <div className="max-w-2xl w-full space-y-6">
              <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to the Game!
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg">
                    Can you spot the fake headline among real news?
                  </p>
                  <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">How to Play:</h3>
                    <ul className="space-y-2 text-blue-800">
                      <li>✓ You'll see 3 headlines each round</li>
                      <li>✓ 2 are real from news sources</li>
                      <li>✓ 1 is AI-generated and fake</li>
                      <li>✓ Select the fake headline to score points</li>
                      <li>✓ Build streaks for bonus points!</li>
                      <li>✓ But don't answer too fast - there's a confidence penalty</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Tip:</strong> Take your time to read carefully, but not too long!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartGame}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Start Game 🎮
                </button>
              </div>
            </div>
          )}

          {phase === 'loading' && (
            <div className="max-w-2xl w-full">
              <div className="bg-white rounded-lg shadow-md p-12 text-center border-2 border-gray-200">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-xl text-gray-600">Loading...</p>
              </div>
            </div>
          )}

          {phase === 'playing' && gameState && currentRound && (
            <>
              <ScoreDisplay gameState={gameState} />
              <GameRound
                headlines={currentRound.headlines}
                onSelect={handleSelectHeadline}
              />
            </>
          )}

          {phase === 'result' && gameState && lastResult && (
            <>
              <ScoreDisplay gameState={gameState} />
              <RoundResultDisplay
                result={lastResult}
                onNext={handleNextRound}
              />
            </>
          )}

          {phase === 'complete' && gameState && (
            <GameComplete
              gameState={gameState}
              onRestart={handleRestart}
            />
          )}
        </main>

        <footer className="text-center mt-16 text-gray-500 text-sm">
          <p>Two Truths and a Lie: Internet Edition</p>
          <p className="mt-1">Built with Next.js, TypeScript, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}
