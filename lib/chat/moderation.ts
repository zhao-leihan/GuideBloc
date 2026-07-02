/**
 * Chat moderation utilities for filtering inappropriate content
 */

const BLOCKED_WORDS: string[] = [
  // Add inappropriate words to filter here
  // This is a minimal example - production would have a much larger list
];

const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_REGEX = /https?:\/\/[^\s]+/g;

export interface ModerationResult {
  isClean: boolean;
  flaggedContent?: string[];
  action: "allow" | "warn" | "block";
}

/**
 * Check message content for policy violations
 */
export function moderateMessage(content: string): ModerationResult {
  const flagged: string[] = [];
  const lowerContent = content.toLowerCase();

  // Check blocked words
  for (const word of BLOCKED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      flagged.push(`Blocked word: ${word}`);
    }
  }

  // Check for PII sharing (phone numbers, emails)
  if (PHONE_REGEX.test(content)) {
    flagged.push("Contains phone number");
  }
  if (EMAIL_REGEX.test(content)) {
    flagged.push("Contains email address");
  }

  // Check for external URLs
  const urls = content.match(URL_REGEX);
  if (urls && urls.length > 0) {
    flagged.push("Contains external URL");
  }

  if (flagged.length === 0) {
    return { isClean: true, action: "allow" };
  }

  // Determine action severity
  const action = flagged.some((f) => f.startsWith("Blocked word"))
    ? "block"
    : "warn";

  return {
    isClean: false,
    flaggedContent: flagged,
    action,
  };
}

/**
 * Sanitize message content (strip HTML, etc.)
 */
export function sanitizeMessage(content: string): string {
  return content
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/javascript:/gi, "") // Strip javascript: protocol
    .replace(/on\w+="[^"]*"/gi, "") // Strip event handlers
    .trim();
}

/**
 * Rate limit check - returns true if user is sending too many messages
 */
export function checkRateLimit(
  messageTimestamps: number[],
  maxMessages: number = 30,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const recentMessages = messageTimestamps.filter(
    (t) => now - t < windowMs
  );
  return recentMessages.length >= maxMessages;
}
