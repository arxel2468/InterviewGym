// src/lib/utils/metrics.test.ts

import { describe, it, expect } from 'vitest'
import {
  analyzeText,
  getFillerAssessment,
  getLengthAssessment,
  getTimeAssessment
} from './metrics'

describe('analyzeText', () => {
  it('counts words correctly', () => {
    const result = analyzeText('Hello world this is a test')
    expect(result.wordCount).toBe(6)
  })

  it('detects filler words', () => {
    const result = analyzeText('Um like you know I basically did it')
    expect(result.fillerWordCount).toBeGreaterThan(0)
  })

  it('counts sentences', () => {
    const result = analyzeText('First. Second! Third?')
    expect(result.sentenceCount).toBe(3)
  })
})

describe('getFillerAssessment', () => {
  it('returns Excellent for low ratio', () => {
    expect(getFillerAssessment(1, 100)).toBe('Excellent')
  })

  it('returns High for high ratio', () => {
    expect(getFillerAssessment(15, 100)).toBe('High - practice reducing')
  })

  it('handles zero words', () => {
    expect(getFillerAssessment(0, 0)).toBe('')
  })
})

describe('getLengthAssessment', () => {
  it('returns Too brief for short', () => {
    expect(getLengthAssessment(20)).toBe('Too brief')
  })

  it('returns Good length for ideal', () => {
    expect(getLengthAssessment(100)).toBe('Good length')
  })
})

describe('getTimeAssessment', () => {
  it('returns Very quick for fast', () => {
    expect(getTimeAssessment(5000)).toBe('Very quick')
  })

  it('returns Good pace for normal', () => {
    expect(getTimeAssessment(20000)).toBe('Good pace')
  })
})
