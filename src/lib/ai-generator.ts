/**
 * AI headline generation service
 * Generates plausible fake headlines based on real ones
 */

import { FakeHeadline, RealHeadline } from '@/types/game';
import { sanitizeText, sanitizePromptInput, validateAIContent } from './security';

/**
 * Generate a fake headline using AI
 * This is a placeholder - in production, integrate with OpenAI, Anthropic, etc.
 */
export async function generateFakeHeadline(
  realHeadlines: RealHeadline[],
  seed?: string
): Promise<FakeHeadline> {
  // For MVP, use a simple rule-based generator
  // In production, replace with actual AI API call
  
  const templates = [
    {
      pattern: (h: RealHeadline) => `${h.text.split(' ')[0]} announces unexpected merger with competitor`,
      explanation: 'This is fabricated - no such merger announcement was made.',
    },
    {
      pattern: (h: RealHeadline) => `Study finds ${getRandomTopic()} linked to ${getRandomEffect()}`,
      explanation: 'This study does not exist - it was generated to be plausible but false.',
    },
    {
      pattern: (h: RealHeadline) => `Breaking: ${getRandomLocation()} introduces controversial new ${getRandomPolicy()}`,
      explanation: 'No such policy has been introduced - this headline is fabricated.',
    },
    {
      pattern: (h: RealHeadline) => `Tech giant faces backlash over ${getRandomControversy()}`,
      explanation: 'This controversy is fictional - created to sound like recent tech news.',
    },
  ];
  
  // Select template based on seed or random
  const templateIndex = seed 
    ? Math.abs(hashCode(seed)) % templates.length
    : Math.floor(Math.random() * templates.length);
  
  const template = templates[templateIndex];
  const baseHeadline = realHeadlines[0] || { text: 'Technology advances' };
  
  const fakeText = sanitizeText(template.pattern(baseHeadline));
  
  return {
    id: `fake_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    text: fakeText,
    explanation: template.explanation,
    basedOn: realHeadlines.slice(0, 2).map(h => h.source),
  };
}

/**
 * Generate fake headline using actual AI API
 * Template for production implementation
 */
export async function generateFakeHeadlineWithAI(
  realHeadlines: RealHeadline[],
  apiKey?: string
): Promise<FakeHeadline> {
  // TODO: Implement with OpenAI or similar
  // Example prompt structure:
  const prompt = buildAIPrompt(realHeadlines);
  
  // Placeholder for AI API call
  // const response = await callAIAPI(prompt, apiKey);
  
  // For now, fall back to rule-based
  return generateFakeHeadline(realHeadlines);
}

/**
 * Build a secure prompt for AI generation
 */
function buildAIPrompt(realHeadlines: RealHeadline[]): string {
  const sanitizedHeadlines = realHeadlines
    .slice(0, 5)
    .map(h => sanitizePromptInput(h.text))
    .join('\n- ');
  
  return `You are a headline generator. Create ONE plausible but completely false news headline that could believably appear alongside these real headlines:

Real headlines:
- ${sanitizedHeadlines}

Requirements:
1. The fake headline should be topically similar to the real ones
2. It must sound professional and credible
3. It should be plausible but completely fabricated
4. Keep it under 150 characters
5. Do not include any meta-commentary or explanations
6. Just return the headline text

Fake headline:`;
}

// Helper functions for rule-based generation

function getRandomTopic(): string {
  const topics = [
    'coffee consumption',
    'social media usage',
    'workplace productivity',
    'sleep patterns',
    'exercise habits',
    'screen time',
    'remote work',
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

function getRandomEffect(): string {
  const effects = [
    'increased creativity',
    'better memory retention',
    'improved decision making',
    'reduced stress levels',
    'enhanced problem solving',
  ];
  return effects[Math.floor(Math.random() * effects.length)];
}

function getRandomLocation(): string {
  const locations = [
    'California',
    'European Union',
    'Singapore',
    'Australia',
    'Canada',
    'New York',
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomPolicy(): string {
  const policies = [
    'AI regulation framework',
    'data privacy law',
    'digital tax policy',
    'tech worker visa program',
    'cybersecurity mandate',
  ];
  return policies[Math.floor(Math.random() * policies.length)];
}

function getRandomControversy(): string {
  const controversies = [
    'data collection practices',
    'content moderation policies',
    'user privacy concerns',
    'algorithm bias issues',
    'worker treatment allegations',
  ];
  return controversies[Math.floor(Math.random() * controversies.length)];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Validate generated fake headline
 */
export function validateFakeHeadline(fake: FakeHeadline): boolean {
  if (!fake.text || fake.text.length < 10) {
    return false;
  }
  
  const contentCheck = validateAIContent(fake.text);
  return contentCheck.valid;
}
