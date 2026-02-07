/**
 * Security utilities and validation schemas
 */

// Sanitize text content to prevent XSS
export function sanitizeText(text: string): string {
  // Remove any HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters
  const sanitized = withoutTags
    .replace(/[<>]/g, '')
    .trim();
  
  return sanitized;
}

// Validate headline text
export function validateHeadlineText(text: string): { valid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Headline text is required' };
  }
  
  const sanitized = sanitizeText(text);
  
  if (sanitized.length < 10) {
    return { valid: false, error: 'Headline too short (min 10 characters)' };
  }
  
  if (sanitized.length > 500) {
    return { valid: false, error: 'Headline too long (max 500 characters)' };
  }
  
  return { valid: true };
}

// Prevent prompt injection in AI generation
export function sanitizePromptInput(input: string): string {
  // Remove common prompt injection patterns
  const dangerous = [
    'ignore previous instructions',
    'ignore all previous',
    'disregard previous',
    'forget previous',
    'system:',
    'assistant:',
    'user:',
  ];
  
  let sanitized = input.toLowerCase();
  dangerous.forEach(pattern => {
    sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '');
  });
  
  return sanitizeText(input);
}

// Validate URL from external sources
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Rate limiting check (simple in-memory implementation)
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
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return { allowed: true, remainingRequests: maxRequests - recentRequests.length };
}

// Content validation for AI-generated text
export function validateAIContent(text: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for common AI hallucination patterns
  if (text.includes('As an AI')) {
    issues.push('Contains AI self-reference');
  }
  
  if (text.includes('I cannot') || text.includes('I apologize')) {
    issues.push('Contains AI refusal language');
  }
  
  // Check for excessive repetition
  const words = text.toLowerCase().split(/\s+/);
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });
  
  const maxRepetition = Math.max(...Array.from(wordCounts.values()));
  if (maxRepetition > 3 && words.length > 10) {
    issues.push('Excessive word repetition detected');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

// Generate a secure session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate a daily seed based on date
export function getDailySeed(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
