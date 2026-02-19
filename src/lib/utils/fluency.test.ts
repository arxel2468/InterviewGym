
import { describe, it, expect } from 'vitest'
import { analyzeFluency } from './fluency'

describe('analyzeFluency', () => {
  it('detects common Indian English patterns', () => {
    const result = analyzeFluency('Myself Rahul. I am having 3 years experience.')
    expect(result.grammarIssues.length).toBeGreaterThan(0)
    expect(result.grammarIssues.some((i) => i.category === 'introduction')).toBe(true)
  })

  it('identifies professional vocabulary', () => {
    const result = analyzeFluency(
      'I implemented a scalable microservices architecture and optimized database queries.'
    )
    expect(result.vocabularyLevel).toBe('advanced')
    expect(result.professionalVocabUsed.length).toBeGreaterThan(0)
  })

  it('detects confidence vs hesitation', () => {
    const confident = analyzeFluency('I successfully led the project and delivered on time.')
    const hesitant = analyzeFluency('I think maybe I probably did something.')
    expect(confident.confidenceMarkers).toBeGreaterThan(hesitant.confidenceMarkers)
  })

  it('handles empty input', () => {
    const result = analyzeFluency('')
    expect(result.grammarIssues).toEqual([])
    expect(result.vocabularyLevel).toBe('basic')
  })
})
