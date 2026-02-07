// src/lib/utils/sanitize.test.ts

import { describe, it, expect } from 'vitest'
import { sanitizeForAI, sanitizeForTTS } from './sanitize'

describe('sanitizeForAI', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeForAI('')).toBe('')
  })

  it('removes control characters', () => {
    const input = 'Hello\x00World'
    const result = sanitizeForAI(input)
    expect(result).not.toContain('\x00')
  })

  it('collapses multiple newlines', () => {
    const input = 'Line 1\n\n\n\n\nLine 2'
    const result = sanitizeForAI(input)
    expect(result).toBe('Line 1\n\nLine 2')
  })

  it('trims whitespace', () => {
    const input = '  Hello World  '
    const result = sanitizeForAI(input)
    expect(result).toBe('Hello World')
  })

  it('respects maxLength', () => {
    const input = 'A'.repeat(100)
    const result = sanitizeForAI(input, 50)
    expect(result).toHaveLength(50)
  })
})

describe('sanitizeForTTS', () => {
  it('removes markdown bold', () => {
    expect(sanitizeForTTS('**bold**')).toBe('bold')
  })

  it('removes markdown italic', () => {
    expect(sanitizeForTTS('*italic*')).toBe('italic')
  })

  it('removes bracketed content', () => {
    expect(sanitizeForTTS('Hello [INSTRUCTION] World')).toBe('Hello  World')
  })

  it('removes URLs', () => {
    expect(sanitizeForTTS('Visit https://example.com please')).toBe('Visit  please')
  })
})
