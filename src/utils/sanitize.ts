import DOMPurify from 'dompurify';

// Input validation and sanitization utilities
export const sanitizeInput = (input: string): string => {
  // Remove HTML tags and encode special characters
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const sanitizeHtml = (html: string): string => {
  // Allow safe HTML tags for rich text content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: []
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateLength = (input: string, min: number, max: number): boolean => {
  return input.length >= min && input.length <= max;
};

export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Rate limiting utility for client-side
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing attempts for this key
    const attempts = this.attempts.get(key) || [];
    
    // Filter out attempts outside the time window
    const recentAttempts = attempts.filter(time => time > windowStart);
    
    // Check if under the limit
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add this attempt and update the map
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
}