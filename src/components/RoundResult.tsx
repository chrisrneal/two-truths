/**
 * RoundResult component - shows the result after user selection
 */
'use client';

import { RoundResult } from '@/types/game';

interface RoundResultProps {
  result: RoundResult;
  onNext: () => void;
}

export function RoundResultDisplay({ result, onNext }: RoundResultProps) {
  const { correct, selectedHeadline, correctHeadline, explanation, points, timeBonus, streakBonus } = result;
  
  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className={`text-center p-8 rounded-lg ${
        correct ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
      }`}>
        <div className="text-6xl mb-4">
          {correct ? '✅' : '❌'}
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {correct ? 'Correct!' : 'Wrong!'}
        </h2>
        <p className="text-xl text-gray-700">
          {correct 
            ? 'You successfully identified the fake headline!'
            : 'That headline was actually real!'}
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">
          {correct ? 'You selected:' : 'You selected (REAL):'}
        </h3>
        <p className="text-gray-700 mb-4">{selectedHeadline.text}</p>
        
        {!correct && (
          <>
            <h3 className="font-semibold text-lg mb-3 text-gray-900 mt-6">
              The fake headline was:
            </h3>
            <p className="text-gray-700 mb-4">{correctHeadline.text}</p>
          </>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Explanation:</h4>
          <p className="text-gray-700">{explanation}</p>
        </div>
      </div>
      
      {correct && (
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Score Breakdown:</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Points:</span>
              <span className="font-semibold text-gray-900">+{points - timeBonus - streakBonus}</span>
            </div>
            {timeBonus > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Time Bonus:</span>
                <span className="font-semibold text-green-600">+{timeBonus}</span>
              </div>
            )}
            {streakBonus > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Streak Bonus:</span>
                <span className="font-semibold text-purple-600">+{streakBonus}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-gray-200">
              <span className="font-bold text-gray-900">Total Points:</span>
              <span className="font-bold text-xl text-blue-600">+{points}</span>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={onNext}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
      >
        Next Round →
      </button>
    </div>
  );
}
