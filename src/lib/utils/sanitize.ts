// src/lib/utils/sanitize.ts

/**
 * Sanitize user input before sending to AI services
 * Removes control characters, collapses whitespace, limits length
 */
export function sanitizeForAI(text: string, maxLength: number = 10000): string {
  if (!text) return ''

  return (
    text
      // Remove null bytes and control characters (except newlines, tabs, carriage returns)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Collapse multiple newlines to max 2
      .replace(/\n{3,}/g, '\n\n')
      // Collapse multiple spaces/tabs to single space
      .replace(/[ \t]{2,}/g, ' ')
      // Remove leading/trailing whitespace from each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Trim overall
      .trim()
      // Limit length
      .slice(0, maxLength)
  )
}

/**
 * Sanitize text that will be spoken via TTS
 * Removes characters that cause issues with speech synthesis
 */
export function sanitizeForTTS(text: string): string {
  if (!text) return ''

  return (
    text
      // Remove markdown formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/`/g, '')
      // Remove bracketed content like [INSTRUCTION]
      .replace(/\[.*?\]/g, '')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove excessive punctuation
      .replace(/([.!?]){2,}/g, '$1')
      .trim()
  )
}
