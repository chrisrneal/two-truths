/**
 * GameRound component - displays headlines and handles user selection
 */
'use client';

import { useState, useEffect } from 'react';
import { GameHeadline } from '@/types/game';

interface GameRoundProps {
  headlines: GameHeadline[];
  onSelect: (headlineId: string, timeToAnswer: number) => void;
  disabled?: boolean;
}

export function GameRound({ headlines, onSelect, disabled = false }: GameRoundProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startTime] = useState<number>(Date.now());
  
  const handleSelect = (headlineId: string) => {
    if (disabled || selectedId) return;
    
    const timeToAnswer = Date.now() - startTime;
    setSelectedId(headlineId);
    onSelect(headlineId, timeToAnswer);
  };
  
  return (
    <div className="space-y-4 w-full max-w-3xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Which headline is FAKE?
        </h2>
        <p className="text-gray-600">
          Two headlines are real from news sources, one is AI-generated
        </p>
      </div>
      
      <div className="space-y-3">
        {headlines.map((headline, index) => (
          <button
            key={headline.id}
            onClick={() => handleSelect(headline.id)}
            disabled={disabled || selectedId !== null}
            className={`
              w-full p-6 rounded-lg border-2 text-left transition-all
              ${selectedId === headline.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-700">
                {index + 1}
              </span>
              <p className="flex-1 text-gray-900 leading-relaxed">
                {headline.text}
              </p>
            </div>
            {headline.source && (
              <div className="mt-3 ml-12 text-sm text-gray-500">
                Source: {headline.source}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
